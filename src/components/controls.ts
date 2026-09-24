import { StateManager } from '../core/state.js';
import { createEngine, Engine } from '../engines/index.js';
import { SistemaAudio } from '../utils/audio.js';
import type { Mode } from '../core/types.js';

export class ControlsManager {
  private state = StateManager.getInstance();
  private currentEngine: Engine | null = null;
  private unsubscribe: (() => void) | null = null;

  private btnPause: HTMLButtonElement | null = null;
  private btnReset: HTMLButtonElement | null = null;
  private wpmSlider: HTMLInputElement | null = null;
  private wpmDisplay: HTMLElement | null = null;
  private chunkRow: HTMLElement | null = null;
  private lineTimerBar: HTMLElement | null = null;
  private lineTimerFill: HTMLElement | null = null;
  private pauseIndicator: HTMLElement | null = null;
  private modeBadge: HTMLElement | null = null;
  private wordCounter: HTMLElement | null = null;
  private elapsedTimeEl: HTMLElement | null = null;
  private fontInc: HTMLButtonElement | null = null;
  private fontDec: HTMLButtonElement | null = null;
  private displayScale = 1;

  constructor() {
    this.ensureControlsContainer();
    this.cacheElements();
    this.bindEvents();
    this.subscribeToState();
    this.onStateChange();
    this.updateChunkRowVisibility();
    this.updateWPMDisplay();
  }

  private ensureControlsContainer(): void {
    let container = document.getElementById('controls-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'controls-container';
      container.className = 'controls is-hidden';
      container.innerHTML = this.renderControlsHTML();
      document.body.appendChild(container);
    }
  }

  private renderControlsHTML(): string {
    return `
      <button class="btn btn-secondary" id="btn-pause">⏸️</button>
      <div class="control-separator"></div>
      <button class="btn btn-secondary" id="btn-reset">🔁</button>
      <div class="control-separator"></div>
      <div class="slider-group">
        <input type="range" id="wpm-slider" min="50" max="999" value="250" step="10">
        <div class="wpm-value" id="wpm-display">250</div>
        <button class="btn btn-secondary" id="btn-wpm-minus">−</button>
        <button class="btn btn-secondary" id="btn-wpm-plus">+</button>
      </div>
      <div class="control-separator"></div>
      <div class="chunk-options" id="chunk-options">
        <button class="btn btn-secondary chunk-opt" data-chunk="3">3</button>
        <button class="btn btn-secondary chunk-opt" data-chunk="4">4</button>
      </div>
      <div class="control-separator"></div>
      <button class="btn btn-secondary" id="btn-font-dec">A⁻</button>
      <button class="btn btn-secondary" id="btn-font-inc">A⁺</button>
      <div class="control-separator"></div>
      <button class="btn btn-secondary" id="btn-volver-categoria">↩️</button>
      <button class="btn btn-secondary" id="btn-home">🏠</button>
    `;
  }

  private cacheElements(): void {
    this.btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
    this.btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
    this.wpmSlider = document.getElementById('wpm-slider') as HTMLInputElement;
    this.wpmDisplay = document.getElementById('wpm-display');
    this.chunkRow = document.getElementById('chunk-options');
    this.lineTimerBar = document.getElementById('line-timer-bar');
    this.lineTimerFill = document.getElementById('line-timer-fill');
    this.pauseIndicator = document.getElementById('pause-indicator');
    this.modeBadge = document.getElementById('mode-badge');
    this.wordCounter = document.getElementById('word-counter');
    this.elapsedTimeEl = document.getElementById('elapsed-time');
    this.fontInc = document.getElementById('btn-font-inc') as HTMLButtonElement | null;
    this.fontDec = document.getElementById('btn-font-dec') as HTMLButtonElement | null;
  }

  private bindEvents(): void {
    this.btnPause?.addEventListener('click', () => this.handlePause());
    this.btnReset?.addEventListener('click', () => this.handleReset());

    this.wpmSlider?.addEventListener('input', () => this.handleWPMChange());

    document.querySelectorAll('.chunk-opt').forEach(btn => {
      (btn as HTMLElement).addEventListener('click', () => this.handleChunkChange(Number((btn as HTMLElement).dataset.chunk)));
    });

    this.fontInc?.addEventListener('click', () => this.adjustDisplayScale(0.1));
    this.fontDec?.addEventListener('click', () => this.adjustDisplayScale(-0.1));

    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  private subscribeToState(): void {
    this.unsubscribe = this.state.subscribe(() => this.onStateChange());
  }

  private onStateChange(): void {
    const state = this.state.getState();

    // Update timer display
    if (this.elapsedTimeEl) {
      this.elapsedTimeEl.textContent = this.formatTime(state.isRunning ? this.state.getElapsedTime() : 0);
    }

    // Update line timer if in line mode
    if (state.mode === 'line' && !state.isPaused && this.currentEngine) {
      (this.currentEngine as any).updateLineTimer?.();
    }

    // Update pause indicator
    if (this.pauseIndicator) {
      this.pauseIndicator.classList.toggle('visible', state.isPaused);
    }

    // Update button states
    if (this.btnPause) {
      this.btnPause.disabled = !state.isRunning;
      this.btnPause.textContent = state.isPaused ? '▶️' : '⏸️';
    }

    // Toggle controls container visibility based on session state
    const controlsContainer = document.getElementById('controls-container');
    if (controlsContainer) {
      controlsContainer.classList.toggle('is-hidden', !state.isRunning);
    }

    // Update mode badge
    if (this.modeBadge) {
      const labels: Record<string, string> = { word: 'Palabra', chunk: 'Grupo', line: 'Frase', galactico: 'Galáctico', texts: 'Textos' };
      this.modeBadge.textContent = labels[state.mode] || state.mode;
      this.modeBadge.classList.toggle('is-hidden', state.isRunning);
    }

    // Update chunk row visibility
    this.updateChunkRowVisibility();

    // Update WPM display
    this.updateWPMDisplay();

    // Update word/progress counter
    this.updateWordCounter(state);
  }

  private updateWordCounter(state: ReturnType<typeof this.state.getState>): void {
    if (!this.wordCounter) return;
    let current = 0;
    let total = 0;
    switch (state.mode) {
      case 'word':
        current = state.currentIndex;
        total = state.words.length;
        break;
      case 'chunk':
        current = state.currentChunk;
        total = state.chunks.length;
        break;
      case 'line':
        current = state.currentSentence;
        total = state.sentences.length;
        break;
      case 'galactico':
        current = state.galacticoCurrentGroup;
        total = state.galacticoGroups.length;
        break;
      default:
        total = state.words.length;
    }
    this.wordCounter.textContent = `${Math.min(current, total)} / ${total}`;
  }

  private updateChunkRowVisibility(): void {
    const chunkRow = document.getElementById('chunk-options');
    if (chunkRow) {
      chunkRow.classList.toggle('is-hidden', this.state.getState().mode !== 'chunk');
    }
  }

  private updateWPMDisplay(): void {
    const wpm = this.state.getState().wpm;
    if (this.wpmSlider) this.wpmSlider.value = String(wpm);
    if (this.wpmDisplay) this.wpmDisplay.textContent = String(wpm);
  }

  private handleStart(): void {
    const inputText = document.getElementById('input-text') as HTMLTextAreaElement;
    const text = inputText?.value.trim();

    if (!text) {
      alert('Por favor, introduce un texto para practicar');
      return;
    }

    const configModal = document.getElementById('config-modal');
    if (configModal) configModal.classList.add('hidden');

    this.state.loadText(text);
    this.state.startSession();

    this.currentEngine = createEngine(this.state.getState().mode);
    this.currentEngine.render();
    this.currentEngine.scheduleNext();

    SistemaAudio.getInstance().reproducir('play');
  }

  private handlePause(): void {
    const state = this.state.getState();
    if (!state.isRunning) return;

    if (state.isPaused) {
      this.state.resumeSession();
      this.currentEngine?.resume();
      SistemaAudio.getInstance().reproducir('play');
    } else {
      this.state.pauseSession();
      this.currentEngine?.pause();
      SistemaAudio.getInstance().reproducir('pausa');
    }
  }

  resetSession(): void {
    this.handleReset();
  }

  reiniciarPractica(): void {
    const mode = this.state.getState().mode;
    this.state.restartSession();

    if (this.currentEngine) {
      this.currentEngine.clear();
    }

    this.currentEngine = createEngine(mode);
    this.currentEngine.render();
    this.currentEngine.scheduleNext();

    const controls = document.getElementById('controls-container');
    if (controls) controls.classList.remove('is-hidden');

    SistemaAudio.getInstance().reproducir('reiniciar');
  }

  private handleReset(): void {
    this.state.resetSession();
    this.currentEngine?.clear();
    this.currentEngine = null;
    this.updateLineTimerBar(false);
    this.ocultarControles();
    SistemaAudio.getInstance().reproducir('reiniciar');
  }

  private handleWPMChange(): void {
    if (!this.wpmSlider) return;
    const wpm = Number(this.wpmSlider.value);
    this.state.setWPM(wpm);
    this.updateWPMDisplay();
    this.currentEngine?.onWPMChange?.();
  }

  private handleChunkChange(size: number): void {
    this.state.setChunkSize(size as 3 | 4);
    document.querySelectorAll('.chunk-opt').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', Number((btn as HTMLElement).dataset.chunk) === size);
    });

    if (this.state.getState().mode === 'chunk' && this.currentEngine) {
      const text = this.state.getState().words.join(' ');
      if (text) {
    this.state.loadText(text);
      }
      const state = this.state.getState();
      if (state.chunks.length > 0 && state.currentChunk >= state.chunks.length) {
        this.state.update({ currentChunk: state.chunks.length - 1 });
      }
      this.currentEngine.render();
      if (state.isRunning) {
        this.currentEngine.pause();
        this.currentEngine.scheduleNext();
      }
    }
  }

  private adjustDisplayScale(delta: number): void {
    this.displayScale = Math.max(0.7, Math.min(1.4, this.displayScale + delta));
    const display = document.getElementById('word-display');
    if (display) display.style.fontSize = `${this.displayScale}em`;
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const { isRunning, isPaused, mode } = this.state.getState();

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
      e.preventDefault();
      if (!isRunning) {
        this.handleStart();
      } else if (isPaused) {
        this.handlePause();
      } else if (mode !== 'galactico') {
        this.advanceNext();
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (isRunning && !isPaused && mode === 'word') {
        this.state.advancePrevious();
        this.currentEngine?.render();
        SistemaAudio.getInstance().reproducir('click');
      }
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      this.handlePause();
    } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      e.preventDefault();
      this.adjustWPM(20);
    } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      e.preventDefault();
      this.adjustWPM(-20);
    }
  }

  private advanceNext(): void {
    const finished = this.state.advanceNext();
    if (finished) {
      this.handleFinish();
      return;
    }
    this.currentEngine?.render();
    this.currentEngine?.scheduleNext();
  }

  private handleFinish(): void {
    this.state.finishSession();
    this.currentEngine?.clear();
    this.currentEngine = null;
    this.updateLineTimerBar(false);
    this.ocultarControles();
    SistemaAudio.getInstance().reproducir('fin');
  }

  private ocultarControles(): void {
    const controls = document.getElementById('controls-container');
    if (controls) controls.classList.add('is-hidden');
    const wordDisplay = document.getElementById('word-display');
    if (wordDisplay) {
      const span = wordDisplay.querySelector('span');
      if (span) span.textContent = 'Selecciona una categoría para comenzar';
    }
    if (this.btnPause) this.btnPause.disabled = true;
  }

  adjustWPM(delta: number): void {
    const current = this.state.getState().wpm;
    const newWpm = Math.max(50, Math.min(999, current + delta));
    this.state.setWPM(newWpm);
    this.updateWPMDisplay();
    if (this.wpmSlider) this.wpmSlider.value = String(newWpm);
  }

  private updateLineTimerBar(show: boolean): void {
    if (this.lineTimerBar) this.lineTimerBar.classList.toggle('is-hidden', !show);
    if (this.lineTimerFill) this.lineTimerFill.style.width = '100%';
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  setMode(mode: Mode): void {
    if (this.currentEngine) {
      this.currentEngine.clear();
    }
    this.currentEngine = createEngine(mode);
    this.updateChunkRowVisibility();
    this.currentEngine.render();
  }

  startEngine(): void {
    if (this.currentEngine) {
      this.currentEngine.scheduleNext();
    }
  }

  destroy(): void {
    this.unsubscribe?.();
    this.currentEngine?.clear();
  }
}