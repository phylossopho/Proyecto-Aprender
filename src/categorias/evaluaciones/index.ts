/* ===== CATEGORIAS/EVALUACIONES/INDEX.TS ===== */
import type { Mode } from '../../core/types.js';

export interface EvaluacionModo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'pdf' | 'imagen' | 'texto';
}

export const EVALUACIONES_DISPONIBLES: EvaluacionModo[] = [
  { id: 'cargar-pdf', nombre: 'Cargar PDF', descripcion: 'Sube un examen en formato PDF', tipo: 'pdf' },
  { id: 'cargar-imagen', nombre: 'Cargar Imagen', descripcion: 'Sube una imagen de examen', tipo: 'imagen' },
  { id: 'crear-test', nombre: 'Crear Test', descripcion: 'Genera preguntas de opción múltiple', tipo: 'texto' },
];

export class CategoriaEvaluaciones {
  static obtenerModos(): EvaluacionModo[] {
    return EVALUACIONES_DISPONIBLES;
  }

  static async inicializar(): Promise<void> {
    console.log('Modo evaluaciones: próximamente disponible');
  }
}

export default CategoriaEvaluaciones;
