/* ===== CATEGORIAS/LECTURA-RAPIDA/INDEX.TS ===== */
import type { Mode } from '../../core/types.js';
import { MODOS_LECTURA, type ModoLectura } from '../../core/categorias.js';
import { ICONO_MODO_PALABRA, ICONO_MODO_GRUPO, ICONO_MODO_FRASE, ICONO_MODO_GALACTICO } from '../../utils/iconos.js';

const MODOS: Record<string, { icono: string }> = {
  word: { icono: ICONO_MODO_PALABRA },
  chunk: { icono: ICONO_MODO_GRUPO },
  line: { icono: ICONO_MODO_FRASE },
  galactico: { icono: ICONO_MODO_GALACTICO },
};

export class CategoriaLecturaRapida {
  static obtenerModos(): ModoLectura[] {
    return MODOS_LECTURA.map(m => ({
      ...m,
      icono: MODOS[m.id]?.icono || '',
    }));
  }

  static async inicializar(): Promise<void> {
    console.log('Lectura Rápido inicializada');
  }

  static async cargarTexto(): Promise<string> {
    return '';
  }
}

export default CategoriaLecturaRapida;
