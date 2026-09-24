import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  cleanWord, 
  getEndType, 
  getPauseForEndType, 
  splitSentences, 
  splitIntoChunks, 
  formatTime, 
  countWords,
  escapeHtml 
} from '../utils/text-processing.js';

describe('Text Processing Utilities', () => {
  describe('cleanWord', () => {
    it('removes trailing comma', () => {
      expect(cleanWord('hola,')).toBe('hola');
    });

    it('removes trailing period', () => {
      expect(cleanWord('mundo.')).toBe('mundo');
    });

    it('keeps clean words', () => {
      expect(cleanWord('prueba')).toBe('prueba');
    });

    it('removes brackets', () => {
      expect(cleanWord('[texto]')).toBe('texto');
    });

    it('removes multiple punctuation', () => {
      expect(cleanWord('"hola!"')).toBe('hola');
    });
  });

  describe('getEndType', () => {
    it('detects sentence end', () => {
      expect(getEndType('fin.')).toBe('sentence');
      expect(getEndType('verdad?')).toBe('sentence');
      expect(getEndType('excelente!')).toBe('sentence');
      expect(getEndType('etc…')).toBe('sentence');
    });

    it('detects clause end', () => {
      expect(getEndType('parque,')).toBe('clause');
      expect(getEndType('ahora;')).toBe('clause');
    });

    it('detects list end', () => {
      expect(getEndType('items:')).toBe('list');
    });

    it('detects normal', () => {
      expect(getEndType('correr')).toBe('normal');
      expect(getEndType('Hola')).toBe('normal');
    });
  });

  describe('getPauseForEndType', () => {
    it('returns correct ms for each type', () => {
      expect(getPauseForEndType('sentence')).toBe(600);
      expect(getPauseForEndType('clause')).toBe(350);
      expect(getPauseForEndType('list')).toBe(300);
      expect(getPauseForEndType('normal')).toBe(200);
    });

    it('sentence has longest pause', () => {
      expect(getPauseForEndType('sentence')).toBeGreaterThanOrEqual(getPauseForEndType('clause'));
      expect(getPauseForEndType('clause')).toBeGreaterThanOrEqual(getPauseForEndType('list'));
      expect(getPauseForEndType('list')).toBeGreaterThanOrEqual(getPauseForEndType('normal'));
    });
  });

  describe('splitSentences', () => {
    it('splits by period', () => {
      const result = splitSentences('Hola. Adios.');
      expect(result.length).toBe(2);
      expect(result[0]).toBe('Hola.');
      expect(result[1]).toBe('Adios.');
    });

    it('handles question marks', () => {
      const result = splitSentences('¿Cómo? Bien.');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty text', () => {
      const result = splitSentences('');
      expect(result.length).toBe(0);
    });

    it('trims whitespace', () => {
      const result = splitSentences('  Hola.  Adios.  ');
      expect(result[0]).toBe('Hola.');
      expect(result[1]).toBe('Adios.');
    });
  });

  describe('splitIntoChunks', () => {
    it('respects sentence end', () => {
      const chunks = splitIntoChunks('Una frase corta. Otra larga.', 5);
      expect(chunks[0].endsWith).toBe('sentence');
      // Both sentences fit in one chunk with targetSize 5
      expect(chunks.length).toBe(1);
    });

    it('creates multiple chunks for long text', () => {
      const chunks = splitIntoChunks('Una frase corta. Otra larga aqui.', 3);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('respects clause end at minimum words', () => {
      const chunks = splitIntoChunks('prueba, de comma aqui.', 5);
      expect(chunks[0].endsWith === 'sentence' || chunks[0].endsWith === 'clause').toBe(true);
    });

    it('creates multiple chunks', () => {
      const text = 'Uno dos tres cuatro cinco seis siete ocho nuevo diez.';
      const chunks = splitIntoChunks(text, 5);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('handles empty text', () => {
      const chunks = splitIntoChunks('', 5);
      expect(chunks.length).toBe(0);
    });

    it('keeps chunk word count near target', () => {
      const text = 'uno dos tres cuatro cinco seis';
      const chunks = splitIntoChunks(text, 3);
      for (const chunk of chunks) {
        expect(chunk.words.length).toBeLessThanOrEqual(4);
      }
    });

    it('last chunk has sentence end type', () => {
      const chunks = splitIntoChunks('Esto es una prueba.', 4);
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.endsWith).toBe('sentence');
    });

    it('handles single word', () => {
      const chunks = splitIntoChunks('Solitaria', 5);
      expect(chunks.length).toBe(1);
      expect(chunks[0].words.length).toBe(1);
      expect(chunks[0].endsWith).toBe('normal');
    });

    it('handles all punctuation', () => {
      const chunks = splitIntoChunks('Hola. Mundo. Fin.', 5);
      for (const chunk of chunks) {
        expect(chunk.endsWith).toBe('sentence');
      }
    });

    it('handles no punctuation long text', () => {
      const text = 'Uno dos tres cuatro cinco seis siete ocho nueve diez once doce';
      const chunks = splitIntoChunks(text, 5);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      for (const chunk of chunks) {
        expect(chunk.words.length).toBeGreaterThanOrEqual(1);
        expect(chunk.words.length).toBeLessThanOrEqual(6);
      }
    });

    it('handles mixed punctuation', () => {
      const text = 'Hola, que tal. Bien, muy bien. Adios.';
      const chunks = splitIntoChunks(text, 5);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      for (const chunk of chunks) {
        expect(['sentence', 'clause', 'normal']).toContain(chunk.endsWith);
      }
    });
  });

  describe('formatTime', () => {
    it('formats MM:SS correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(59)).toBe('0:59');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('countWords', () => {
    it('counts words correctly', () => {
      expect(countWords('Hola mundo')).toBe(2);
      expect(countWords('  Uno   dos  tres  ')).toBe(3);
      expect(countWords('')).toBe(0);
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML special chars', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
      expect(escapeHtml("it's")).toBe("it&#39;s");
    });
  });
});