import type { AppState, TextChunk, EndType } from '../core/types.js';
import { StateManager } from '../core/state.js';
import { getPauseForEndType, cleanWord, escapeHtml } from '../utils/text-processing.js';

export interface Engine {
  render(): void;
  scheduleNext(): void;
  pause(): void;
  resume(): void;
  clear(): void;
  onWPMChange?(): void;
  getDuration?(): number;
}

export abstract class BaseEngine implements Engine {
  protected state = StateManager.getInstance();
  protected wordDisplay: HTMLElement | null = null;
  protected lineTimerFill: HTMLElement | null = null;
  protected lineTimerBar: HTMLElement | null = null;

  constructor() {
    this.cacheElements();
  }

  protected cacheElements(): void {
    this.wordDisplay = document.getElementById('word-display');
    this.lineTimerFill = document.getElementById('line-timer-fill');
    this.lineTimerBar = document.getElementById('line-timer-bar');
  }

  abstract render(): void;
  abstract scheduleNext(): void;
  abstract pause(): void;
  abstract resume(): void;
  abstract clear(): void;

  protected getCurrentChunkPause(): number {
    const { mode, chunks, currentChunk, chunkPauseMs } = this.state.getState();
    if (mode === 'chunk' && chunks[currentChunk]) {
      return getPauseForEndType(chunks[currentChunk].endsWith);
    }
    return chunkPauseMs;
  }

  protected updateCounter(): void {
    const counter = document.getElementById('word-counter');
    if (!counter) return;

    const { mode, words, chunks, sentences, currentIndex, currentChunk, currentSentence } = this.state.getState();
    let current = 1, total = 1;

    if (mode === 'word') { current = currentIndex + 1; total = words.length; }
    else if (mode === 'chunk') { current = currentChunk + 1; total = chunks.length; }
    else if (mode === 'line') { current = currentSentence + 1; total = sentences.length; }

    counter.textContent = `${current} / ${total}`;
  }

   protected updateModeBadge(): void {
    const badge = document.getElementById('mode-badge');
    if (!badge) return;

    const { mode, isRunning } = this.state.getState();
    const labels: Record<string, string> = {
      word: 'Palabra', chunk: 'Grupo', line: 'Frase', galactico: 'Galáctico', texts: 'Textos',
      bionic: 'Bionic', columna: 'Columna', pacer: 'Guía', sinregresion: 'Sin regresión', skim: 'Skim',
    };
    badge.textContent = labels[mode] || mode;
    badge.style.display = isRunning ? 'none' : 'block';
  }

  protected setWordDisplayClass(className: string): void {
    if (this.wordDisplay) {
      this.wordDisplay.className = className;
    }
  }

  protected setWordDisplayHTML(html: string): void {
    if (this.wordDisplay) {
      this.wordDisplay.innerHTML = html;
    }
  }
}

export class WordEngine extends BaseEngine {
  render(): void {
    const { words, currentIndex } = this.state.getState();
    if (words.length === 0) {
      this.setWordDisplayHTML('<span>Prepara tu texto</span>');
      return;
    }

    let html = '';
    const end = Math.min(currentIndex + 1, words.length);
    const ctxBefore = currentIndex - 1;
    const ctxAfter = currentIndex + 1;

    if (ctxBefore >= 0) {
      html += `<span class="context-extra">${cleanWord(words[ctxBefore])} </span>`;
    }

    for (let i = currentIndex; i < end; i++) {
      html += `<span class="pointer">|</span><span class="focal">${cleanWord(words[i])}</span>`;
    }

    if (ctxAfter < words.length) {
      html += ` <span class="context-extra">${cleanWord(words[ctxAfter])}</span>`;
    }

    this.setWordDisplayClass('word-display fade-in');
    this.setWordDisplayHTML(html);
    this.updateCounter();
    this.updateModeBadge();
  }

  scheduleNext(): void {
    const { wpm, isRunning, isPaused } = this.state.getState();
    if (!isRunning || isPaused) return;

    const interval = (60 / wpm) * 1000;
    const timeout = setTimeout(() => {
      if (this.state.getState().isRunning && !this.state.getState().isPaused) {
        const finished = this.state.advanceNext();
        if (finished) {
          this.state.finishSession();
          return;
        }
        this.render();
        this.scheduleNext();
      }
    }, interval);

    this.state.setScheduleTimeout(timeout);
  }

  pause(): void {
    this.state.clearSchedule();
  }

  resume(): void {
    this.scheduleNext();
  }

  clear(): void {
    this.state.clearSchedule();
    this.setWordDisplayHTML('<span>Prepara tu texto y haz clic en Iniciar</span>');
    this.setWordDisplayClass('word-display');
  }
}

export class ChunkEngine extends BaseEngine {
  render(): void {
    const { chunks, currentChunk } = this.state.getState();
    if (chunks.length === 0) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }

    const chunkData = chunks[currentChunk];
    const chunkWords = chunkData.words;
    let html = '<div class="chunk-box">';

    for (let i = 0; i < chunkWords.length; i++) {
      html += `<span class="chunk-word">${cleanWord(chunkWords[i])}</span>`;
    }
    html += '</div>';

    this.state.update({ chunkPauseMs: getPauseForEndType(chunkData.endsWith) });

    this.setWordDisplayClass('word-display chunk-mode fade-in');
    this.setWordDisplayHTML(html);
    this.updateCounter();
    this.updateModeBadge();
  }

  scheduleNext(): void {
    const { wpm, chunkSize, isRunning, isPaused, chunkPauseMs } = this.state.getState();
    if (!isRunning || isPaused) return;

    const pauseScale = Math.max(0.5, 250 / wpm);
    const scaledPause = Math.round(chunkPauseMs * pauseScale);
    const interval = scaledPause + (60 / wpm) * 1000 * chunkSize * 0.3;

    const timeout = setTimeout(() => {
      if (this.state.getState().isRunning && !this.state.getState().isPaused) {
        const finished = this.state.advanceNext();
        if (finished) {
          this.state.finishSession();
          return;
        }
        this.render();
        this.scheduleNext();
      }
    }, interval);

    this.state.setScheduleTimeout(timeout);
  }

  pause(): void {
    this.state.clearSchedule();
  }

  resume(): void {
    this.scheduleNext();
  }

  clear(): void {
    this.state.clearSchedule();
    this.setWordDisplayHTML('<span>Prepara tu texto y haz clic en Iniciar</span>');
    this.setWordDisplayClass('word-display');
  }
}

export class LineEngine extends BaseEngine {
  private sentenceStartTime = 0;
  private sentenceDuration = 0;

  render(): void {
    const { sentences, currentSentence, wpm } = this.state.getState();
    if (sentences.length === 0) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }

    const sentence = sentences[currentSentence];
    const totalWords = sentence.split(/\s+/).filter(w => w.length > 0).length;

    this.setWordDisplayClass('line-display fade-in');
    this.setWordDisplayHTML(sentence);

    this.state.update({ currentIndex: currentSentence });

    const counter = document.getElementById('word-counter');
    if (counter) counter.style.display = 'none';

    if (this.lineTimerBar) this.lineTimerBar.style.display = 'block';

    this.sentenceStartTime = Date.now();
    this.sentenceDuration = (totalWords / wpm) * 60000;
    if (this.sentenceDuration < 1500) this.sentenceDuration = 1500;

    this.updateModeBadge();
  }

  updateLineTimer(): void {
    if (!this.lineTimerFill) return;
    const elapsed = Date.now() - this.sentenceStartTime;
    const remaining = Math.max(0, 1 - elapsed / this.sentenceDuration);
    this.lineTimerFill.style.width = `${remaining * 100}%`;
  }

  onWPMChange(): void {
    const { sentences, currentSentence, wpm, isRunning, isPaused } = this.state.getState();
    if (!isRunning || isPaused || sentences.length === 0) return;

    const sentence = sentences[currentSentence];
    const totalWords = sentence.split(/\s+/).filter(w => w.length > 0).length;
    this.sentenceDuration = (totalWords / wpm) * 60000;
    if (this.sentenceDuration < 1500) this.sentenceDuration = 1500;
    this.sentenceStartTime = Date.now();
    this.updateLineTimer();
  }

  scheduleNext(): void {
    const { isRunning, isPaused } = this.state.getState();
    if (!isRunning || isPaused) return;

    const timeout = setTimeout(() => {
      if (this.state.getState().isRunning && !this.state.getState().isPaused) {
        const finished = this.state.advanceNext();
        if (finished) {
          this.state.finishSession();
          return;
        }
        this.render();
        this.scheduleNext();
      }
    }, this.sentenceDuration);

    this.state.setScheduleTimeout(timeout);
  }

  pause(): void {
    this.state.clearSchedule();
  }

  resume(): void {
    this.scheduleNext();
  }

  clear(): void {
    this.state.clearSchedule();
    this.setWordDisplayHTML('<span>Prepara tu texto y haz clic en Iniciar</span>');
    this.setWordDisplayClass('word-display');
    if (this.lineTimerBar) this.lineTimerBar.style.display = 'none';
    if (this.lineTimerFill) this.lineTimerFill.style.width = '100%';
  }
}

export class GalacticoEngine extends BaseEngine {
  private static readonly COUNTDOWN_DURATION = 3000;
  private static readonly PRE_SCROLL_DURATION = 2500;
  private static readonly FADEOUT_DURATION = 1000;

  private galacticoScroller: HTMLElement | null = null;
  private galacticoContent: HTMLElement | null = null;
  private countdownElement: HTMLElement | null = null;

  render(): void {
    const { words } = this.state.getState();
    const text = words.join(' ');
    const groups = this.splitGalacticoGroups(text);
    this.state.setGalacticoState({ galacticoGroups: groups, galacticoCurrentGroup: 0 });

    if (groups.length === 0) {
      this.setWordDisplayHTML('<span>Prepara tu texto</span>');
      return;
    }

    let html = '';
    for (const group of groups) {
      html += `<div class="galactico-chunk">${escapeHtml(group)}</div>`;
    }

    this.setWordDisplayClass('word-display galactico-display');
    document.body.classList.add('galactico-bg');
    this.setWordDisplayHTML(`<div class="galactico-scroller"><div class="galactico-content">${html}</div></div>`);

    this.galacticoScroller = this.wordDisplay?.querySelector('.galactico-scroller') as HTMLElement | null;
    this.galacticoContent = this.wordDisplay?.querySelector('.galactico-content') as HTMLElement | null;

    this.calculateDimensions();
    this.setInitialPosition();
    this.startCountdown();
  }

  private splitGalacticoGroups(text: string): string[] {
    const allWords = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (allWords.length === 0) return [];
    if (allWords.length <= 3) return [allWords.join(' ')];

    const maxChars = 25;
    const minChars = 10;
    const maxWords = 5;
    const groups: string[] = [];
    let current: string[] = [];

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      const testLen = current.length > 0 ? current.join(' ').length + 1 + word.length : word.length;

      if (current.length > 0 && (testLen > maxChars || current.length >= maxWords)) {
        groups.push(current.join(' '));
        current = [];
      }

      current.push(word);

      if (/[.!?]$/.test(current[current.length - 1]) && current.length >= 2) {
        groups.push(current.join(' '));
        current = [];
      } else if (/[,;]$/.test(current[current.length - 1]) && current.length >= 2) {
        groups.push(current.join(' '));
        current = [];
      }
    }

    if (current.length > 0) groups.push(current.join(' '));

    const merged: string[] = [];
    for (let i = 0; i < groups.length; i++) {
      const groupLen = groups[i].length;
      if (groupLen < minChars && merged.length > 0) {
        const potential = merged[merged.length - 1] + ' ' + groups[i];
        if (potential.length <= maxChars + 10) {
          merged[merged.length - 1] = potential;
        } else {
          merged.push(groups[i]);
        }
      } else if (groupLen < minChars && i + 1 < groups.length) {
        const potential = groups[i] + ' ' + groups[i + 1];
        if (potential.length <= maxChars + 10) {
          merged.push(potential);
          i++;
        } else {
          merged.push(groups[i]);
        }
      } else {
        merged.push(groups[i]);
      }
    }

    return merged;
  }

  private calculateDimensions(): void {
    const { wpm, words, galacticoGroups } = this.state.getState();
    const viewportHeight = this.wordDisplay?.clientHeight || window.innerHeight;
    const contentHeight = this.galacticoContent?.offsetHeight || this.galacticoContent?.scrollHeight || galacticoGroups.length * 96;

    const initialOffset = -(viewportHeight + contentHeight);
    const centerOffset = -viewportHeight / 2;
    const finalOffset = contentHeight - viewportHeight / 2;
    const totalDistance = finalOffset - centerOffset;
    const totalDuration = this.getGalacticoDuration(words.length, wpm);
    const finalPauseMs = Math.max(1500, 3500 * 250 / wpm);
    const totalDurationWithPause = totalDuration + finalPauseMs;
    const totalDurationWithFade = totalDurationWithPause + GalacticoEngine.FADEOUT_DURATION;
    const scrollSpeed = totalDurationWithPause > 0 ? totalDistance / totalDurationWithPause : 0;

    this.state.setGalacticoState({
      galacticoViewportHeight: viewportHeight,
      galacticoContentHeight: contentHeight,
      galacticoTotalHeight: contentHeight,
      galacticoOffset: initialOffset,
      galacticoTotalDistance: totalDistance,
      galacticoTotalDuration: totalDurationWithPause,
      galacticoScrollSpeed: scrollSpeed,
    });
  }

  private setInitialPosition(): void {
    if (!this.galacticoScroller) return;
    const { galacticoOffset } = this.state.getState();
    this.galacticoScroller.style.transform = `translateY(${-galacticoOffset}px)`;
    this.galacticoScroller.offsetHeight; // Force layout
  }

  private startCountdown(): void {
    const { galacticoOffset } = this.state.getState();
    this.state.setGalacticoState({ 
      galacticoPhase: 'countdown', 
      galacticoPhaseStartTime: performance.now(),
      galacticoOffset,
    });

    let count = 3;
    const showNumber = () => {
      this.removeCountdown();
      if (count <= 0) {
        this.startPreScroll();
        return;
      }
      this.countdownElement = document.createElement('div');
      this.countdownElement.className = 'countdown-number';
      this.countdownElement.textContent = String(count);
      document.body.appendChild(this.countdownElement);
      count--;
      setTimeout(showNumber, 1000);
    };
    showNumber();
  }

  private startPreScroll(): void {
    this.removeCountdown();
    const { galacticoOffset, galacticoViewportHeight, galacticoContentHeight } = this.state.getState();
    const centerOffset = -galacticoViewportHeight / 2;
    const distance = centerOffset - galacticoOffset;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / GalacticoEngine.PRE_SCROLL_DURATION);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const currentOffset = galacticoOffset + distance * eased;

      this.state.update({ galacticoOffset: currentOffset });
      if (this.galacticoScroller) {
        this.galacticoScroller.style.transform = `translateY(${-currentOffset}px)`;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.startScroll();
      }
    };
    requestAnimationFrame(animate);
  }

  private startScroll(): void {
    this.state.setGalacticoState({ 
      galacticoPhase: 'scroll', 
      galacticoPhaseStartTime: performance.now(),
      galacticoStartTime: performance.now(),
    });
    this.animateScroll();
  }

  private animateScroll(): void {
    const { 
      isRunning, isPaused, galacticoPhase, galacticoStartTime, galacticoElapsedBeforePause,
      galacticoTotalDuration, galacticoTotalDistance, galacticoCenterOffset,
      galacticoFinalOffset, galacticoFadeOutDuration, galacticoContentHeight, galacticoViewportHeight
    } = this.state.getState();

    if (!isRunning || isPaused || galacticoPhase !== 'scroll') return;

    const now = performance.now();
    const elapsed = galacticoElapsedBeforePause + Math.max(0, now - galacticoStartTime);
    const totalDistance = galacticoFinalOffset - galacticoCenterOffset;

    if (elapsed < galacticoTotalDuration) {
      const progress = galacticoTotalDuration > 0 ? Math.min(1, elapsed / galacticoTotalDuration) : 1;
      const offset = galacticoCenterOffset + totalDistance * progress;
      const currentGroup = Math.min(
        (this.state.getState().galacticoGroups.length - 1),
        Math.floor(progress * this.state.getState().galacticoGroups.length)
      );

      this.state.update({ 
        galacticoOffset: offset, 
        galacticoCurrentGroup: currentGroup 
      });

      if (this.galacticoScroller) {
        this.galacticoScroller.style.transform = `translateY(${-offset}px)`;
      }

      requestAnimationFrame(() => this.animateScroll());
    } else if (elapsed < galacticoTotalDuration + GalacticoEngine.FADEOUT_DURATION) {
      this.startFadeout(elapsed - galacticoTotalDuration);
    } else {
      this.state.finishSession();
    }
  }

  private startFadeout(fadeElapsed: number): void {
    this.state.setGalacticoState({ galacticoPhase: 'fadeout' });
    if (this.galacticoContent) {
      this.galacticoContent.style.opacity = String(1 - fadeElapsed / GalacticoEngine.FADEOUT_DURATION);
    }
    requestAnimationFrame(() => this.animateScroll());
  }

  private removeCountdown(): void {
    if (this.countdownElement) {
      this.countdownElement.remove();
      this.countdownElement = null;
    }
  }

  private getGalacticoDuration(wordCount: number, speed: number): number {
    if (!wordCount || !speed || speed <= 0) return 0;
    return (wordCount / speed) * 60000;
  }

  scheduleNext(): void {
    this.startGalacticoAnimation();
  }

  startGalacticoAnimation(): void {
    this.animateScroll();
  }

  pause(): void {
    const { galacticoAnimationFrame, galacticoStartTime, galacticoElapsedBeforePause } = this.state.getState();
    if (galacticoAnimationFrame) {
      cancelAnimationFrame(galacticoAnimationFrame);
    }
    if (galacticoStartTime) {
      this.state.setGalacticoState({
        galacticoElapsedBeforePause: galacticoElapsedBeforePause + Math.max(0, performance.now() - galacticoStartTime),
        galacticoStartTime: 0,
        galacticoAnimationFrame: null,
      });
    }
    this.removeCountdown();
  }

  resume(): void {
    const { isRunning, galacticoGroups } = this.state.getState();
    if (!isRunning || galacticoGroups.length === 0) return;
    this.state.setGalacticoState({ 
      galacticoStartTime: performance.now(),
      galacticoPhase: 'scroll',
    });
    this.animateScroll();
  }

  clear(): void {
    this.pause();
    this.removeCountdown();
    this.state.resetGalacticoState();
    this.setWordDisplayClass('word-display');
    document.body.classList.remove('galactico-bg');
    if (this.wordDisplay) {
      this.wordDisplay.style.background = '';
      this.wordDisplay.style.overflow = '';
      this.wordDisplay.style.position = '';
      this.wordDisplay.style.zIndex = '';
      this.wordDisplay.style.perspective = '';
    }
  }

  getDuration(): number {
    const { galacticoTotalDuration } = this.state.getState();
    return galacticoTotalDuration + GalacticoEngine.FADEOUT_DURATION;
  }

  onWPMChange(): void {
    const state = this.state.getState();
    if (!state.isRunning || state.isPaused) return;
    if (state.galacticoPhase !== 'scroll') return;

    const { wpm, words, galacticoTotalDuration, galacticoElapsedBeforePause, galacticoStartTime, galacticoCenterOffset, galacticoTotalDistance } = state;

    const now = performance.now();
    const elapsed = galacticoElapsedBeforePause + Math.max(0, now - (galacticoStartTime || 0));
    const progress = galacticoTotalDuration > 0 ? Math.min(1, elapsed / galacticoTotalDuration) : 0;

    const newDuration = this.getGalacticoDuration(words.length, wpm);
    const finalPauseMs = Math.max(1500, 3500 * 250 / wpm);
    const newTotalDuration = newDuration + finalPauseMs;

    if (newTotalDuration > 0) {
      const newElapsed = progress * newTotalDuration;
      this.state.setGalacticoState({
        galacticoTotalDuration: newTotalDuration,
        galacticoStartTime: now,
        galacticoElapsedBeforePause: 0,
        galacticoOffset: galacticoCenterOffset + galacticoTotalDistance * progress,
      });
      if (this.galacticoScroller) {
        this.galacticoScroller.style.transform = `translateY(${-(galacticoCenterOffset + galacticoTotalDistance * progress)}px)`;
      }
    }
  }
}

/* ===== Modos nuevos: interfaz y contenido básicos (Proyecto Aprender a Aprender) =====
   Todavía no traen su lógica fina de temporización/avance automático — eso se define
   en la siguiente pasada. Por ahora arman el texto completo y avanzan con un clic
   en la pantalla de lectura, para poder ver y probar cada interfaz ya mismo. */

abstract class ClickAdvanceEngine extends BaseEngine {
  protected clickHandler = () => this.onAdvance();

  protected getFullText(): string {
    const { sentences, words } = this.state.getState();
    return sentences.length > 0 ? sentences.join(' ') : words.join(' ');
  }

  protected attachClickToAdvance(): void {
    this.wordDisplay?.addEventListener('click', this.clickHandler);
  }

  protected detachClickToAdvance(): void {
    this.wordDisplay?.removeEventListener('click', this.clickHandler);
  }

  protected onAdvance(): void {
    const finished = this.state.advanceNext();
    if (finished) {
      this.state.finishSession();
      return;
    }
    this.render();
  }

  scheduleNext(): void {
    // El avance automático por WPM se define en la siguiente pasada.
    // Por ahora se avanza con un clic sobre el texto (ver attachClickToAdvance).
  }

  pause(): void {
    this.state.clearSchedule();
  }

  resume(): void {
    this.scheduleNext();
  }

  clear(): void {
    this.state.clearSchedule();
    this.detachClickToAdvance();
    this.setWordDisplayHTML('<span>Prepara tu texto y haz clic en Iniciar</span>');
    this.setWordDisplayClass('word-display');
  }
}

/** Bionic Reading: resalta en negrita el inicio de cada palabra. */
export class BionicEngine extends ClickAdvanceEngine {
  render(): void {
    const text = this.getFullText();
    if (!text) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }
    const html = text.split(/\s+/).map(word => {
      const cut = Math.max(1, Math.ceil(word.length * 0.4));
      return `<strong>${escapeHtml(word.slice(0, cut))}</strong>${escapeHtml(word.slice(cut))}`;
    }).join(' ');

    this.setWordDisplayClass('bionic-display fade-in');
    this.setWordDisplayHTML(html);
    this.attachClickToAdvance();
    this.updateModeBadge();
  }
}

/** Columna angosta: el mismo texto, pero en una columna estrecha estilo revista. */
export class ColumnaEngine extends ClickAdvanceEngine {
  render(): void {
    const text = this.getFullText();
    if (!text) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }
    this.setWordDisplayClass('columna-display fade-in');
    this.setWordDisplayHTML(`<div class="columna-angosta">${escapeHtml(text)}</div>`);
    this.attachClickToAdvance();
    this.updateModeBadge();
  }
}

/** Guía con puntero: texto completo + una barra que marcará el ritmo (temporización pendiente). */
export class PacerEngine extends ClickAdvanceEngine {
  render(): void {
    const text = this.getFullText();
    if (!text) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }
    this.setWordDisplayClass('pacer-display fade-in');
    this.setWordDisplayHTML(`
      <div class="pacer-texto">${escapeHtml(text)}</div>
      <div class="pacer-guia" id="pacer-guia"></div>
    `);
    this.attachClickToAdvance();
    this.updateModeBadge();
  }
}

/** Sin regresión: por ahora muestra el texto completo; la atenuación progresiva se añade después. */
export class SinRegresionEngine extends ClickAdvanceEngine {
  render(): void {
    const text = this.getFullText();
    if (!text) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }
    const palabras = text.split(/\s+/).map(w => `<span class="sr-palabra">${escapeHtml(w)}</span>`).join(' ');
    this.setWordDisplayClass('sinregresion-display fade-in');
    this.setWordDisplayHTML(`<div class="sinregresion-texto">${palabras}</div>`);
    this.attachClickToAdvance();
    this.updateModeBadge();
  }
}

/** Skim / vista previa: primera línea de cada "párrafo" (frase, por ahora) antes del texto completo. */
export class SkimEngine extends ClickAdvanceEngine {
  render(): void {
    const { sentences } = this.state.getState();
    if (sentences.length === 0) {
      this.setWordDisplayHTML('<span>Sin texto</span>');
      return;
    }
    const adelanto = sentences.slice(0, Math.min(3, sentences.length))
      .map(s => `<li>${escapeHtml(s)}</li>`).join('');
    this.setWordDisplayClass('skim-display fade-in');
    this.setWordDisplayHTML(`
      <div class="skim-vista-previa">
        <p class="skim-titulo">Antes de leer, un vistazo rápido:</p>
        <ul>${adelanto}</ul>
        <p class="skim-nota">Haz clic para leer el texto completo.</p>
      </div>
    `);
    this.attachClickToAdvance();
    this.updateModeBadge();
  }

  protected onAdvance(): void {
    const { sentences } = this.state.getState();
    this.setWordDisplayHTML(`<div class="skim-texto">${escapeHtml(sentences.join(' '))}</div>`);
    this.detachClickToAdvance();
  }
}

export function createEngine(mode: string): Engine {
  switch (mode) {
    case 'word': return new WordEngine();
    case 'chunk': return new ChunkEngine();
    case 'line': return new LineEngine();
    case 'galactico': return new GalacticoEngine();
    case 'bionic': return new BionicEngine();
    case 'columna': return new ColumnaEngine();
    case 'pacer': return new PacerEngine();
    case 'sinregresion': return new SinRegresionEngine();
    case 'skim': return new SkimEngine();
    default: return new WordEngine();
  }
}