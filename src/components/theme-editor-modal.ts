import { modalManager, createElement } from './ui-utils.js';
import { StateManager } from '../core/state.js';
import type { Theme } from '../core/types.js';

function appendToBody(element: HTMLElement): void {
  document.body.appendChild(element);
}

const THEME_VARIABLES: Record<Theme, Record<string, string>> = {
  dark: {
    '--bg-primary': '#0f0f1a',
    '--bg-secondary': '#1a1a2e',
    '--bg-tertiary': '#2a2a4a',
    '--bg-card': '#2a2a4a',
    '--bg-card-hover': '#3a3a5a',
    '--bg-card-active': '#252548',
    '--border-color': '#2a2a4a',
    '--border-focus': '#7c8aff',
    '--text-primary': '#e0e0e0',
    '--text-secondary': '#999',
    '--text-muted': '#777',
    '--accent-primary': '#7c8aff',
    '--accent-hover': '#6a78ee',
    '--accent-text': '#ffffff',
    '--btn-primary-bg': '#7c8aff',
    '--btn-primary-text': '#fff',
    '--btn-secondary-bg': '#2a2a4a',
    '--btn-secondary-text': '#aaa',
    '--input-bg': '#0f0f1a',
    '--input-border': '#3a3a5a',
    '--input-text': '#e0e0e0',
    '--modal-bg': '#1a1a2e',
    '--modal-border': '#2a2a4a',
    '--slider-track': '#4a4a6a',
    '--hl-color': '#7c8aff',
    '--pointer-color': '#7c8aff',
    '--focal-border': '#7c8aff',
    '--timer-fill': '#7c8aff',
    '--badge-color': '#7c8aff',
    '--pause-color': '#7c8aff',
    '--pause-bg': 'rgba(124,138,255,0.15)',
  },
  neon: {
    '--bg-primary': '#050510',
    '--bg-secondary': '#0a0a1a',
    '--bg-tertiary': '#14142a',
    '--bg-card': '#14142a',
    '--bg-card-hover': '#1e1e3a',
    '--bg-card-active': '#0a1a2a',
    '--border-color': '#1a1a3a',
    '--border-focus': '#00ffff',
    '--text-primary': '#e0e0ff',
    '--text-secondary': '#aaa',
    '--text-muted': '#888',
    '--accent-primary': '#00ffff',
    '--accent-hover': '#33ddff',
    '--accent-text': '#000000',
    '--btn-primary-bg': '#00d4ff',
    '--btn-primary-text': '#000',
    '--btn-secondary-bg': '#1a1a3a',
    '--btn-secondary-text': '#aaa',
    '--input-bg': '#0a0a1a',
    '--input-border': '#1a1a3a',
    '--input-text': '#e0e0ff',
    '--modal-bg': '#0a0a1a',
    '--modal-border': '#1a1a3a',
    '--slider-track': '#1a1a3a',
    '--hl-color': '#00ffff',
    '--pointer-color': '#00ffff',
    '--focal-border': '#00ffff',
    '--timer-fill': '#00ffff',
    '--badge-color': '#00ffff',
    '--pause-color': '#00ffff',
    '--pause-bg': 'rgba(0,212,255,0.15)',
  },
  light: {
    '--bg-primary': '#d8d8d8',
    '--bg-secondary': '#c0c0c0',
    '--bg-tertiary': '#b0b0b0',
    '--bg-card': '#e8e8e8',
    '--bg-card-hover': '#d8d8d8',
    '--bg-card-active': '#c0c0e0',
    '--border-color': '#888',
    '--border-focus': '#1a1a4a',
    '--text-primary': '#2a2a2a',
    '--text-secondary': '#555',
    '--text-muted': '#777',
    '--accent-primary': '#1a1a4a',
    '--accent-hover': '#2a2a6a',
    '--accent-text': '#ffffff',
    '--btn-primary-bg': '#1a1a4a',
    '--btn-primary-text': '#fff',
    '--btn-secondary-bg': '#b0b0b0',
    '--btn-secondary-text': '#1a1a1a',
    '--input-bg': '#f8f8f8',
    '--input-border': '#888',
    '--input-text': '#1a1a1a',
    '--modal-bg': '#d0d0d0',
    '--modal-border': '#888',
    '--slider-track': '#888',
    '--hl-color': '#1a1a4a',
    '--pointer-color': '#1a1a4a',
    '--focal-border': '#1a1a4a',
    '--timer-fill': '#1a1a4a',
    '--badge-color': '#1a1a4a',
    '--pause-color': '#1a1a4a',
    '--pause-bg': 'rgba(26,26,74,0.15)',
  },
};

const VARIABLE_LABELS: Record<string, string> = {
  '--bg-primary': 'Fondo principal',
  '--bg-secondary': 'Fondo secundario',
  '--bg-tertiary': 'Fondo terciario',
  '--bg-card': 'Fondo de tarjeta',
  '--bg-card-hover': 'Tarjeta al pasar el cursor',
  '--bg-card-active': 'Tarjeta activa',
  '--modal-bg': 'Fondo de modal',
  '--input-bg': 'Fondo de campo de texto',
  '--text-primary': 'Texto principal',
  '--text-secondary': 'Texto secundario',
  '--text-muted': 'Texto atenuado',
  '--input-text': 'Texto en campo de texto',
  '--accent-text': 'Texto sobre acento',
  '--btn-primary-text': 'Texto botón primario',
  '--btn-secondary-text': 'Texto botón secundario',
  '--accent-primary': 'Color acento principal',
  '--accent-hover': 'Acento al pasar el cursor',
  '--hl-color': 'Resaltado',
  '--pointer-color': 'Indicador de palabra',
  '--focal-border': 'Borde de palabra focal',
  '--timer-fill': 'Barra de progreso',
  '--badge-color': 'Insignia de modo',
  '--pause-color': 'Indicador de pausa',
  '--border-color': 'Bordes generales',
  '--border-focus': 'Borde de enfoque',
  '--input-border': 'Borde de campo de texto',
  '--modal-border': 'Borde de modal',
  '--slider-track': 'Fondo del slider',
  '--btn-primary-bg': 'Botón primario',
  '--btn-secondary-bg': 'Botón secundario',
  '--pause-bg': 'Fondo indicador de pausa',
};

const VARIABLE_GROUPS = [
  { name: 'Fondos', vars: ['--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-card', '--bg-card-hover', '--bg-card-active', '--modal-bg', '--input-bg'] },
  { name: 'Textos', vars: ['--text-primary', '--text-secondary', '--text-muted', '--input-text', '--accent-text', '--btn-primary-text', '--btn-secondary-text'] },
  { name: 'Acentos', vars: ['--accent-primary', '--accent-hover', '--hl-color', '--pointer-color', '--focal-border', '--timer-fill', '--badge-color', '--pause-color'] },
  { name: 'Bordes', vars: ['--border-color', '--border-focus', '--input-border', '--modal-border', '--slider-track'] },
  { name: 'Botones', vars: ['--btn-primary-bg', '--btn-secondary-bg', '--pause-bg'] },
];

const COLOR_RELATIONS: Record<string, string[]> = {
  '--text-primary': ['--bg-primary', '--bg-secondary', '--bg-card'],
  '--text-secondary': ['--bg-card', '--bg-secondary'],
  '--text-muted': ['--bg-card', '--bg-secondary'],
  '--accent-primary': ['--btn-primary-bg', '--focal-border', '--timer-fill', '--border-focus'],
  '--accent-hover': ['--btn-primary-bg', '--border-focus'],
  '--bg-primary': ['--text-primary', '--text-secondary', '--btn-primary-bg'],
  '--bg-secondary': ['--text-primary', '--text-secondary'],
  '--bg-card': ['--text-primary', '--text-secondary'],
  '--btn-primary-bg': ['--btn-primary-text', '--accent-text', '--bg-primary'],
  '--btn-secondary-bg': ['--btn-secondary-text', '--text-secondary'],
  '--border-color': ['--bg-primary', '--text-muted'],
};

export class ThemeEditorModal {
  private element: HTMLElement;
  private state = StateManager.getInstance();
  private currentTheme: Theme = 'dark';
  private customThemes: Record<string, Record<string, string>> = {};

  constructor() {
    this.loadCustomThemes();
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('theme-editor', this.element);
    this.renderEditor();
    this.updatePreview();
  }

  private loadCustomThemes(): void {
    try {
      const data = localStorage.getItem('reading-custom-themes');
      this.customThemes = data ? JSON.parse(data) : {};
    } catch {
      this.customThemes = {};
    }
  }

  private saveCustomThemes(): void {
    try {
      localStorage.setItem('reading-custom-themes', JSON.stringify(this.customThemes));
    } catch { /* ignore */ }
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal theme-editor-container">
        <div class="theme-editor-header">
          <h2 style="margin:0;">Editor de Temas</h2>
          <button class="btn btn-secondary" id="btn-close-theme-editor" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <div class="theme-editor-layout">
          <div class="theme-editor-panel">
            <div class="theme-tabs">
              <button class="theme-tab-btn active" data-theme="dark">Oscuro</button>
              <button class="theme-tab-btn" data-theme="neon">Neon</button>
              <button class="theme-tab-btn" data-theme="light">Claro</button>
            </div>
            <div id="theme-editor-content" class="theme-editor-content"></div>
            <div class="theme-editor-actions">
              <button class="btn btn-secondary" id="btn-reset-theme" style="padding:6px 16px;">Restablecer</button>
              <button class="btn btn-primary" id="btn-save-theme" style="padding:6px 16px;">Guardar cambios</button>
            </div>
          </div>
          <div class="theme-preview-panel">
            <div class="theme-preview-header">
              <span>Vista Previa en Vivo</span>
            </div>
            <div id="theme-preview-content" class="theme-preview-content"></div>
          </div>
        </div>
        <div class="theme-editor-actions">
          <button class="btn btn-secondary" id="btn-reset-theme-2" style="padding:6px 16px;">Restablecer</button>
          <button class="btn btn-primary" id="btn-save-theme-2" style="padding:6px 16px;">Guardar cambios</button>
        </div>
      </div>
    `);

    const closeBtn = overlay.querySelector('#btn-close-theme-editor') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    const tabBtns = overlay.querySelectorAll('.theme-tab-btn');
    tabBtns.forEach(btn => {
      (btn as HTMLElement).addEventListener('click', () => {
        this.currentTheme = (btn as HTMLElement).dataset.theme as Theme;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderEditor();
        this.updatePreview();
      });
    });

    const resetBtns = overlay.querySelectorAll('#btn-reset-theme, #btn-reset-theme-2');
    resetBtns.forEach(btn => {
      btn.addEventListener('click', () => this.resetToDefaults());
    });

    const saveBtns = overlay.querySelectorAll('#btn-save-theme, #btn-save-theme-2');
    saveBtns.forEach(btn => {
      btn.addEventListener('click', () => this.saveTheme());
    });

    return overlay;
  }

  private renderEditor(): void {
    const container = this.element.querySelector('#theme-editor-content')!;
    const themeVars = this.getCurrentThemeVars();

    let html = '';
    VARIABLE_GROUPS.forEach(group => {
      const groupVars = group.vars.filter(v => themeVars[v]);
      if (groupVars.length === 0) return;

      html += `<div style="margin-bottom:20px;"><h4 style="border-bottom:1px solid var(--border-color);padding-bottom:4px;margin:0 0 12px;font-size:0.85rem;">${group.name}</h4>`;
      groupVars.forEach(varName => {
        const value = themeVars[varName];
        const label = VARIABLE_LABELS[varName] || varName;
        html += `
          <div class="theme-row">
            <span class="theme-row-label">${label}</span>
            <input type="color" class="theme-row-input" value="${this.normalizeColor(value)}" data-var="${varName}">
            <input type="text" class="theme-row-text" value="${value}" data-var="${varName}">
          </div>
        `;
      });
      html += '</div>';
    });

    container.innerHTML = html;

    const syncVariable = (varName: string, value: string) => {
      this.applyVariable(varName, value);
      this.updateSuggestions(varName, value);
      this.updatePreview();
    };

    container.querySelectorAll('input[type="color"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        syncVariable(target.dataset.var!, target.value);
        const textInput = container.querySelector(`input[type="text"][data-var="${target.dataset.var}"]`) as HTMLInputElement | null;
        if (textInput) textInput.value = target.value;
      });
    });

    container.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (this.isValidColor(target.value)) {
          syncVariable(target.dataset.var!, target.value);
          const colorInput = container.querySelector(`input[type="color"][data-var="${target.dataset.var}"]`) as HTMLInputElement | null;
          if (colorInput) colorInput.value = this.normalizeColor(target.value);
        }
      });
    });
  }

  private updateSuggestions(sourceVar: string, sourceValue: string): void {
    const relations = COLOR_RELATIONS[sourceVar] || [];
    if (!relations.length) return;
    const suggestions = this.getColorSuggestions(sourceValue);
    const themeVars = this.getCurrentThemeVars();

    relations.forEach(targetVar => {
      const container = this.element.querySelector(`.color-suggestions[data-for="${targetVar}"]`);
      if (!container) return;
      const currentValue = themeVars[targetVar] || '#000000';
      const closest = this.findClosestColor(currentValue, suggestions);
      container.innerHTML = suggestions.map(s => `<button class="theme-swatch" data-color="${s}" data-var="${targetVar}" style="background:${s};" title="${s}"></button>`).join('');
      container.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = (btn as HTMLElement).dataset.var!;
          const c = (btn as HTMLElement).dataset.color!;
          this.applyVariable(v, c);
          const colorInput = (this.element.querySelector(`input[type="color"][data-var="${v}"]`) as HTMLInputElement | null);
          const textInput = (this.element.querySelector(`input[type="text"][data-var="${v}"]`) as HTMLInputElement | null);
          if (colorInput) colorInput.value = this.normalizeColor(c);
          if (textInput) textInput.value = c;
          this.updatePreview();
        });
      });
      if (closest) {
        setTimeout(() => {
          const first = container.querySelector('.theme-swatch');
          if (first) (first as HTMLElement).click();
        }, 0);
      }
    });
  }

  private isValidColor(value: string): boolean {
    const s = new Option().style;
    s.color = value;
    return s.color !== '';
  }

  private normalizeColor(value: string): string {
    if (!value || value === 'transparent') return '#000000';
    const s = new Option().style;
    s.color = value;
    if (!s.color) return '#000000';
    const match = s.color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(Number(match[1]))}${toHex(Number(match[2]))}${toHex(Number(match[3]))}`;
    }
    return value;
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private getColorSuggestions(hex: string): string[] {
    const hsl = this.hexToHsl(hex);
    if (!hsl) return [];
    const suggestions = new Set<string>();
    const add = (h: number, s: number, l: number) => suggestions.add(this.hslToHex(h, s, l));
    add(hsl.h, hsl.s, hsl.l);
    add((hsl.h + 30) % 360, hsl.s, hsl.l);
    add((hsl.h + 60) % 360, hsl.s, hsl.l);
    add((hsl.h + 90) % 360, hsl.s, hsl.l);
    add((hsl.h + 120) % 360, hsl.s, hsl.l);
    add((hsl.h + 180) % 360, hsl.s, hsl.l);
    add((hsl.h + 210) % 360, hsl.s, hsl.l);
    add((hsl.h + 240) % 360, hsl.s, hsl.l);
    add(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20));
    add(hsl.h, Math.max(0, hsl.s - 20), Math.max(0, hsl.l - 20));
    add(hsl.h, Math.min(100, hsl.s + 20), hsl.l);
    return Array.from(suggestions).slice(0, 8);
  }

  private getCurrentThemeVars(): Record<string, string> {
    return { ...THEME_VARIABLES[this.currentTheme], ...(this.customThemes[this.currentTheme] || {}) };
  }

  private findClosestColor(target: string, suggestions: string[]): string | null {
    const targetHsl = this.hexToHsl(this.normalizeColor(target));
    if (!targetHsl) return suggestions[0] || null;
    let best = suggestions[0];
    let bestDist = Infinity;
    suggestions.forEach(s => {
      const hsl = this.hexToHsl(s);
      if (!hsl) return;
      const dh = Math.abs(hsl.h - targetHsl.h);
      const ds = Math.abs(hsl.s - targetHsl.s);
      const dl = Math.abs(hsl.l - targetHsl.l);
      const dist = dh + ds * 0.5 + dl * 0.25;
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    });
    return best;
  }

  private applyVariable(varName: string, value: string): void {
    document.documentElement.style.setProperty(varName, value);
    if (!this.customThemes[this.currentTheme]) this.customThemes[this.currentTheme] = {};
    this.customThemes[this.currentTheme][varName] = value;
    this.updatePreview();
  }

  private updatePreview(): void {
    const container = this.element.querySelector('#theme-preview-content')!;
    container.innerHTML = `
      <div class="theme-preview-card">
        <div class="theme-preview-card-title">Vista previa unificada</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px;text-align:center;min-width:120px;">
            <div style="font-size:1.5rem;margin-bottom:4px;">|</div>
            <div style="font-weight:600;color:var(--text-primary);font-size:0.8rem;">Palabra</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);">Modo palabra</div>
          </div>
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px;text-align:center;min-width:120px;">
            <div style="font-size:1.2rem;color:var(--accent-primary);margin-bottom:4px;">···</div>
            <div style="font-weight:600;color:var(--text-primary);font-size:0.8rem;">Grupo</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);">Modo chunk</div>
          </div>
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px;text-align:center;min-width:120px;">
            <div style="font-size:1.2rem;color:var(--hl-color);margin-bottom:4px;">“...”</div>
            <div style="font-weight:600;color:var(--text-primary);font-size:0.8rem;">Frase</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);">Modo línea</div>
          </div>
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px;text-align:center;min-width:120px;">
            <div style="font-size:1.2rem;color:var(--timer-fill);margin-bottom:4px;">⇡</div>
            <div style="font-weight:600;color:var(--text-primary);font-size:0.8rem;">Galáctico</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);">Scroll</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" style="padding:8px 16px;">Primario</button>
          <button class="btn btn-secondary" style="padding:8px 16px;">Secundario</button>
        </div>
        <div style="margin-top:12px;">
          <label style="display:block;font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px;">Velocidad</label>
          <input type="range" min="50" max="999" value="250" step="10" style="width:100%;-webkit-appearance:none;height:5px;border-radius:3px;background:var(--slider-track);">
        </div>
      </div>
    `;
  }

  private resetToDefaults(): void {
    this.customThemes[this.currentTheme] = {};
    this.renderEditor();
    this.updatePreview();
  }

  private saveTheme(): void {
    this.saveCustomThemes();
    this.state.setTheme(this.currentTheme);
  }

  show(): void {
    this.currentTheme = this.state.getState().theme;
    const tabBtns = this.element.querySelectorAll('.theme-tab-btn');
    tabBtns.forEach(btn => (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.theme === this.currentTheme));
    this.renderEditor();
    this.updatePreview();
    modalManager.show('theme-editor');
  }

  hide(): void {
    modalManager.hide('theme-editor');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

export const themeEditorModal = new ThemeEditorModal();
