import { describe, it, expect } from 'vitest';
import { parseLrc, generateLrc, extractPlainLyrics } from '../utils/lrcParser';

describe('lrcParser', () => {
  it('parses lrc timestamps and text', () => {
    const input = '[00:01.00]Hello\n[00:02.50]World';
    const parsed = parseLrc(input);
    expect(parsed.length).toBe(2);
    expect(parsed[0].time).toBeCloseTo(1.0, 2);
    expect(parsed[0].text).toBe('Hello');
  });

  it('generates lrc output', () => {
    const lrc = generateLrc([
      { time: 1.5, text: 'Line 1' },
      { time: 2.0, text: 'Line 2' },
    ]);
    expect(lrc).toContain('[00:01.50]Line 1');
    expect(lrc).toContain('[00:02.00]Line 2');
  });

  it('extracts plain lyrics', () => {
    const input = '[ti:Test]\n[00:01.00]Hello\n[00:02.00]World';
    const plain = extractPlainLyrics(input);
    expect(plain).toBe('Hello\nWorld');
  });
});
