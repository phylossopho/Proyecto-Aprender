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

  while (start < allWords.length) {
    let end = start + targetSize;
    if (end > allWords.length) end = allWords.length;

    if (maxCharsPerChunk != null) {
      let chars = 0;
      let candidateEnd = start;
      for (let i = start; i < allWords.length; i++) {
        const word = allWords[i];
        const weight = word.length > 7 ? 2 : 1;
        const projected = chars + word.length + (i > start ? 1 : 0);
        if (i > start && (chars >= maxCharsPerChunk || projected > maxCharsPerChunk)) {
          break;
        }
        chars = projected;
        candidateEnd = i + 1;
      }
      if (candidateEnd > start) end = candidateEnd;
    }

    for (let i = end; i > start; i--) {
      const word = allWords[i - 1];
      if (/[.!?…]$/.test(word)) { end = i; break; }
      if (/[,;]$/.test(word) && (i - start) >= Math.ceil(targetSize / 2)) { end = i; break; }
    }

    const chunkWords = allWords.slice(start, end);
    result.push({ words: chunkWords, endsWith: getEndType(chunkWords[chunkWords.length - 1]) });
    start = end;
  }

  return result;
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
