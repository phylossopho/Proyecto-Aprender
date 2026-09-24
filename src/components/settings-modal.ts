import { modalManager, createElement } from './ui-utils.js';
import { StateManager } from '../core/state.js';
import type { Theme, FontSize } from '../core/types.js';
import { ICONO_TEMA_OSCURO, ICONO_TEMA_NEON, ICONO_TEMA_CLARO } from '../utils/iconos.js';

function appendToBody(element: HTMLElement): void {
  document.body.appendChild(element);
}

export class SettingsModal {
  private element: HTMLElement;
  private state = StateManager.getInstance();

  constructor() {
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('settings', this.element);
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal" style="width:420px;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Configuración</h2>
          <button class="btn btn-secondary" id="btn-close-settings" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <div class="settings-modal" style="padding:10px 0;">
          <div class="setting-row">
            <span class="setting-label">Tema:</span>
            <div class="theme-options" id="theme-options"></div>
          </div>
          <div class="setting-row" style="border-bottom:none;">
            <span class="setting-label">Tamaño de texto:</span>
            <div class="font-options" id="font-options"></div>
          </div>
          <div class="setting-row" style="border-bottom:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
            <div class="stats-summary" id="stats-summary"></div>
          </div>
        </div>
      </div>
    `);

    const closeBtn = overlay.querySelector('#btn-close-settings') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hide());

    this.renderThemeOptions(overlay);
    this.renderFontOptions(overlay);
    this.renderStats(overlay);

    return overlay;
  }

  private renderThemeOptions(container: HTMLElement): void {
    const themeContainer = container.querySelector('#theme-options')!;
    const themes: { id: Theme; label: string; icon: string }[] = [
      { id: 'dark', label: 'Oscuro', icon: ICONO_TEMA_OSCURO },
      { id: 'neon', label: 'Neon', icon: ICONO_TEMA_NEON },
      { id: 'light', label: 'Claro', icon: ICONO_TEMA_CLARO },
    ];

    themes.forEach(t => {
      const btn = createElement('button', 'theme-opt', `${t.icon} ${t.label}`);
      btn.dataset.theme = t.id;
      btn.addEventListener('click', () => {
        this.state.setTheme(t.id);
        this.updateThemeButtons(container, t.id);
      });
      container.appendChild(btn);
    });

    this.updateThemeButtons(container, this.state.getState().theme);
  }

  private updateThemeButtons(container: HTMLElement, active: Theme): void {
    container.querySelectorAll('.theme-opt').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.theme === active);
    });
  }

  private renderFontOptions(container: HTMLElement): void {
    const fontContainer = container.querySelector('#font-options')!;
    const sizes: { id: FontSize; label: string }[] = [
      { id: 'small', label: 'Pequeño' },
      { id: 'medium', label: 'Mediano' },
      { id: 'large', label: 'Grande' },
    ];

    sizes.forEach(s => {
      const btn = createElement('button', 'font-opt', s.label);
      btn.dataset.size = s.id;
      btn.addEventListener('click', () => {
        this.state.setFontSize(s.id);
        this.updateFontButtons(container, s.id);
      });
      fontContainer.appendChild(btn);
    });

    this.updateFontButtons(container, this.state.getState().fontSize);
  }

  private updateFontButtons(container: HTMLElement, active: FontSize): void {
    container.querySelectorAll('.font-opt').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.size === active);
    });
  }

  private renderStats(container: HTMLElement): void {
    const statsContainer = container.querySelector('#stats-summary')!;
    const stats = this.state.getState().trainingStats;
    statsContainer.innerHTML = `
      <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:8px;">Estadísticas de entrenamiento</div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem;">
        <span>Sesiones:</span><span style="color:var(--accent-primary);font-weight:600;">${stats.sessions}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem;">
        <span>Palabras totales:</span><span style="color:var(--accent-primary);font-weight:600;">${stats.totalWords}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem;">
        <span>Tiempo total:</span><span style="color:var(--accent-primary);font-weight:600;">${Math.floor(stats.totalTime / 60)} min</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem;">
        <span>Mejor WPM:</span><span style="color:var(--accent-primary);font-weight:600;">${stats.bestWPM}</span>
      </div>
    `;
  }

  show(): void {
    this.updateThemeButtons(this.element, this.state.getState().theme);
    this.updateFontButtons(this.element, this.state.getState().fontSize);
    this.renderStats(this.element);
    modalManager.show('settings');
  }

  hide(): void {
    modalManager.hide('settings');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

export const settingsModal = new SettingsModal();