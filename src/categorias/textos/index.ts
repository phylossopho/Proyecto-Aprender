/* ===== CATEGORIAS/TEXTOS/INDEX.TS ===== */
import { SAMPLE_TEXTS, HISTORY_TEXTS } from '../../utils/sample-texts.js';
import { CategoriaTexto } from '../../core/types.js';

export class CategoriaTextos {
  static obtenerTextosEjemplo() {
    return SAMPLE_TEXTS;
  }

  static obtenerTextosHistoria() {
    return HISTORY_TEXTS;
  }

  static obtenerTextosGuardados(): Array<{ titulo: string; contenido: string; categoria: string; fecha: string }> {
    try {
      const data = localStorage.getItem('reading-saved-texts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static guardarTexto(titulo: string, contenido: string, categoria: CategoriaTexto): void {
    try {
      const saved = this.obtenerTextosGuardados();
      saved.push({ titulo, contenido, categoria, fecha: new Date().toISOString() });
      localStorage.setItem('reading-saved-texts', JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  static eliminarTexto(fecha: string): void {
    try {
      const saved = this.obtenerTextosGuardados().filter(t => t.fecha !== fecha);
      localStorage.setItem('reading-saved-texts', JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  static async inicializar(): Promise<void> {
    console.log('Categoría Textos inicializada');
  }
}

export default CategoriaTextos;
