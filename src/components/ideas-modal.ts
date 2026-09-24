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
      <div class="modal" style="width:640px;max-width:95vw;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">📌 Mi Caja de Ideas</h2>
          <button class="btn btn-secondary" id="btn-close-ideas" style="padding:6px 14px;font-size:0.85rem;">Cerrar</button>
        </div>
        <p style="color:var(--text-secondary);font-size:0.9rem;margin:-8px 0 16px;">
          Cada tarjeta guarda algo que aprendiste. Puedes unirla con otras que se parezcan, como hilos entre notas.
        </p>

        <div class="modal-section" id="ideas-form">
          <label>Nueva tarjeta:</label>
          <input type="text" id="idea-titulo" placeholder="¿De qué trata tu idea?" style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.9rem;outline:none;margin-bottom:8px;">
          <textarea id="idea-texto" placeholder="Cuéntala con tus palabras..." style="width:100%;height:70px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);padding:10px;font-size:0.9rem;font-family:inherit;resize:vertical;outline:none;margin-bottom:8px;"></textarea>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <input type="file" id="idea-foto" accept="image/*" style="color:var(--text-secondary);font-size:0.85rem;">
            <img id="idea-foto-preview" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--border-color);display:none;">
          </div>
          <div id="idea-enlaces" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"></div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" id="btn-guardar-idea" style="padding:8px 18px;">Guardar tarjeta</button>
          </div>
        </div>

        <div class="modal-section">
          <label>Tus tarjetas:</label>
          <div id="ideas-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:8px;"></div>
          <p id="ideas-vacio" style="color:var(--text-muted);text-align:center;font-size:0.9rem;padding:20px 0;">Aún no tienes tarjetas. ¡Crea la primera arriba!</p>
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
        fotoPreview.style.display = 'block';
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
    box.innerHTML = this.notas.map(n => `
      <label style="display:flex;align-items:center;gap:5px;font-size:0.8rem;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:14px;padding:4px 10px;color:var(--text-primary);cursor:pointer;">
        <input type="checkbox" value="${n.id}" style="width:auto;">${escapeHtml(n.titulo)}
      </label>
    `).join('');
  }

  private renderGrid(): void {
    const grid = this.element.querySelector('#ideas-grid')!;
    const vacio = this.element.querySelector('#ideas-vacio') as HTMLElement;
    vacio.style.display = this.notas.length ? 'none' : 'block';
    grid.innerHTML = this.notas.map((n, i) => {
      const pin = PINES[i % PINES.length];
      const chips = n.enlaces
        .map(id => this.notas.find(x => x.id === id))
        .filter((t): t is IdeaNota => !!t)
        .map(t => `<span data-go="${t.id}" style="font-size:0.7rem;font-weight:700;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:10px;padding:3px 8px;cursor:pointer;display:inline-block;margin:2px 4px 0 0;">🧵 ${escapeHtml(t.titulo)}</span>`)
        .join('');
      return `
        <div id="nota-${n.id}" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:12px;position:relative;">
          <div style="width:10px;height:10px;border-radius:50%;background:${pin};position:absolute;top:-5px;left:14px;box-shadow:0 2px 3px rgba(0,0,0,.4);"></div>
          ${n.foto ? `<img src="${n.foto}" style="width:100%;height:80px;object-fit:cover;border-radius:5px;margin-bottom:6px;">` : ''}
          <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;margin-bottom:4px;">${escapeHtml(n.titulo)}</div>
          ${n.texto ? `<div style="color:var(--text-secondary);font-size:0.8rem;line-height:1.4;margin-bottom:6px;">${escapeHtml(n.texto)}</div>` : ''}
          ${chips ? `<div style="margin-bottom:6px;">${chips}</div>` : ''}
          <div style="display:flex;justify-content:flex-end;">
            <button data-del="${n.id}" style="background:none;border:none;color:var(--text-muted);font-size:0.75rem;cursor:pointer;">Quitar</button>
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
    fotoPreview.style.display = 'none';

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
