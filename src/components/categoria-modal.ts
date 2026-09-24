/* ===== COMPONENTES/CATEGORIA-MODAL.TS ===== */
import { modalManager, createElement } from './ui-utils.js';
import { CATEGORIAS, type CategoriaId } from '../core/categorias.js';
import { ICONO_CONFIGURACION } from '../utils/iconos.js';

function appendToBody(element: HTMLElement): void {
  document.body.appendChild(element);
}

export class CategoriaModal {
  private element: HTMLElement;
  private onCategoriaSelect: (id: CategoriaId) => void;

  constructor(onCategoriaSelect: (id: CategoriaId) => void) {
    this.onCategoriaSelect = onCategoriaSelect;
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('categoria', this.element);
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Selecciona una categoría</h2>
          <button class="settings-btn" aria-label="Configuración">${ICONO_CONFIGURACION}</button>
        </div>
        <div class="modal-section">
          <label>Elige qué quieres practicar:</label>
          <div class="categoria-cards" id="categoria-cards"></div>
        </div>
      </div>
    `);

    const container = overlay.querySelector('#categoria-cards')!;

    CATEGORIAS.forEach(cat => {
      const card = createElement('div', 'category-card', `
        <div class="category-icon">${cat.icono}</div>
        <div class="category-name">${cat.nombre}</div>
        <div class="category-desc">${cat.descripcion}</div>
        <div class="category-when">${cat.cantidad} opciones</div>
      `);
      card.dataset.categoria = cat.id;
      card.addEventListener('click', () => {
        this.onCategoriaSelect(cat.id as CategoriaId);
      });
      container.appendChild(card);
    });

    const settingsBtn = overlay.querySelector('.settings-btn')!;
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      import('./settings-modal.js').then(m => m.settingsModal.show());
    });

    return overlay;
  }

  show(): void {
    modalManager.show('categoria');
  }

  hide(): void {
    modalManager.hide('categoria');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
