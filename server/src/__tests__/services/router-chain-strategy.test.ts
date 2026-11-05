import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveRoutingChain,
  getRoutingStrategy,
  setRoutingStrategy,
  setProfileStrategy,
  getProfileStrategy,
  activeChainStrategy,
} from '../../services/router.js';
import { getDb, initDb } from '../../db/index.js';
import { getActiveProfileId } from '../../services/profile-models.js';

function addModelTo(profileId: number, modelId: string, priority: number) {
  const db = getDb();
  db.prepare(`
    INSERT INTO models (platform, model_id, display_name, intelligence_rank, speed_rank, size_label, monthly_token_budget, enabled, supports_vision, supports_tools)
    VALUES ('groq', ?, ?, 3, 1, 'Large', '~50M', 1, 0, 1)
  `).run(modelId, modelId);
  const id = (db.prepare('SELECT id FROM models WHERE model_id = ?').get(modelId) as { id: number }).id;
  db.prepare('INSERT INTO profile_models (profile_id, model_db_id, priority, enabled) VALUES (?, ?, ?, 1)').run(profileId, id, priority);
}

describe('per-chain routing strategy', () => {
  let activeId: number;
  let otherId: number;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    initDb(':memory:');
    const db = getDb();
    db.exec('DELETE FROM profile_models; DELETE FROM fallback_config; DELETE FROM models;');
    activeId = getActiveProfileId(db)!;
    otherId = Number(db.prepare("INSERT INTO profiles (name, type) VALUES ('Alt', 'custom')").run().lastInsertRowid);
    addModelTo(activeId, 'm-active', 1);
    addModelTo(otherId, 'm-other', 1);
    setRoutingStrategy('balanced');
  });

  it('inherits the global strategy until the chain gets its own', () => {
    const db = getDb();
    expect(getProfileStrategy(db, activeId)).toBeNull();
    expect(activeChainStrategy(db)).toEqual({ strategy: 'balanced', scope: 'global' });
    expect(resolveRoutingChain('auto').strategyOverride).toBeUndefined();
  });

  it("applies a chain's strategy only to requests routed through that chain", () => {
    const db = getDb();
    setProfileStrategy(db, activeId, 'primary-first');

    expect(resolveRoutingChain('auto').strategyOverride).toBe('primary-first');
    expect(resolveRoutingChain('auto:alt').strategyOverride).toBeUndefined();
    expect(activeChainStrategy(db)).toEqual({ strategy: 'primary-first', scope: 'chain' });
    expect(getRoutingStrategy()).toBe('balanced'); // global untouched
  });

  it('a named chain uses its own strategy, not the active chain\'s', () => {
    const db = getDb();
    setProfileStrategy(db, activeId, 'priority');
    setProfileStrategy(db, otherId, 'fastest');

    expect(resolveRoutingChain('auto').strategyOverride).toBe('priority');
    expect(resolveRoutingChain('auto:alt').strategyOverride).toBe('fastest');
  });

  it('clearing a chain strategy makes it inherit again', () => {
    const db = getDb();
    setProfileStrategy(db, activeId, 'reliable');
    setProfileStrategy(db, activeId, null);
    expect(resolveRoutingChain('auto').strategyOverride).toBeUndefined();
  });

  it('ignores a stored value that is not a valid chain strategy', () => {
    const db = getDb();
    db.prepare('UPDATE profiles SET strategy = ? WHERE id = ?').run('bogus', activeId);
    expect(getProfileStrategy(db, activeId)).toBeNull();
    db.prepare('UPDATE profiles SET strategy = ? WHERE id = ?').run('decision', activeId);
    expect(getProfileStrategy(db, activeId)).toBeNull();
  });
});
