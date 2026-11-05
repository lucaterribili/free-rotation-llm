import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@freellmapi/shared/types.js';
import { DEFAULT_COMPRESSION_CONFIG } from '../../services/compression/config.js';
import { compressRequest } from '../../services/compression/pipeline.js';
import { minifyJsonText, stripTerminalNoise } from '../../services/compression/engines/tooloutput.js';

const lossless = { ...DEFAULT_COMPRESSION_CONFIG, mode: 'lossless' as const };

describe('minifyJsonText', () => {
  it('drops whitespace outside strings only', () => {
    const src = '{\n  "a": 1,\n  "b": "x  y\\n z",\n  "c": [1, 2,  3]\n}';
    expect(minifyJsonText(src)).toBe('{"a":1,"b":"x  y\\n z","c":[1,2,3]}');
  });
  it('keeps big integers and escapes byte-identical', () => {
    const src = '{ "id": 12345678901234567890, "q": "say \\"hi\\"  " }';
    expect(minifyJsonText(src)).toBe('{"id":12345678901234567890,"q":"say \\"hi\\"  "}');
  });
  it('returns non-JSON and invalid JSON untouched', () => {
    for (const s of ['plain text', '{ not json }', '[1, 2,', '  42  ', '']) expect(minifyJsonText(s)).toBe(s);
  });
});

describe('stripTerminalNoise', () => {
  it('removes ANSI colours, CRLF and progress redraws', () => {
    expect(stripTerminalNoise('\u001b[32mPASS\u001b[0m a.test\r\n')).toBe('PASS a.test\n');
    expect(stripTerminalNoise('10%\r50%\r100%\ndone')).toBe('100%\ndone');
  });
  it('leaves clean text alone', () => {
    expect(stripTerminalNoise('  indented\n\tcode')).toBe('  indented\n\tcode');
  });
});

describe('lossless pipeline with tooloutput', () => {
  const pretty = JSON.stringify({ items: Array.from({ length: 3 }, (_, i) => ({ id: i, name: `n${i}` })) }, null, 2);
  const messages: ChatMessage[] = [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'run' },
    { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'f', arguments: '{\n  "path": "a b.ts"\n}' } }] },
    { role: 'tool', tool_call_id: 'c1', content: pretty },
    { role: 'tool', tool_call_id: 'c2', content: '\u001b[31mFAIL\u001b[0m x\r\n' },
  ];

  it('shrinks tool results without touching anything else', () => {
    const result = compressRequest(messages, { config: lossless, recordStats: false });
    expect(result.messages[3]!.content).toBe(JSON.stringify(JSON.parse(pretty)));
    expect(result.messages[4]!.content).toBe('FAIL x\n');
    expect(result.messages[2]).toEqual(messages[2]); // call envelope untouched
    expect(result.messages[0]).toEqual(messages[0]);
    expect(result.messages[1]).toEqual(messages[1]);
    expect(result.stats.enginesApplied).toContain('tooloutput');
    expect(result.stats.estSavedTokens).toBeGreaterThan(0);
  });

  it('does not mutate the input messages', () => {
    const copy = structuredClone(messages);
    compressRequest(messages, { config: lossless, recordStats: false });
    expect(messages).toEqual(copy);
  });
});
