import type { AppState, Mode, Theme, ChunkSize, TrainingStats, Preferences, TextChunk, GalacticoPhase } from '../core/types.js';
import { DEFAULT_PREFERENCES, PAUSE_DURATIONS } from '../core/types.js';
import { StorageManager } from '../core/storage.js';
import { splitSentences, splitIntoChunks, countWords, cleanWord } from '../utils/text-processing.js';

export class StateManager {
  private static instance: StateManager;
  private state: AppState;
  private storage: StorageManager;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.storage = StorageManager.getInstance();
    this.state = this.createInitialState();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private createInitialState(): AppState {
    const prefs = this.storage.loadPreferences();
    return {
      mode: prefs.mode,
      wpm: prefs.wpm,
      chunkSize: prefs.chunkSize,
      theme: prefs.theme,
      words: [],
      chunks: [],
      sentences: [],
      currentIndex: 0,
      currentChunk: 0,
      currentSentence: 0,
      isRunning: false,
      isPaused: false,
      scheduleTimeout: null,
      timerInterval: null,
      timerStart: 0,
      pausedDuration: 0,
      chunkPauseMs: PAUSE_DURATIONS.normal,
      trainingStats: prefs.stats,
      galacticoGroups: [],
      galacticoCurrentGroup: 0,
      galacticoAnimationFrame: null,
      galacticoOffset: 0,
      galacticoScrollSpeed: 0,
      galacticoTotalDistance: 0,
      galacticoTotalDuration: 0,
      galacticoContentHeight: 0,
      galacticoViewportHeight: 0,
      galacticoElapsedBeforePause: 0,
      galacticoStartTime: 0,
      galacticoPhase: '',
      galacticoPhaseStartTime: 0,
      galacticoCenterOffset: 0,
      galacticoFinalOffset: 0,
      galacticoFadeOutDuration: 1000,
      galacticoTotalHeight: 0,
    };
  }

  getState(): Readonly<AppState> {
    return this.state;
  }

  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    (this.state as any)[key] = value;
    this.notify();
  }

  update(partial: Partial<AppState>): void {
    Object.assign(this.state, partial);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  loadText(text: string): void {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = splitSentences(text);
    const chunks = splitIntoChunks(text, this.state.chunkSize);

    this.update({
      words,
      chunks,
      sentences,
      currentIndex: 0,
      currentChunk: 0,
      currentSentence: 0,
    });
  }

  setMode(mode: Mode): void {
    this.update({ mode });
    this.storage.saveMode(mode);
  }

  setWPM(wpm: number): void {
    const clamped = Math.max(50, Math.min(999, wpm));
    this.update({ wpm: clamped });
    this.storage.saveWPM(clamped);
  }

  setChunkSize(size: ChunkSize): void {
    this.update({ chunkSize: size });
    this.storage.saveChunkSize(size);
    if (this.state.isRunning && this.state.mode === 'chunk') {
      this.loadText(this.state.words.join(' '));
    }
  }

  setTheme(theme: Theme): void {
    this.update({ theme });
    this.storage.saveTheme(theme);
    document.body.className = `theme-${theme}`;
  }

  startSession(): void {
    this.update({
      isRunning: true,
      isPaused: false,
      currentIndex: 0,
      currentChunk: 0,
      currentSentence: 0,
      timerStart: Date.now(),
      pausedDuration: 0,
    });
    this.startTimer();
  }

  restartSession(): void {
    this.update({
      isRunning: true,
      isPaused: false,
      currentIndex: 0,
      currentChunk: 0,
      currentSentence: 0,
      timerStart: Date.now(),
      pausedDuration: 0,
    });
    this.startTimer();
  }

  pauseSession(): void {
    if (!this.state.isRunning) return;
    this.update({ isPaused: true });
    this.clearSchedule();
    this.stopTimer();
  }

  resumeSession(): void {
    if (!this.state.isRunning || !this.state.isPaused) return;
    this.update({ isPaused: false });
    this.startTimer();
  }

  resetSession(): void {
    this.clearSchedule();
    this.stopTimer();
    this.update({
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      currentChunk: 0,
      currentSentence: 0,
      pausedDuration: 0,
    });
  }

  finishSession(): void {
    this.clearSchedule();
    this.stopTimer();
    const elapsed = Math.floor((Date.now() - this.state.timerStart) / 1000);
    const stats = { ...this.state.trainingStats };
    stats.sessions++;
    stats.totalWords += this.state.words.length;
    stats.totalTime += elapsed;
    if (this.state.wpm > stats.bestWPM) stats.bestWPM = this.state.wpm;
    stats.history.push({
      date: new Date().toISOString(),
      mode: this.state.mode,
      wpm: this.state.wpm,
      words: this.state.words.length,
      duration: elapsed,
    });
    this.update({ trainingStats: stats, isRunning: false, isPaused: false });
    this.storage.saveStats(stats);
  }

  advanceNext(): boolean {
    const { mode, words, chunks, sentences, currentIndex, currentChunk, currentSentence } = this.state;
    let finished = false;

    if (mode === 'word') {
      if (currentIndex + 1 >= words.length) finished = true;
      else this.update({ currentIndex: currentIndex + 1 });
    } else if (mode === 'chunk') {
      if (currentChunk + 1 >= chunks.length) finished = true;
      else this.update({ currentChunk: currentChunk + 1 });
    } else if (mode === 'line') {
      if (currentSentence + 1 >= sentences.length) finished = true;
      else this.update({ currentSentence: currentSentence + 1 });
    }

    return finished;
  }

  advancePrevious(): void {
    if (this.state.mode === 'word' && this.state.currentIndex > 0) {
      this.update({ currentIndex: this.state.currentIndex - 1 });
    }
  }

  setScheduleTimeout(timeout: ReturnType<typeof setTimeout> | null): void {
    this.update({ scheduleTimeout: timeout });
  }

  clearSchedule(): void {
    if (this.state.scheduleTimeout) {
      clearTimeout(this.state.scheduleTimeout);
      this.update({ scheduleTimeout: null });
    }
  }

  private startTimer(): void {
    this.stopTimer();
    const interval = setInterval(() => {
      if (!this.state.isPaused) {
        this.notify();
      }
    }, 1000);
    this.update({ timerInterval: interval });
  }

  stopTimer(): void {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.update({ timerInterval: null });
    }
  }

  getElapsedTime(): number {
    if (!this.state.isRunning) return 0;
    if (this.state.isPaused) return this.state.pausedDuration;
    return Math.floor((Date.now() - this.state.timerStart) / 1000);
  }

  setGalacticoState(partial: Partial<Pick<AppState, 
    'galacticoGroups' | 'galacticoCurrentGroup' | 'galacticoAnimationFrame' | 
    'galacticoOffset' | 'galacticoScrollSpeed' | 'galacticoTotalDistance' | 
    'galacticoTotalDuration' | 'galacticoContentHeight' | 'galacticoViewportHeight' | 
    'galacticoElapsedBeforePause' | 'galacticoStartTime' | 'galacticoPhase' | 'galacticoPhaseStartTime' |
    'galacticoCenterOffset' | 'galacticoFinalOffset' | 'galacticoFadeOutDuration' | 'galacticoTotalHeight'
  >>): void {
    this.update(partial as Partial<AppState>);
  }

  resetGalacticoState(): void {
    this.update({
      galacticoGroups: [],
      galacticoCurrentGroup: 0,
      galacticoAnimationFrame: null,
      galacticoOffset: 0,
      galacticoScrollSpeed: 0,
      galacticoTotalDistance: 0,
      galacticoTotalDuration: 0,
      galacticoContentHeight: 0,
      galacticoViewportHeight: 0,
      galacticoElapsedBeforePause: 0,
      galacticoStartTime: 0,
      galacticoPhase: '',
      galacticoPhaseStartTime: 0,
    });
  }
}