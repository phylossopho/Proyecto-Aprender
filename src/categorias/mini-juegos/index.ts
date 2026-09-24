/* ===== CATEGORIAS/MINI-JUEGOS/INDEX.TS ===== */
import { ICONO_JUEGO_SCHULTE, ICONO_JUEGO_MEMORIA, ICONO_JUEGO_REACCION } from '../../utils/iconos.js';

export interface JuegoModo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

export const JUEGOS_DISPONIBLES: JuegoModo[] = [
  { id: 'schulte', nombre: 'Tabla de Schulte', descripcion: 'Encuentra números en orden lo más rápido posible', icono: ICONO_JUEGO_SCHULTE },
  { id: 'memoria', nombre: 'Memoria Secuencial', descripcion: 'Repite secuencias de colores en orden', icono: ICONO_JUEGO_MEMORIA },
  { id: 'reaccion', nombre: 'Reacción Visual', descripcion: 'Toca objetivos que aparecen aleatoriamente', icono: ICONO_JUEGO_REACCION },
];

export class CategoriaMiniJuegos {
  static obtenerModos(): JuegoModo[] {
    return JUEGOS_DISPONIBLES;
  }

  static async inicializar(): Promise<void> {
    console.log('Categoría Mini Juegos inicializada');
  }
}

export default CategoriaMiniJuegos;
