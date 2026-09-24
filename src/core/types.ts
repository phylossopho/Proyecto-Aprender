export type Mode = 'word' | 'chunk' | 'line' | 'galactico' | 'texts' | 'bionic' | 'columna' | 'pacer' | 'sinregresion' | 'skim';
export type Theme = 'dark' | 'neon' | 'light';
export type FontSize = 'small' | 'medium' | 'large';
export type ChunkSize = 3 | 5 | 7;

export interface TrainingStats {
  sessions: number;
  totalWords: number;
  totalTime: number;
  bestWPM: number;
  history: SessionRecord[];
}

export interface SessionRecord {
  date: string;
  mode: Mode;
  wpm: number;
  words: number;
  duration: number;
}

export interface Preferences {
  theme: Theme;
  wpm: number;
  chunkSize: ChunkSize;
  mode: Mode;
  fontSize: FontSize;
  stats: TrainingStats;
}

export interface TextChunk {
  words: string[];
  endsWith: EndType;
}

export type EndType = 'sentence' | 'clause' | 'list' | 'normal';

export interface GalacticoGroup {
  text: string;
  element: HTMLElement;
}

export interface AppState {
  mode: Mode;
  wpm: number;
  chunkSize: ChunkSize;
  theme: Theme;
  fontSize: FontSize;
  words: string[];
  chunks: TextChunk[];
  sentences: string[];
  currentIndex: number;
  currentChunk: number;
  currentSentence: number;
  isRunning: boolean;
  isPaused: boolean;
  scheduleTimeout: ReturnType<typeof setTimeout> | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  timerStart: number;
  pausedDuration: number;
  chunkPauseMs: number;
  trainingStats: TrainingStats;
  galacticoGroups: string[];
  galacticoCurrentGroup: number;
  galacticoAnimationFrame: number | null;
  galacticoOffset: number;
  galacticoScrollSpeed: number;
  galacticoTotalDistance: number;
  galacticoTotalDuration: number;
  galacticoContentHeight: number;
  galacticoViewportHeight: number;
  galacticoElapsedBeforePause: number;
  galacticoStartTime: number;
  galacticoPhase: GalacticoPhase;
  galacticoPhaseStartTime: number;
  galacticoCenterOffset: number;
  galacticoFinalOffset: number;
  galacticoFadeOutDuration: number;
  galacticoTotalHeight: number;
}

export type GalacticoPhase = 'countdown' | 'pre-scroll' | 'scroll' | 'fadeout' | '';

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  wpm: 250,
  chunkSize: 5,
  mode: 'word',
  fontSize: 'medium',
  stats: {
    sessions: 0,
    totalWords: 0,
    totalTime: 0,
    bestWPM: 0,
    history: [],
  },
};

export const STORAGE_KEYS = {
  THEME: 'reading-theme',
  WPM: 'reading-wpm',
  CHUNK_SIZE: 'reading-chunkSize',
  MODE: 'reading-mode',
  FONT_SIZE: 'reading-fontSize',
  STATS: 'reading-stats',
  CUSTOM_THEMES: 'reading-custom-themes',
  SONIDO: 'reading-sonido',
} as const;

export const WPM_RANGE = { min: 50, max: 999, step: 10 } as const;
export const CHUNK_SIZES: ChunkSize[] = [3, 5, 7];
export const FONT_SIZES: FontSize[] = ['small', 'medium', 'large'];
export const THEMES: Theme[] = ['dark', 'neon', 'light'];
export const MODES: Mode[] = ['word', 'chunk', 'line', 'galactico', 'texts'];
export const CATEGORIA_TEXTO = ['Personal', 'Muestra', 'Historia', 'Ciencia', 'Tecnologia', 'Naturaleza', 'Motivacion', 'Ciudad', 'Otro'] as const;
export type CategoriaTexto = typeof CATEGORIA_TEXTO[number];

export const PAUSE_DURATIONS: Record<EndType, number> = {
  sentence: 600,
  clause: 350,
  list: 300,
  normal: 200,
};