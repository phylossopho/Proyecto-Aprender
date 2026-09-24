/* ===== CATEGORIAS.TS - Registro central de categorias modulares ===== */

import type { Mode } from './types.js';
import { ICONO_CATEGORIA_LECTURA, ICONO_CATEGORIA_EVALUACIONES, ICONO_CATEGORIA_TEXTOS, ICONO_CATEGORIA_JUEGOS, ICONO_CATEGORIA_IDEAS } from '../utils/iconos.js';

export type CategoriaId = 'lectura-rapida' | 'evaluaciones' | 'textos' | 'mini-juegos' | 'ideas';

export interface CategoriaModulo {
  id: CategoriaId;
  nombre: string;
  icono: string;
  descripcion: string;
  cantidad: number;
  cargar: () => Promise<unknown>;
}

export const CATEGORIAS: CategoriaModulo[] = [
  {
    id: 'lectura-rapida',
    nombre: 'Lectura Rápida',
    icono: ICONO_CATEGORIA_LECTURA,
    descripcion: '4 modos de entrenamiento de lectura veloz',
    cantidad: 4,
    cargar: () => import('../categorias/lectura-rapida/index.js'),
  },
  {
    id: 'evaluaciones',
    nombre: 'Evaluaciones',
    icono: ICONO_CATEGORIA_EVALUACIONES,
    descripcion: 'Tests y exámenes interactivos',
    cantidad: 0,
    cargar: () => import('../categorias/evaluaciones/index.js'),
  },
  {
    id: 'textos',
    nombre: 'Textos',
    icono: ICONO_CATEGORIA_TEXTOS,
    descripcion: 'Biblioteca y gestión de textos',
    cantidad: 6,
    cargar: () => import('../categorias/textos/index.js'),
  },
  {
    id: 'mini-juegos',
    nombre: 'Mini Juegos',
    icono: ICONO_CATEGORIA_JUEGOS,
    descripcion: 'Juegos de agilidad y diversión',
    cantidad: 3,
    cargar: () => import('../categorias/mini-juegos/index.js'),
  },
  {
    id: 'ideas',
    nombre: 'Mi Caja de Ideas',
    icono: ICONO_CATEGORIA_IDEAS,
    descripcion: 'Guarda y conecta lo que vas aprendiendo, como un Zettelkasten',
    cantidad: 1,
    cargar: () => import('../categorias/ideas/index.js'),
  },
];

export interface ModoLectura {
  id: Mode;
  nombre: string;
  descripcion: string;
  icono: string;
}

export const MODOS_LECTURA: ModoLectura[] = [
  { id: 'word', nombre: 'Palabra por palabra', descripcion: 'Las palabras aparecen una a una con puntero visual. Máxima velocidad de procesamiento.', icono: '' },
  { id: 'chunk', nombre: 'Palabras en grupo', descripcion: 'Lee grupos de 3-7 palabras separados por comas y puntos. Respetan la puntuación.', icono: '' },
  { id: 'line', nombre: 'Frases completas', descripcion: 'Lees la frase completa visible en pantalla. Avance automático según velocidad.', icono: '' },
  { id: 'galactico', nombre: 'Galáctico', descripcion: 'El texto sube desde abajo estilo cómic espacial. Modo juego.', icono: '' },
];

export function obtenerCategoria(id: CategoriaId): CategoriaModulo | undefined {
  return CATEGORIAS.find(c => c.id === id);
}

export function obtenerModo(id: string): ModoLectura | undefined {
  return MODOS_LECTURA.find(m => m.id === id);
}
