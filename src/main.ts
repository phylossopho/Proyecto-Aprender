import './styles/main.css';
import { StateManager } from './core/state.js';
import { ModeModal } from './components/modals.js';
import { ConfigModal } from './components/modals.js';
import { TextsModal } from './components/modals.js';
import { ControlsManager } from './components/controls.js';
import { CategoriaModal } from './components/categoria-modal.js';
import { IdeasModal } from './components/ideas-modal.js';
import { settingsModal } from './components/settings-modal.js';
import { themeEditorModal } from './components/theme-editor-modal.js';
import { SistemaAudio } from './utils/audio.js';
import { CATEGORIAS, type CategoriaId } from './core/categorias.js';
import type { Mode } from './core/types.js';
import { ICONO_PALETAL, ICONO_CONFIGURACION } from './utils/iconos.js';
import { modalManager } from './components/ui-utils.js';

// Global error handler for debugging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#ef4444;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
  div.textContent = `Error: ${e.error?.message || e.message}`;
  document.body.appendChild(div);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#ef4444;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
  div.textContent = `Promise error: ${e.reason?.message || e.reason}`;
  document.body.appendChild(div);
});

class App {
  private state = StateManager.getInstance();
  private categoriaModal!: CategoriaModal;
  private modeModal!: ModeModal;
  private configModal!: ConfigModal;
  private textsModal!: TextsModal;
  private ideasModal!: IdeasModal;
  private controls!: ControlsManager;
  private initialized = false;
  private pantallaAnterior: 'categoria' | 'config' = 'categoria';

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.waitForDOM();
      console.log('DOM ready, creating UI...');
      this.createUI();

      // Inicializar sistema de sonidos
      const audio = SistemaAudio.getInstance();
      audio.detectarSonidos().catch(() => {});

      console.log('UI created, initializing modals...');
      this.initializeModals();
      console.log('Modals initialized, initializing controls...');
      this.initializeControls();
      console.log('Controls initialized, applying theme...');
      this.applyInitialTheme();
      console.log('Theme applied, showing category modal...');
      this.showCategoriaModal();
      this.initialized = true;
      console.log('App initialized successfully');
    } catch (err) {
      console.error('Init error:', err);
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#ef4444;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
      div.textContent = `Init error: ${err instanceof Error ? err.message : String(err)}`;
      document.body.appendChild(div);
    }
  }

  private waitForDOM(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
  }

  private createUI(): void {
    const app = document.getElementById('app')!;
    app.innerHTML = `
       <header class="top-bar">
         <h1 class="app-title">Lectura Veloz</h1>
         <div class="stats" id="stats-bar">
           <div>Progreso: <span id="word-counter">0 / 0</span></div>
           <div>Tiempo: <span id="elapsed-time">0:00</span></div>
         </div>
         <div style="display:flex;align-items:center;gap:12px;">
           <button class="settings-btn" id="btn-visual-customize" aria-label="Personalizar colores">${ICONO_PALETAL}</button>
           <button class="settings-btn" id="btn-settings" aria-label="Configuración">${ICONO_CONFIGURACION}</button>
         </div>
       </header>

        <main class="main-area">
          <div class="mode-badge is-hidden" id="mode-badge"></div>
          <div class="word-display" id="word-display">
            <span class="mensaje-inicio">Selecciona una categoría para comenzar</span>
          </div>
          <div class="line-timer-bar is-hidden" id="line-timer-bar">
            <div class="line-timer-fill" id="line-timer-fill"></div>
          </div>
          <div class="pause-indicator is-hidden" id="pause-indicator">PAUSADO</div>
        </main>

         <div class="controls is-hidden" id="controls-container">
          <button class="btn btn-secondary" id="btn-pause">⏸️</button>
          <div class="control-separator"></div>
          <button class="btn btn-secondary" id="btn-reset">🔁</button>
          <div class="slider-group">
            <input type="range" id="wpm-slider" min="50" max="999" value="250" step="10">
            <div class="wpm-value" id="wpm-display">250</div>
            <button class="btn btn-secondary" id="btn-wpm-minus">−</button>
            <button class="btn btn-secondary" id="btn-wpm-plus">+</button>
          </div>
          <div class="control-separator"></div>
          <button class="btn btn-secondary" id="btn-volver-categoria">↩️</button>
          <button class="btn btn-secondary" id="btn-home">🏠</button>
        </div>

      <div class="modal-overlay hidden" id="mode-modal"></div>
      <div class="modal-overlay hidden" id="config-modal"></div>
      <div class="modal-overlay hidden" id="texts-modal"></div>
      <div class="modal-overlay hidden" id="settings-modal"></div>
      <div class="modal-overlay hidden" id="theme-editor-modal"></div>

      <audio id="sonidoAcierto" preload="auto"></audio>
    `;
  }

  private initializeModals(): void {
    this.categoriaModal = new CategoriaModal(
      (categoriaId: CategoriaId) => this.handleCategoriaSelect(categoriaId)
    );

    this.modeModal = new ModeModal(
      (mode: Mode) => this.state.setMode(mode),
      () => this.configModal.show(),
      () => this.showCategoriaModal()
    );

    this.configModal = new ConfigModal(
      () => this.startReading(),
      () => this.showModeModal()
    );

    this.textsModal = new TextsModal(() => {
      modalManager.show('categoria');
    });

    this.ideasModal = new IdeasModal(() => {
      modalManager.show('categoria');
    });

    const settingsBtn = document.getElementById('btn-settings');
    settingsBtn?.addEventListener('click', () => settingsModal.show());

    const customizeBtn = document.getElementById('btn-visual-customize');
    customizeBtn?.addEventListener('click', () => this.openVisualCustomizer());
  }

  private handleCategoriaSelect(categoriaId: CategoriaId): void {
    if (categoriaId === 'lectura-rapida') {
      this.categoriaModal.hide();
      this.showModeModal();
    } else if (categoriaId === 'textos') {
      this.categoriaModal.hide();
      this.textsModal.show();
    } else if (categoriaId === 'ideas') {
      this.categoriaModal.hide();
      this.ideasModal.show();
    } else if (categoriaId === 'evaluaciones' || categoriaId === 'mini-juegos') {
      const categoria = CATEGORIAS.find(c => c.id === categoriaId);
      alert(`${categoria?.nombre}: próximamente disponible`);
    }
  }

  private showCategoriaModal(): void {
    this.categoriaModal.show();
  }

   private initializeControls(): void {
     this.controls = new ControlsManager();

     const wpmMinus = document.getElementById('btn-wpm-minus');
     const wpmPlus = document.getElementById('btn-wpm-plus');
     wpmMinus?.addEventListener('click', () => this.controls.adjustWPM(-20));
     wpmPlus?.addEventListener('click', () => this.controls.adjustWPM(20));

     const btnHome = document.getElementById('btn-home');
     btnHome?.addEventListener('click', () => this.goToHome());

      const btnVolver = document.getElementById('btn-volver-categoria');
      btnVolver?.addEventListener('click', () => this.goToCategoria());

      const btnReset = document.getElementById('btn-reset');
      btnReset?.addEventListener('click', () => this.controls.reiniciarPractica());
   }

  private goToHome(): void {
    this.controls.resetSession();
    this.pantallaAnterior = 'categoria';
    this.ocultarDistracciones(false);
    this.showCategoriaModal();
  }

  private goToCategoria(): void {
    this.controls.resetSession();
    this.ocultarDistracciones(false);
    if (this.pantallaAnterior === 'config') {
      this.configModal.show();
    } else {
      this.showCategoriaModal();
    }
  }

  private ocultarDistracciones(hide: boolean): void {
    const appTitle = document.querySelector('.app-title') as HTMLElement | null;
    const statsBar = document.getElementById('stats-bar');
    const modeBadge = document.getElementById('mode-badge');
    const settingsBtns = document.querySelectorAll('.settings-btn');
    if (appTitle) appTitle.classList.toggle('is-hidden', hide);
    if (statsBar) statsBar.classList.toggle('is-hidden', hide);
    if (modeBadge) modeBadge.classList.toggle('is-hidden', hide);
    settingsBtns.forEach(btn => {
      btn.setAttribute('data-hidden', hide ? 'true' : 'false');
    });
  }

  private applyInitialTheme(): void {
    const theme = this.state.getState().theme;
    const fontSize = this.state.getState().fontSize;
    document.body.className = `theme-${theme} font-${fontSize}`;
  }

  private showModeModal(): void {
    this.modeModal.show();
  }

  private startReading(): void {
    const text = this.configModal.getText();
    if (!text) return;

    this.pantallaAnterior = 'config';
    this.ocultarDistracciones(true);

    this.state.loadText(text);
    this.state.startSession();

    this.controls.setMode(this.state.getState().mode);
    this.controls.startEngine();

    const controls = document.getElementById('controls-container');
    if (controls) controls.classList.remove('is-hidden');

    const wordDisplay = document.getElementById('word-display');
    if (wordDisplay) {
      const span = wordDisplay.querySelector('span');
      if (span) span.textContent = '';
    }

    const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
    if (btnPause) btnPause.disabled = false;
  }

  private openVisualCustomizer(): void {
    themeEditorModal.show();
  }
}

const app = new App();
app.init();