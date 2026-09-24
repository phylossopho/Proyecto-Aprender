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

const VARIABLE_GROUPS = [
  { name: 'Fondos', vars: ['--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-card', '--bg-card-hover', '--bg-card-active', '--modal-bg', '--input-bg'] },
  { name: 'Textos', vars: ['--text-primary', '--text-secondary', '--text-muted', '--input-text', '--accent-text', '--btn-primary-text', '--btn-secondary-text'] },
  { name: 'Acentos', vars: ['--accent-primary', '--accent-hover', '--hl-color', '--pointer-color', '--focal-border', '--timer-fill', '--badge-color', '--pause-color'] },
  { name: 'Bordes', vars: ['--border-color', '--border-focus', '--input-border', '--modal-border', '--slider-track'] },
  { name: 'Botones', vars: ['--btn-primary-bg', '--btn-secondary-bg', '--pause-bg'] },
];

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
      <div class="modal theme-editor-container" style="width:1120px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Editor de Temas</h2>
          <button class="btn btn-secondary" id="btn-close-theme-editor" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <div class="theme-editor-layout" style="display:flex;flex:1;overflow:hidden;">
          <div class="theme-editor-panel" style="flex:1;max-width:560px;overflow-y:auto;padding-right:16px;">
            <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
              <button class="theme-tab-btn active" data-theme="dark" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;font-weight:600;cursor:pointer;">Oscuro</button>
              <button class="theme-tab-btn" data-theme="neon" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;font-weight:600;cursor:pointer;">Neon</button>
              <button class="theme-tab-btn" data-theme="light" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;font-weight:600;cursor:pointer;">Claro</button>
            </div>
            <div id="theme-editor-content" style="max-height:60vh;overflow-y:auto;"></div>
            <div style="display:flex;gap:8px;justify-content:flex:end;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
              <button class="btn btn-secondary" id="btn-reset-theme" style="padding:6px 16px;">Restablecer</button>
              <button class="btn btn-primary" id="btn-save-theme" style="padding:6px 16px;">Guardar cambios</button>
            </div>
          </div>
          <div class="theme-preview-panel" style="flex:1;max-width:560px;background:var(--bg-primary);border-left:1px solid var(--border-color);display:flex;flex-direction:column;overflow:hidden;">
            <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;color:var(--accent-primary);">Vista Previa en Vivo</span>
              <select id="preview-mode-select" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--input-bg);color:var(--input-text);font-size:0.75rem;">
                <option value="overview">Resumen general</option>
                <option value="reading">Modo lectura</option>
                <option value="modal">Modal configuración</option>
                <option value="all">Todas las variables</option>
              </select>
            </div>
            <div id="theme-preview-content" style="flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;align-items:center;gap:16px;"></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex:end;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
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

    const previewSelect = overlay.querySelector('#preview-mode-select') as HTMLSelectElement;
    previewSelect.addEventListener('change', () => this.updatePreview());

    return overlay;
  }

  private renderEditor(): void {
    const container = this.element.querySelector('#theme-editor-content')!;
    const themeVars = { ...THEME_VARIABLES[this.currentTheme], ...(this.customThemes[this.currentTheme] || {}) };

    let html = '';
    VARIABLE_GROUPS.forEach(group => {
      const groupVars = group.vars.filter(v => themeVars[v]);
      if (groupVars.length === 0) return;

      html += `<div style="margin-bottom:20px;"><h4 style="border-bottom:1px solid var(--border-color);padding-bottom:4px;margin:0 0 12px;font-size:0.85rem;">${group.name}</h4>`;
      groupVars.forEach(varName => {
        const value = themeVars[varName];
        html += `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:8px;background:var(--bg-tertiary);border-radius:8px;">
            <span style="font-size:0.75rem;color:var(--text-secondary);min-width:160px;">${varName}</span>
            <input type="color" value="${value}" data-var="${varName}" style="width:40px;height:32px;border:none;border-radius:4px;cursor:pointer;">
            <input type="text" value="${value}" data-var="${varName}" style="flex:1;font-family:monospace;font-size:0.75rem;padding:4px 8px;background:var(--input-bg);border:1px solid var(--border-color);border-radius:4px;color:var(--input-text);">
          </div>
        `;
      });
      html += '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('input[type="color"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const varName = target.dataset.var!;
        const value = target.value;
        this.applyVariable(varName, value);
        const textInput = container.querySelector(`input[type="text"][data-var="${varName}"]`) as HTMLInputElement;
        if (textInput) textInput.value = value;
      });
    });

    container.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const varName = target.dataset.var!;
        const value = target.value;
        if (this.isValidColor(value)) {
          this.applyVariable(varName, value);
          const colorInput = container.querySelector(`input[type="color"][data-var="${varName}"]`) as HTMLInputElement;
          if (colorInput) colorInput.value = value;
        }
      });
    });
  }

  private isValidColor(value: string): boolean {
    const s = new Option().style;
    s.color = value;
    return s.color !== '';
  }

  private applyVariable(varName: string, value: string): void {
    document.documentElement.style.setProperty(varName, value);
    if (!this.customThemes[this.currentTheme]) this.customThemes[this.currentTheme] = {};
    this.customThemes[this.currentTheme][varName] = value;
    this.updatePreview();
  }

  private updatePreview(): void {
    const container = this.element.querySelector('#theme-preview-content')!;
    const mode = (this.element.querySelector('#preview-mode-select') as HTMLSelectElement).value;

    let html = '';

    if (mode === 'overview' || mode === 'all') {
      html += this.createPreviewCard('Tarjeta de modo', `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:16px;text-align:center;min-width:200px;">
          <div style="font-size:2rem;margin-bottom:8px;">|</div>
          <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">Palabra por palabra</div>
          <div style="font-size:0.7rem;color:var(--text-secondary);">Velocidad pura</div>
        </div>
      `);
    }

    if (mode === 'reading' || mode === 'all') {
      html += this.createPreviewCard('Display de lectura', `
        <div class="word-display" style="max-width:400px;">
          <span class="context-extra">Contexto </span>
          <span class="pointer">|</span><span class="focal">Palabra</span>
          <span class="context-extra"> siguiente</span>
        </div>
      `);
    }

    if (mode === 'modal' || mode === 'all') {
      html += this.createPreviewCard('Modal', `
        <div style="background:var(--modal-bg);border:1px solid var(--modal-border);border-radius:16px;padding:24px;min-width:300px;max-width:400px;">
          <h3 style="color:var(--accent-primary);margin:0 0 16px;">Configuración</h3>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button class="btn btn-primary" style="padding:8px 16px;">Primario</button>
            <button class="btn btn-secondary" style="padding:8px 16px;">Secundario</button>
          </div>
          <label style="display:block;font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px;">Velocidad</label>
          <input type="range" min="50" max="999" value="250" step="10" style="width:100%;-webkit-appearance:none;height:5px;border-radius:3px;background:var(--slider-track);">
        </div>
      `);
    }

    if (mode === 'all') {
      html += this.createPreviewCard('Variables CSS', `
        <div style="font-family:monospace;font-size:0.7rem;color:var(--text-secondary);max-width:500px;text-align:left;">
          ${Object.entries(THEME_VARIABLES[this.currentTheme]).map(([k, v]) => `${k}: ${v}`).join('<br>')}
        </div>
      `);
    }

    container.innerHTML = html;
  }

  private createPreviewCard(title: string, content: string): string {
    return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:16px;min-width:300px;max-width:500px;width:100%;">
        <div style="font-weight:600;color:var(--accent-primary);margin-bottom:12px;font-size:0.85rem;">${title}</div>
        ${content}
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