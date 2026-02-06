// Parse and generate LRC files
export interface SyncedLine {
  time: number;
  text: string;
}

export function parseLrc(lrcText: string): SyncedLine[] {
  const lines = lrcText.split(/\r?\n/);
  const synced: SyncedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\[(ti|ar|al|by|offset):/i.test(trimmed)) continue;

    const matches = trimmed.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g);
    if (!matches || matches.length === 0) continue;

    const first = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/.exec(matches[0]);
    if (!first) continue;

    const minutes = parseInt(first[1], 10);
    const seconds = parseInt(first[2], 10);
    const msPart = first[3] || "0";
    const milliseconds = parseInt(msPart.padEnd(3, "0"), 10);
    const time = minutes * 60 + seconds + milliseconds / 1000;

    const lastClose = trimmed.lastIndexOf("]");
    const text = trimmed.substring(lastClose + 1).trim();
    if (text) synced.push({ time, text });
  }

  synced.sort((a, b) => a.time - b.time);
  return synced;
}

export function generateLrc(lines: SyncedLine[], metadata?: { title?: string; artist?: string }) {
  let out = "";
  if (metadata?.title) out += `[ti:${metadata.title}]\n`;
  if (metadata?.artist) out += `[ar:${metadata.artist}]\n`;

  for (const { time, text } of lines) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const centiseconds = Math.floor((time % 1) * 100);
    const stamp = `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}]`;
    out += `${stamp}${text}\n`;
  }

  return out;
}

export function extractPlainLyrics(lrcText: string): string {
  const lines = lrcText.split(/\r?\n/);
  const plain: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\[(ti|ar|al|by|offset):/i.test(trimmed)) continue;
    const lastClose = trimmed.lastIndexOf("]");
    if (lastClose === -1) continue;
    const text = trimmed.substring(lastClose + 1).trim();
    if (text) plain.push(text);
  }

  return plain.join('\n');
}
