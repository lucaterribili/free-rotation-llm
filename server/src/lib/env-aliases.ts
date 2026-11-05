// FREE_ROTATION_LLM_* is the project's own prefix for environment variables;
// FREELLMAPI_* is the legacy spelling every existing .env, script and compose
// file already uses. Rather than touch the many places that read the legacy
// name, each FREE_ROTATION_LLM_<X> is mirrored onto FREELLMAPI_<X> once at
// startup. The new name wins when both are set, so a migrating install can add
// the new variable without removing the old one first.

const NEW_PREFIX = 'FREE_ROTATION_LLM_';
const LEGACY_PREFIX = 'FREELLMAPI_';

export function applyEnvAliases(env: NodeJS.ProcessEnv = process.env): void {
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(NEW_PREFIX) || value === undefined) continue;
    env[LEGACY_PREFIX + key.slice(NEW_PREFIX.length)] = value;
  }
}
