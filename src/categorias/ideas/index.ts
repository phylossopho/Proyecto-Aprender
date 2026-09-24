/* ===== CATEGORIAS/IDEAS/INDEX.TS - Mi Caja de Ideas (estilo Zettelkasten) ===== */

export interface IdeaNota {
  id: string;
  titulo: string;
  texto: string;
  foto: string | null;
  enlaces: string[]; // ids de otras notas relacionadas
  creada: number;
}

const STORAGE_KEY = 'ideas-notas';

export class IdeasStorage {
  private static isAvailable(): boolean {
    try {
      const t = '__storage_test__';
      localStorage.setItem(t, t);
      localStorage.removeItem(t);
      return true;
    } catch {
      return false;
    }
  }

  static cargar(): IdeaNota[] {
    if (!this.isAvailable()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as IdeaNota[]) : [];
    } catch {
      return [];
    }
  }

  static guardar(notas: IdeaNota[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
    } catch {
      // Silently fail (p.ej. cuota excedida por fotos grandes)
    }
  }

  static crearId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
}

export class CategoriaIdeas {
  static async inicializar(): Promise<void> {
    // El modal se crea de forma temprana en main.ts (igual que TextsModal),
    // así que aquí no hay nada que cargar de forma perezosa.
  }
}

export default CategoriaIdeas;
