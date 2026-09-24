import { modalManager, createElement, createButton, formatTime } from './ui-utils.js';
import { StateManager } from '../core/state.js';
import type { Mode, Theme, FontSize, ChunkSize } from '../core/types.js';
import { SAMPLE_TEXTS, HISTORY_TEXTS } from '../utils/sample-texts.js';
import { ICONO_CONFIGURACION, ICONO_ATRAS, ICONO_MODO_PALABRA, ICONO_MODO_GRUPO, ICONO_MODO_FRASE, ICONO_MODO_GALACTICO, ICONO_MODO_BIONIC, ICONO_MODO_COLUMNA, ICONO_MODO_PACER, ICONO_MODO_SIN_REGRESION, ICONO_MODO_SKIM } from '../utils/iconos.js';

function appendToBody(element: HTMLElement): void {
  document.body.appendChild(element);
}

export class ModeModal {
  private element: HTMLElement;
  private onModeSelect: (mode: Mode) => void;
  private onStart: () => void;
  private onBack: () => void;

  constructor(onModeSelect: (mode: Mode) => void, onStart: () => void, onBack: () => void) {
    this.onModeSelect = onModeSelect;
    this.onStart = onStart;
    this.onBack = onBack;
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('mode', this.element);
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <button class="btn btn-secondary" id="btn-back-modo" style="padding:6px 12px;font-size:0.8rem;">${ICONO_ATRAS} Atrás</button>
          <h2 style="margin:0;">Lectura Rápida</h2>
          <button class="settings-btn" aria-label="Configuración">${ICONO_CONFIGURACION}</button>
        </div>
        <div class="modal-section">
          <label>Elige cómo quieres practicar:</label>
          <div class="mode-cards" id="mode-cards"></div>
        </div>
      </div>
    `);

    const cardsContainer = overlay.querySelector('#mode-cards')!;
    const modes: { id: Mode; icon: string; name: string; desc: string; when: string }[] = [
      { id: 'word', icon: ICONO_MODO_PALABRA, name: 'Palabra por palabra', desc: 'Las palabras aparecen una a una con puntero visual. Máxima velocidad de procesamiento.', when: 'Para: velocidad pura' },
      { id: 'chunk', icon: ICONO_MODO_GRUPO, name: 'Palabras en grupo', desc: 'Lee grupos de 3-7 palabras separados por comas y puntos. Respetan la puntuación.', when: 'Para: velocidad + comprensión' },
      { id: 'line', icon: ICONO_MODO_FRASE, name: 'Frases completas', desc: 'Lees la frase completa visible en pantalla. Avance automático según velocidad.', when: 'Para: lectura natural a ritmo' },
      { id: 'galactico', icon: ICONO_MODO_GALACTICO, name: 'Galáctico', desc: 'El texto sube desde abajo estilo cómic espacial. Modo juego.', when: 'Para: diversión y entrenamiento visual' },
      { id: 'bionic', icon: ICONO_MODO_BIONIC, name: 'Bionic Reading', desc: 'Resalta en negrita el inicio de cada palabra para que el ojo reconozca el resto sin fijarse por completo.', when: 'Para: leer con menos esfuerzo visual' },
      { id: 'columna', icon: ICONO_MODO_COLUMNA, name: 'Columna angosta', desc: 'El texto se muestra en una columna estrecha, como en una revista, para leer cada línea de un solo vistazo.', when: 'Para: reducir movimientos de ojo' },
      { id: 'pacer', icon: ICONO_MODO_PACER, name: 'Guía con puntero', desc: 'El texto completo queda visible y una guía baja a velocidad constante marcando el ritmo de lectura.', when: 'Para: quitar el hábito de releer' },
      { id: 'sinregresion', icon: ICONO_MODO_SIN_REGRESION, name: 'Sin regresión', desc: 'Lo ya leído se atenúa a medida que avanzas, para que no puedas volver atrás con la vista.', when: 'Para: eliminar la regresión visual' },
      { id: 'skim', icon: ICONO_MODO_SKIM, name: 'Skim / vista previa', desc: 'Muestra primero las palabras clave y las primeras líneas de cada párrafo, antes de leer todo el texto.', when: 'Para: previsualizar antes de estudiar' },
    ];

    modes.forEach(m => {
      const card = createElement('div', 'mode-card', `
        <div class="mode-icon">${m.icon}</div>
        <div class="mode-name">${m.name}</div>
        <div class="mode-desc">${m.desc}</div>
        <div class="mode-when">${m.when}</div>
      `);
      card.dataset.mode = m.id;
      card.addEventListener('click', () => {
        this.onModeSelect(m.id);
        this.hide();
        this.onStart();
      });
      cardsContainer.appendChild(card);
    });

    const backBtn = overlay.querySelector('#btn-back-modo') as HTMLButtonElement;
    backBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });

    const settingsBtn = overlay.querySelector('.settings-btn')!;
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      import('../components/settings-modal.js').then(m => m.settingsModal.show());
    });

    return overlay;
  }

  show(): void {
    modalManager.show('mode');
  }

  hide(): void {
    modalManager.hide('mode');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

export class ConfigModal {
  private element: HTMLElement;
  private onStart: () => void;
  private onBack: () => void;
  private inputText: HTMLTextAreaElement | null = null;

  constructor(onStart: () => void, onBack: () => void) {
    this.onStart = onStart;
    this.onBack = onBack;
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('config', this.element);
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal">
        <h2 style="margin:0 0 20px;">Configurar Texto</h2>
        <div class="modal-section">
          <label>Texto para practicar:</label>
          <textarea id="input-text" placeholder="Pega o escribe el texto que quieres practicar aquí..."></textarea>
        </div>
        <div class="modal-section">
          <label>O carga un archivo de texto:</label>
          <input type="file" id="file-input" accept=".txt,.md" style="width:100%;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);">
        </div>
        <div class="modal-section">
          <label>O elige un texto de ejemplo:</label>
          <div class="sample-texts" id="sample-texts"></div>
        </div>
        <div class="modal-section">
          <label>O lee sobre historia:</label>
          <div class="sample-texts" id="history-texts"></div>
        </div>
         <div class="modal-footer" style="display:flex;justify-content:space-between;align-items:center;">
          <button class="btn btn-secondary" id="btn-back" style="padding:6px 12px;font-size:0.8rem;">${ICONO_ATRAS} Atrás</button>
        </div>
      </div>
    `);

    this.inputText = overlay.querySelector('#input-text')!;

    const fileInput = overlay.querySelector('#file-input') as HTMLInputElement;
    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (this.inputText) this.inputText.value = ev.target?.result as string;
          fileInput.value = '';
          this.hide();
          this.onStart();
        };
        reader.readAsText(file);
      }
    });

    const sampleContainer = overlay.querySelector('#sample-texts')!;
    SAMPLE_TEXTS.forEach((sample, idx) => {
      const btn = createElement('button', 'sample-btn', sample.title);
      btn.addEventListener('click', () => {
        if (this.inputText) this.inputText.value = sample.text;
        this.hide();
        this.onStart();
      });
      sampleContainer.appendChild(btn);
    });

    const historyContainer = overlay.querySelector('#history-texts')!;
    Object.entries(HISTORY_TEXTS).forEach(([key, history]) => {
      const btn = createElement('button', 'sample-btn', history.title);
      btn.addEventListener('click', () => {
        if (this.inputText) this.inputText.value = history.text;
        this.hide();
        this.onStart();
      });
      historyContainer.appendChild(btn);
    });

    const backBtn = overlay.querySelector('#btn-back') as HTMLButtonElement;
    backBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });

    return overlay;
  }

  show(): void {
    modalManager.show('config');
  }

  hide(): void {
    modalManager.hide('config');
  }

  getText(): string {
    return this.inputText?.value || '';
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

export class TextsModal {
  private element: HTMLElement;
  private state = StateManager.getInstance();
  private onBack: () => void;

  constructor(onBack: () => void = () => {}) {
    this.onBack = onBack;
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('texts', this.element);
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal" style="width:520px;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Mis Textos de Práctica</h2>
          <button class="btn btn-secondary" id="btn-close-texts" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <div class="modal-section" style="margin-bottom:8px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="texts-search" placeholder="Buscar por palabra o tema..." style="flex:1;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;outline:none;">
            <select id="texts-category-filter" style="padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;outline:none;">
              <option value="">Todas las categorías</option>
            </select>
          </div>
        </div>
        <div class="modal-section">
          <label>Crear nuevo texto:</label>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <input type="text" id="new-text-title" placeholder="Título del texto" style="flex:1;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button class="btn btn-primary" id="btn-create-new" style="padding:8px 16px;">Crear</button>
          </div>
          <select id="new-text-category" style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;outline:none;margin-bottom:8px;"></select>
          <textarea id="new-text-content" placeholder="Escribe o pega tu texto aquí..." style="width:100%;height:120px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);padding:12px;font-size:0.9rem;font-family:inherit;resize:vertical;outline:none;"></textarea>
          <div id="new-text-form" class="hidden" style="display:flex;flex-direction:column;gap:8px;margin-top:8px;"></div>
          <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;">
            <button class="btn btn-secondary" id="btn-cancel-new" style="padding:6px 16px;font-size:0.8rem;">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-new" style="padding:6px 16px;font-size:0.8rem;">Guardar</button>
          </div>
        </div>
        <div class="modal-section">
          <label>Textos guardados:</label>
          <div id="saved-texts-list" style="max-height:300px;overflow-y:auto;"></div>
        </div>
      </div>
    `);

    const categories = ['Personal', 'Muestra', 'Historia', 'Ciencia', 'Tecnologia', 'Naturaleza', 'Motivacion', 'Ciudad', 'Otro'];
    const categorySelect = overlay.querySelector('#new-text-category') as HTMLSelectElement;
    categories.forEach(c => {
      const opt = createElement('option', '', c);
      opt.value = c;
      categorySelect.appendChild(opt);
    });

    const closeBtn = overlay.querySelector('#btn-close-texts') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });

    const createBtn = overlay.querySelector('#btn-create-new') as HTMLButtonElement;
    const cancelBtn = overlay.querySelector('#btn-cancel-new') as HTMLButtonElement;
    const saveBtn = overlay.querySelector('#btn-save-new') as HTMLButtonElement;
    const newTextForm = overlay.querySelector('#new-text-form') as HTMLElement;
    const titleInput = overlay.querySelector('#new-text-title') as HTMLInputElement;
    const contentInput = overlay.querySelector('#new-text-content') as HTMLTextAreaElement;

    createBtn.addEventListener('click', () => {
      createBtn.style.display = 'none';
      newTextForm.classList.remove('hidden');
      titleInput.value = '';
      contentInput.value = '';
    });

    cancelBtn.addEventListener('click', () => {
      createBtn.style.display = 'inline-flex';
      newTextForm.classList.add('hidden');
    });

    saveBtn.addEventListener('click', () => this.saveNewText());

    this.element = overlay;
    this.renderTextsList();

    return overlay;
  }

  private saveNewText(): void {
    const titleInput = this.element.querySelector('#new-text-title') as HTMLInputElement;
    const categorySelect = this.element.querySelector('#new-text-category') as HTMLSelectElement;
    const contentInput = this.element.querySelector('#new-text-content') as HTMLTextAreaElement;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categorySelect.value;

    if (!title || !content) return;

    const saved = this.getSavedTexts();
    saved.push({ title, content, category, date: new Date().toISOString() });
    this.saveTexts(saved);
    this.renderTextsList();

    titleInput.value = '';
    contentInput.value = '';
    (this.element.querySelector('#btn-create-new') as HTMLElement)!.style.display = 'inline-flex';
    (this.element.querySelector('#new-text-form') as HTMLElement).classList.add('hidden');
  }

  private getSavedTexts(): Array<{title: string; content: string; category: string; date: string}> {
    try {
      const data = localStorage.getItem('reading-saved-texts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveTexts(texts: Array<{title: string; content: string; category: string; date: string}>): void {
    try {
      localStorage.setItem('reading-saved-texts', JSON.stringify(texts));
    } catch { /* ignore */ }
  }

  private renderTextsList(): void {
    const list = this.element.querySelector('#saved-texts-list')!;
    const search = (this.element.querySelector('#texts-search') as HTMLInputElement).value.toLowerCase();
    const category = (this.element.querySelector('#texts-category-filter') as HTMLSelectElement).value;

    let saved = this.getSavedTexts();

    if (search) {
      saved = saved.filter(t => 
        t.title.toLowerCase().includes(search) || 
        t.content.toLowerCase().includes(search)
      );
    }
    if (category) {
      saved = saved.filter(t => t.category === category);
    }

    const categories = new Set(saved.map(t => t.category));
    const filterSelect = this.element.querySelector('#texts-category-filter') as HTMLSelectElement;
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(c => {
      const opt = createElement('option', '', c);
      opt.value = c;
      filterSelect.appendChild(opt);
    });
    filterSelect.value = currentFilter;

    list.innerHTML = saved.map((text, idx) => `
      <div class="saved-text-item" data-index="${idx}">
        <div class="saved-text-info">
          <span class="saved-text-title">${text.title}</span>
          <span class="saved-text-preview">${text.content.slice(0, 80)}...</span>
        </div>
        <div class="saved-text-actions">
          <button class="saved-text-btn use" data-action="use" data-index="${idx}">Usar</button>
          <button class="saved-text-btn edit" data-action="edit" data-index="${idx}">Editar</button>
          <button class="saved-text-btn delete" data-action="delete" data-index="${idx}">Eliminar</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.saved-text-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLButtonElement).dataset.action;
        const index = parseInt((e.currentTarget as HTMLButtonElement).dataset.index!, 10);
        this.handleAction(action!, index);
      });
    });
  }

  private handleAction(action: string, index: number): void {
    const saved = this.getSavedTexts();
    const text = saved[index];

    if (action === 'use') {
      const configModal = document.getElementById('config-modal');
      const inputText = configModal?.querySelector('#input-text') as HTMLTextAreaElement;
      if (inputText) inputText.value = text.content;
      this.hide();
      this.onBack();
    } else if (action === 'edit') {
      // Implement edit inline
    } else if (action === 'delete') {
      saved.splice(index, 1);
      this.saveTexts(saved);
      this.renderTextsList();
    }
  }

  show(): void {
    this.renderTextsList();
    modalManager.show('texts');
  }

  hide(): void {
    modalManager.hide('texts');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}