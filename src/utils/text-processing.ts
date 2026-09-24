import type { TextChunk, EndType } from '../core/types.js';

export function cleanWord(word: string): string {
  return word.replace(/[.,;:!?()\-[\]{}"']/g, '');
}

export function renderWord(word: string): string {
  return escapeHtml(word);
}

export function getEndType(word: string): EndType {
  if (/[.!?…]$/.test(word)) return 'sentence';
  if (/[,;]$/.test(word)) return 'clause';
  if (/[:]$/.test(word)) return 'list';
  return 'normal';
}

export function getPauseForEndType(type: EndType): number {
  switch (type) {
    case 'sentence': return 600;
    case 'clause': return 350;
    case 'list': return 300;
    default: return 200;
  }
}

export function splitSentences(text: string): string[] {
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw.map(s => s.trim()).filter(s => s.length > 0);
}

export function splitIntoChunks(text: string, targetSize: number, maxCharsPerChunk?: number): TextChunk[] {
  const allWords = text.trim().split(/\s+/).filter(w => w.length > 0);
  const result: TextChunk[] = [];
  let start = 0;
  const resolvedMaxChars = maxCharsPerChunk ?? getChunkMaxCharsForWidth(window.innerWidth);

  while (start < allWords.length) {
    const first = allWords[start];
    if (first.length >= 13) {
      result.push({ words: [first], endsWith: getEndType(first) });
      start += 1;
      continue;
    }

    let end = start + 1;
    let chars = first.length;
    let hasLongWord = first.length >= 9;

    while (end < allWords.length && (end - start) < targetSize) {
      const next = allWords[end];
      if (next.length >= 13) break;
      const projected = chars + 1 + next.length;
      if (projected > resolvedMaxChars) break;
      if (hasLongWord && (end - start) >= 2) break;
      if (next.length >= 9 && (end - start) >= 2) break;
      chars = projected;
      end += 1;
      if (next.length >= 9) hasLongWord = true;
    }

    if (end > start + 1) {
      for (let i = end; i > start + 1; i--) {
        const w = allWords[i - 1];
        if (/[.!?…]$/.test(w)) { end = i; break; }
        if (/[,;]$/.test(w) && (i - start) >= Math.ceil(targetSize / 2)) { end = i; break; }
      }
    }

    const chunkWords = allWords.slice(start, end);
    result.push({ words: chunkWords, endsWith: getEndType(chunkWords[chunkWords.length - 1]) });
    start = end;
  }

  return result;
}

const CHUNK_MAXCHARS_BY_WIDTH: Array<{ width: number; maxChars: number }> = [
  { width: 320, maxChars: 28 },
  { width: 360, maxChars: 32 },
  { width: 375, maxChars: 34 },
  { width: 414, maxChars: 38 },
  { width: 480, maxChars: 45 },
  { width: 600, maxChars: 60 },
  { width: 768, maxChars: 75 },
  { width: 800, maxChars: 80 },
  { width: 1024, maxChars: 100 },
  { width: 1280, maxChars: 120 },
  { width: 1366, maxChars: 130 },
  { width: 1440, maxChars: 140 },
  { width: 1600, maxChars: 155 },
  { width: 1920, maxChars: 180 },
  { width: 2560, maxChars: 220 },
];

function getChunkMaxCharsForWidth(width: number): number {
  let maxChars = 118;
  for (const rule of CHUNK_MAXCHARS_BY_WIDTH) {
    if (width <= rule.width) {
      maxChars = rule.maxChars;
      break;
    }
  }
  return maxChars;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + s.toString().padStart(2, "0");
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
