import { describe, it, expect } from 'vitest';
import { applyEnvAliases } from '../../lib/env-aliases.js';

describe('applyEnvAliases', () => {
  it('mirrors FREE_ROTATION_LLM_* onto the legacy FREELLMAPI_* name', () => {
    const env: NodeJS.ProcessEnv = { FREE_ROTATION_LLM_COMPRESSION: 'lossless' };
    applyEnvAliases(env);
    expect(env.FREELLMAPI_COMPRESSION).toBe('lossless');
  });

  it('lets the new name win when both are set', () => {
    const env: NodeJS.ProcessEnv = { FREELLMAPI_UPDATE_CHECK: 'on', FREE_ROTATION_LLM_UPDATE_CHECK: 'off' };
    applyEnvAliases(env);
    expect(env.FREELLMAPI_UPDATE_CHECK).toBe('off');
  });

  it('leaves legacy-only and unrelated variables alone', () => {
    const env: NodeJS.ProcessEnv = { FREELLMAPI_API_KEY: 'k', PORT: '3001' };
    applyEnvAliases(env);
    expect(env).toEqual({ FREELLMAPI_API_KEY: 'k', PORT: '3001' });
  });
});
