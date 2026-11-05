import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  routeRequest,
  refreshStatsCache,
  setRoutingStrategy,
  setStickySessionsMode,
  resolveRoutingChain,
  resolveStickyPreference,
  recordRateLimitHit,
  recordSuccess,
} from '../../services/router.js';
import { getDb, initDb } from '../../db/index.js';
import { addToActiveChain } from '../helpers/chain.js';
import { setCooldown, clearCooldownEarly } from '../../services/ratelimit.js';
import { newRequestTrace, runWithRequestTrace } from '../../lib/attempt-trace.js';
import { setFallbackHeaders, recordRetryableFailure, newFallbackState, resetBenchedForNextCycle } from '../../lib/fallback-loop.js';
import { isOnCooldown } from '../../services/ratelimit.js';

// Only the rpm/rpd gate is stubbed: the cooldown tests need the real
// setCooldown/isOnCooldown pair so early recovery is exercised end to end.
const { canMakeRequestMock } = vi.hoisted(() => ({
  canMakeRequestMock: vi.fn(() => true),
}));

vi.mock('../../services/ratelimit.js', async () => {
  const actual = await vi.importActual('../../services/ratelimit.js');
  return { ...actual, canMakeRequest: canMakeRequestMock };
});

vi.mock('../../lib/crypto.js', async () => {
  const actual = await vi.importActual('../../lib/crypto.js');
  return { ...actual, decrypt: vi.fn(() => 'mocked-api-key') };
});

const ORIGINAL_DEV_MODE = process.env.DEV_MODE;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const penalized: number[] = [];

function penalize(modelDbId: number, hits: number) {
  for (let i = 0; i < hits; i++) recordRateLimitHit(modelDbId);
  penalized.push(modelDbId);
}

function addModel(opts: { platform: string; modelId: string; priority: number }): {
  modelDbId: number;
  keyId: number;
} {
  const db = getDb();
  db.prepare(`
    INSERT INTO models (platform, model_id, display_name, intelligence_rank, speed_rank, size_label, monthly_token_budget, enabled, supports_vision, supports_tools)
    VALUES (?, ?, ?, 3, 1, 'Large', '~50M', 1, 0, 1)
  `).run(opts.platform, opts.modelId, opts.modelId.toUpperCase());
  const modelDbId = (db.prepare('SELECT id FROM models WHERE platform = ? AND model_id = ?')
    .get(opts.platform, opts.modelId) as { id: number }).id;
  db.prepare('INSERT INTO fallback_config (model_db_id, priority, enabled) VALUES (?, ?, 1)')
    .run(modelDbId, opts.priority);
  addToActiveChain(modelDbId, opts.priority);
  const key = db.prepare(`
    INSERT INTO api_keys (platform, label, encrypted_key, iv, auth_tag, status, enabled)
    VALUES (?, 'k', 'enc', 'iv', 'tag', 'healthy', 1)
  `).run(opts.platform);
  return { modelDbId, keyId: Number(key.lastInsertRowid) };
}

beforeEach(() => {
  process.env.DEV_MODE = 'true';
  process.env.NODE_ENV = 'test';
  initDb(':memory:');
  getDb().exec('DELETE FROM fallback_config; DELETE FROM api_keys; DELETE FROM models; DELETE FROM requests;');
  refreshStatsCache(getDb(), true);
  canMakeRequestMock.mockReset();
  canMakeRequestMock.mockReturnValue(true);
  setRoutingStrategy('primary-first');
  setStickySessionsMode('on');
  resetBenchedForNextCycle();
});

afterEach(() => {
  for (const id of penalized) for (let i = 0; i < 12; i++) recordSuccess(id);
  penalized.length = 0;
  if (ORIGINAL_DEV_MODE === undefined) delete process.env.DEV_MODE; else process.env.DEV_MODE = ORIGINAL_DEV_MODE;
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe('primary-first routing', () => {
  it('always picks the top of the chain, ignoring penalty and bandit movement', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    addModel({ platform: 'google', modelId: 'b', priority: 20 });
    addModel({ platform: 'cerebras', modelId: 'c', priority: 30 });

    // A hand-made penalty would demote `a` under 'priority' and every scored
    // strategy. In primary-first it is soft signal and must not move the chain.
    penalize(a.modelDbId, 10);
    expect(routeRequest(100).modelId).toBe('a');

    // Several clean successes for the fallbacks do not leapfrog them either.
    recordSuccess(1000); recordSuccess(1000);
    expect(routeRequest(100).modelId).toBe('a');
  });

  it('falls back for one request only, then starts at the primary again', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    addModel({ platform: 'google', modelId: 'b', priority: 20 });

    // The failed key is skipped for THIS request — the exact shape the
    // fallback loop uses after an attempt fails.
    const first = routeRequest(100, new Set([`groq:a:${a.keyId}`]));
    expect(first.modelId).toBe('b');

    // The next request carries no skip set: the primary is back at the top.
    expect(routeRequest(100).modelId).toBe('a');
  });

  it('returns to the primary as soon as its cooldown clears (probe recovery)', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    addModel({ platform: 'google', modelId: 'b', priority: 20 });

    setCooldown('groq', 'a', a.keyId, 10 * 60_000, 'heuristic');
    expect(routeRequest(100).modelId).toBe('b');

    // The cooldown prober clears a heuristic bench early when the key answers.
    clearCooldownEarly('groq', 'a', a.keyId);
    expect(routeRequest(100).modelId).toBe('a');
  });

  it('starts at the primary again after a daily quota reset', () => {
    addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    addModel({ platform: 'google', modelId: 'b', priority: 20 });

    let primaryExhausted = true;
    canMakeRequestMock.mockImplementation((platform: string, modelId: string) =>
      !(primaryExhausted && platform === 'groq' && modelId === 'a'));

    expect(routeRequest(100).modelId).toBe('b');

    // The provider's day rolls over: the hard gate opens and primary-first
    // resumes at the top on the very next request.
    primaryExhausted = false;
    expect(routeRequest(100).modelId).toBe('a');
  });

  it('never honors a sticky pin to a fallback model', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    const b = addModel({ platform: 'google', modelId: 'b', priority: 20 });

    // Even with the persisted mode at its legacy 'on', primary-first only
    // honors a pin that still points at the chain's primary.
    expect(resolveStickyPreference(b.modelDbId)).toBeUndefined();
    expect(resolveStickyPreference(a.modelDbId)).toBe(a.modelDbId);

    setStickySessionsMode('primary_only');
    expect(resolveStickyPreference(b.modelDbId)).toBeUndefined();
    expect(resolveStickyPreference(a.modelDbId)).toBe(a.modelDbId);

    setStickySessionsMode('off');
    expect(resolveStickyPreference(a.modelDbId)).toBeUndefined();
  });

  it('uses each named profile own primary', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    const b = addModel({ platform: 'google', modelId: 'b', priority: 20 });

    const db = getDb();
    const profileId = Number(db.prepare("INSERT INTO profiles (name) VALUES ('myprofile')").run().lastInsertRowid);
    // The profile's own order puts b first, even though the active profile
    // still has a first.
    db.prepare('INSERT INTO profile_models (profile_id, model_db_id, priority, enabled) VALUES (?, ?, 1, 1)')
      .run(profileId, b.modelDbId);
    db.prepare('INSERT INTO profile_models (profile_id, model_db_id, priority, enabled) VALUES (?, ?, 2, 1)')
      .run(profileId, a.modelDbId);

    const resolved = resolveRoutingChain('auto:myprofile');
    expect(routeRequest(100, undefined, undefined, false, false, undefined, resolved.chain).modelId).toBe('b');

    // The default profile still starts at its own primary.
    expect(routeRequest(100).modelId).toBe('a');
  });

  it('records why the primary was skipped and merges it into the fallback trail', () => {
    const a = addModel({ platform: 'groq', modelId: 'a', priority: 10 });
    addModel({ platform: 'google', modelId: 'b', priority: 20 });

    setCooldown('groq', 'a', a.keyId, 10 * 60_000, 'heuristic');

    const trace = newRequestTrace();
    const headers: Record<string, string> = {};
    const route = runWithRequestTrace(trace, () => {
      const result = routeRequest(100);
      setFallbackHeaders(
        { setHeader: (name, value) => { headers[name] = value; } },
        1,
        [{ platform: 'groq', modelId: 'a', keyOrdinal: 1, errorClass: 'rate_limit' }],
      );
      return result;
    });
    expect(route.modelId).toBe('b');
    expect(trace.routeSkips.join('\n')).toContain('cooldown');

    expect(headers['X-Fallback-Trail']).toContain('groq/a key1=rate_limit');
    expect(headers['X-Fallback-Trail']).toContain('skipped');
    expect(headers['X-Fallback-Trail']).toContain('cooldown');
  });
});


describe('primary-first primary pool', () => {
  function setPrimary(modelDbId: number) {
    const db = getDb();
    db.prepare('UPDATE fallback_config SET is_primary = 1 WHERE model_db_id = ?').run(modelDbId);
    db.prepare('UPDATE profile_models SET is_primary = 1 WHERE model_db_id = ?').run(modelDbId);
  }

  it('cycles the flagged primaries first, even when a fallback ranks higher in the chain', () => {
    addModel({ platform: 'groq', modelId: 'fallback-top', priority: 1 });
    const p1 = addModel({ platform: 'google', modelId: 'p1', priority: 20 });
    const p2 = addModel({ platform: 'cerebras', modelId: 'p2', priority: 30 });
    setPrimary(p1.modelDbId); setPrimary(p2.modelDbId);

    expect(routeRequest(100).modelId).toBe('p1');
    // p1 sits this request out: the next primary of the pool serves before any fallback.
    expect(routeRequest(100, undefined, undefined, false, false, new Set([p1.modelDbId])).modelId).toBe('p2');
    // Whole pool out: only then the fallback.
    expect(routeRequest(100, undefined, undefined, false, false, new Set([p1.modelDbId, p2.modelDbId])).modelId).toBe('fallback-top');
  });

  function failure(status: number, message: string) {
    return Object.assign(new Error(message), { status });
  }

  it('a 503 benches the model for exactly the next request, with no cooldown', () => {
    const p1 = addModel({ platform: 'google', modelId: 'p1', priority: 10 });
    addModel({ platform: 'nvidia', modelId: 'fb', priority: 20 });
    setPrimary(p1.modelDbId);

    const route = routeRequest(100);
    const state = newFallbackState();
    recordRetryableFailure(route, failure(503, 'This model is currently experiencing high demand'), state);
    expect(isOnCooldown('google', 'p1', p1.keyId)).toBe(false);

    const next = newFallbackState();            // the next request sits p1 out
    expect(next.skipModels.has(p1.modelDbId)).toBe(true);
    expect(routeRequest(100, next.skipKeys, undefined, false, false, next.skipModels).modelId).toBe('fb');

    const after = newFallbackState();           // and the one after is back to normal
    expect(after.skipModels.size).toBe(0);
    expect(routeRequest(100, after.skipKeys, undefined, false, false, after.skipModels).modelId).toBe('p1');
  });

  it('a 429 does not bench: the next request retries the primary at once', () => {
    const p1 = addModel({ platform: 'google', modelId: 'p1', priority: 10 });
    addModel({ platform: 'nvidia', modelId: 'fb', priority: 20 });
    setPrimary(p1.modelDbId);

    const route = routeRequest(100);
    recordRetryableFailure(route, failure(429, 'Too many requests'), newFallbackState());
    expect(isOnCooldown('google', 'p1', p1.keyId)).toBe(false);

    const next = newFallbackState();
    expect(next.skipModels.size).toBe(0);
    expect(routeRequest(100, next.skipKeys, undefined, false, false, next.skipModels).modelId).toBe('p1');
  });
});
