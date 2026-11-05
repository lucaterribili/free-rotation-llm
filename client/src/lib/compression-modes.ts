// Which compression engines each mode runs. Mirrors MODE_ENGINES in
// server/src/services/compression/pipeline.ts — the server is the authority;
// this only lets the settings dialog show what a mode will actually do.
export type CompressionMode = 'off' | 'lossless' | 'standard' | 'aggressive'

export const MODE_ENGINES: Record<CompressionMode, ReadonlySet<string>> = {
  off: new Set(),
  lossless: new Set(['dedup', 'lite', 'tooloutput', 'jsoncompact']),
  standard: new Set(['dedup', 'lite', 'tooloutput', 'read-lifecycle', 'toolfilter', 'jsoncompact']),
  aggressive: new Set([
    'dedup', 'lite', 'tooloutput', 'read-lifecycle', 'toolfilter', 'jsoncompact',
    'relevance', 'aging', 'hard-budget',
  ]),
}

export function engineInMode(mode: CompressionMode, engineId: string): boolean {
  return MODE_ENGINES[mode].has(engineId)
}
