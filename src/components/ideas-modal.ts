/* ===== COMPONENTES/IDEAS-MODAL.TS - Mi Caja de Ideas (Zettelkasten) ===== */
import { modalManager, createElement } from './ui-utils.js';
import { IdeasStorage, type IdeaNota } from '../categorias/ideas/index.js';

function appendToBody(element: HTMLElement): void {
  document.body.appendChild(element);
}

const PINES = ['#e4572e', '#2a9d8f', '#8e6cc7', '#e9b44c'];

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export class IdeasModal {
  private element: HTMLElement;
  private onBack: () => void;
  private notas: IdeaNota[] = [];
  private fotoPendiente: string | null = null;

  constructor(onBack: () => void = () => {}) {
    this.onBack = onBack;
    this.notas = IdeasStorage.cargar();
    this.element = this.createElement();
    appendToBody(this.element);
    modalManager.register('ideas', this.element);
    this.renderGrid();
    this.renderEnlaces();
  }

  private createElement(): HTMLElement {
    const overlay = createElement('div', 'modal-overlay hidden', `
      <div class="modal ideas-modal">
        <div class="ideas-header">
          <h2 style="margin:0;">📌 Mi Caja de Ideas</h2>
          <button class="btn btn-secondary" id="btn-close-ideas" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <p class="ideas-description">
          Cada tarjeta guarda algo que aprendiste. Puedes unirla con otras que se parezcan, como hilos entre notas.
        </p>

        <div class="modal-section" id="ideas-form">
          <label>Nueva tarjeta:</label>
          <input type="text" id="idea-titulo" placeholder="¿De qué trata tu idea?" class="ideas-form-input">
          <textarea id="idea-texto" placeholder="Cuéntala con tus palabras..." class="ideas-form-textarea"></textarea>
          <div class="ideas-photo-row">
            <input type="file" id="idea-foto" accept="image/*">
            <img id="idea-foto-preview" class="ideas-photo-preview is-hidden" alt="Vista previa">
          </div>
          <div id="idea-enlaces" class="ideas-enlaces"></div>
          <div class="ideas-actions">
            <button class="btn btn-primary" id="btn-guardar-idea" style="padding:8px 18px;">Guardar tarjeta</button>
          </div>
        </div>

        <div class="modal-section">
          <label>Tus tarjetas:</label>
          <div id="ideas-grid" class="ideas-grid"></div>
          <p id="ideas-vacio" class="ideas-empty">Aún no tienes tarjetas. ¡Crea la primera arriba!</p>
        </div>
      </div>
    `);

    const closeBtn = overlay.querySelector('#btn-close-ideas') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.hide();
      this.onBack();
    });

    const fotoInput = overlay.querySelector('#idea-foto') as HTMLInputElement;
    const fotoPreview = overlay.querySelector('#idea-foto-preview') as HTMLImageElement;
    fotoInput.addEventListener('change', () => {
      const f = fotoInput.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPendiente = reader.result as string;
        fotoPreview.src = this.fotoPendiente;
        fotoPreview.classList.remove('is-hidden');
      };
      reader.readAsDataURL(f);
    });

    const guardarBtn = overlay.querySelector('#btn-guardar-idea') as HTMLButtonElement;
    guardarBtn.addEventListener('click', () => this.guardarNota(overlay));

    const grid = overlay.querySelector('#ideas-grid')!;
    grid.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const go = target.closest('[data-go]') as HTMLElement | null;
      if (go) {
        const el = overlay.querySelector(`#nota-${go.dataset.go}`) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '3px solid #e9b44c';
          setTimeout(() => { el.style.outline = ''; }, 1200);
        }
        return;
      }
      const del = target.closest('[data-del]') as HTMLElement | null;
      if (del) this.borrarNota(del.dataset.del!, overlay);
    });

    return overlay;
  }

  private renderEnlaces(): void {
    const box = this.element.querySelector('#idea-enlaces')!;
    if (this.notas.length === 0) {
      box.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted);">Aún no tienes otras tarjetas para conectar</span>`;
      return;
    }
    box.innerHTML = this.notas.length
      ? this.notas.map(n => `
          <label class="ideas-enlace-label">
            <input type="checkbox" value="${n.id}">${escapeHtml(n.titulo)}
          </label>
        `).join('')
      : '<span style="font-size:0.8rem;color:var(--text-muted);">Aún no tienes otras tarjetas para conectar</span>';
  }

  private renderGrid(): void {
    const grid = this.element.querySelector('#ideas-grid')!;
    const vacio = this.element.querySelector('#ideas-vacio') as HTMLElement;
    vacio.classList.toggle('is-hidden', this.notas.length > 0);
    grid.innerHTML = this.notas.map((n, i) => {
      const pin = PINES[i % PINES.length];
      const chips = n.enlaces
        .map(id => this.notas.find(x => x.id === id))
        .filter((t): t is IdeaNota => !!t)
        .map(t => `<span class="idea-card-chip" data-go="${t.id}">🧵 ${escapeHtml(t.titulo)}</span>`)
        .join('');
      return `
        <div id="nota-${n.id}" class="idea-card">
          <div class="idea-card-pin" style="background:${pin};"></div>
          ${n.foto ? `<img src="${n.foto}" alt="">` : ''}
          <div class="idea-card-title">${escapeHtml(n.titulo)}</div>
          ${n.texto ? `<div class="idea-card-text">${escapeHtml(n.texto)}</div>` : ''}
          ${chips ? `<div class="idea-card-chips">${chips}</div>` : ''}
          <div class="idea-card-actions">
            <button data-del="${n.id}" class="idea-card-delete">Quitar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  private guardarNota(overlay: HTMLElement): void {
    const tituloInput = overlay.querySelector('#idea-titulo') as HTMLInputElement;
    const textoInput = overlay.querySelector('#idea-texto') as HTMLTextAreaElement;
    const titulo = tituloInput.value.trim();
    if (!titulo) {
      tituloInput.focus();
      return;
    }
    const enlaces = Array.from(overlay.querySelectorAll('#idea-enlaces input:checked'))
      .map(c => (c as HTMLInputElement).value);

    const nota: IdeaNota = {
      id: IdeasStorage.crearId(),
      titulo,
      texto: textoInput.value.trim(),
      foto: this.fotoPendiente,
      enlaces,
      creada: Date.now(),
    };
    this.notas.push(nota);
    IdeasStorage.guardar(this.notas);

    tituloInput.value = '';
    textoInput.value = '';
    this.fotoPendiente = null;
    const fotoInput = overlay.querySelector('#idea-foto') as HTMLInputElement;
    const fotoPreview = overlay.querySelector('#idea-foto-preview') as HTMLImageElement;
    fotoInput.value = '';
    fotoPreview.classList.add('is-hidden');

    this.renderGrid();
    this.renderEnlaces();
  }

  private borrarNota(id: string, overlay: HTMLElement): void {
    this.notas = this.notas.filter(n => n.id !== id);
    this.notas.forEach(n => { n.enlaces = n.enlaces.filter(l => l !== id); });
    IdeasStorage.guardar(this.notas);
    this.renderGrid();
    this.renderEnlaces();
    void overlay;
  }

  show(): void {
    this.notas = IdeasStorage.cargar();
    this.renderGrid();
    this.renderEnlaces();
    modalManager.show('ideas');
  }

  hide(): void {
    modalManager.hide('ideas');
  }
}
