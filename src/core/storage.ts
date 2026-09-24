import type { Preferences, Theme, Mode, ChunkSize, TrainingStats } from './types.js';
import { DEFAULT_PREFERENCES, STORAGE_KEYS } from './types.js';

export class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  loadPreferences(): Preferences {
    if (!this.isAvailable()) return DEFAULT_PREFERENCES;

    try {
      const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || DEFAULT_PREFERENCES.theme;
      const wpm = parseInt(localStorage.getItem(STORAGE_KEYS.WPM) || '', 10) || DEFAULT_PREFERENCES.wpm;
      const chunkSize = (parseInt(localStorage.getItem(STORAGE_KEYS.CHUNK_SIZE) || '', 10) as ChunkSize) || DEFAULT_PREFERENCES.chunkSize;
      const mode = (localStorage.getItem(STORAGE_KEYS.MODE) as Mode) || DEFAULT_PREFERENCES.mode;

      let stats = DEFAULT_PREFERENCES.stats;
      const statsStr = localStorage.getItem(STORAGE_KEYS.STATS);
      if (statsStr) {
        try {
          stats = JSON.parse(statsStr);
        } catch {
          stats = DEFAULT_PREFERENCES.stats;
        }
      }

      return { theme, wpm, chunkSize, mode, stats };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs: Partial<Preferences>): void {
    if (!this.isAvailable()) return;

    try {
      if (prefs.theme) localStorage.setItem(STORAGE_KEYS.THEME, prefs.theme);
      if (prefs.wpm !== undefined) localStorage.setItem(STORAGE_KEYS.WPM, String(prefs.wpm));
      if (prefs.chunkSize) localStorage.setItem(STORAGE_KEYS.CHUNK_SIZE, String(prefs.chunkSize));
      if (prefs.mode) localStorage.setItem(STORAGE_KEYS.MODE, prefs.mode);
      if (prefs.stats) localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(prefs.stats));
    } catch {
      // Silently fail
    }
  }

  saveTheme(theme: Theme): void {
    this.savePreferences({ theme });
  }

  saveWPM(wpm: number): void {
    this.savePreferences({ wpm });
  }

  saveChunkSize(chunkSize: ChunkSize): void {
    this.savePreferences({ chunkSize });
  }

  saveMode(mode: Mode): void {
    this.savePreferences({ mode });
  }

  saveStats(stats: TrainingStats): void {
    this.savePreferences({ stats });
  }

  loadCustomThemes(): Record<string, Record<string, string>> {
    if (!this.isAvailable()) return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEMES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveCustomThemes(themes: Record<string, Record<string, string>>): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_THEMES, JSON.stringify(themes));
    } catch {
      // Silently fail
    }
  }

  clearAll(): void {
    if (!this.isAvailable()) return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch {
      // Silently fail
    }
  }
}