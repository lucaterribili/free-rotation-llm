import { z } from 'zod';
import { registerEngine } from '../registry.js';
import { textContent, withTextContent } from '../helpers.js';
import type { CompressionEngine } from '../types.js';

// Lossless clean-up of tool traffic: bytes the model cannot read as meaning.
//   - terminal control sequences (ANSI colour / cursor codes) in tool results;
//   - CRLF line endings and `\r` progress-bar redraws (only the last redraw of
//     a line is what a terminal ever showed);
//   - whitespace OUTSIDE JSON strings, in tool results that are one JSON document.
// Assistant `tool_calls` are deliberately left alone: the fidelity gate
// requires the call envelope to survive byte-for-byte.
// JSON is never parsed and re-serialized: whitespace is stripped by a scanner,
// so big integers, key order and string contents stay byte-identical.

// CSI (ESC [ … final byte) and OSC (ESC ] … BEL | ESC \) sequences.
const ANSI_RE = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g;

export function stripTerminalNoise(text: string): string {
  if (!text.includes('\u001b') && !text.includes('\r')) return text;
  const noAnsi = text.replace(ANSI_RE, '');
  return noAnsi
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => {
      const last = line.lastIndexOf('\r');
      if (last < 0) return line;
      // `a\rb` redraws the line: keep the last non-empty segment.
      const parts = line.split('\r').filter(part => part.length > 0);
      return parts.length > 0 ? parts[parts.length - 1]! : '';
    })
    .join('\n');
}

function isValidJson(text: string): boolean {
  try { JSON.parse(text); return true; } catch { return false; }
}

/** Remove insignificant whitespace from a VALID JSON document, or return it unchanged. */
export function minifyJsonText(text: string): string {
  const trimmed = text.trim();
  const first = trimmed[0];
  if (first !== '{' && first !== '[') return text;
  if (!isValidJson(trimmed)) return text;
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; out += ch; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue;
    out += ch;
  }
  return out.length < text.length ? out : text;
}

const toolOutputEngine: CompressionEngine = {
  id: 'tooloutput',
  priority: 8,
  lossless: true,
  targets: ['tool-results'],
  configSchema: z.object({ enabled: z.boolean() }).passthrough(),
  apply({ messages, context }) {
    let results = 0;
    const output = messages.map((message, index) => {
      if (context.frozenMessageIndexes.has(index)) return message;
      let next = message;
      if (message.role === 'tool') {
        const content = textContent(message);
        if (content != null) {
          const cleaned = minifyJsonText(stripTerminalNoise(content));
          if (cleaned !== content) { next = withTextContent(next, cleaned); results += 1; }
        }
      }
      return next;
    });
    return { messages: output, details: { results } };
  },
};

registerEngine(toolOutputEngine);
