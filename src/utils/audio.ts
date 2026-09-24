/* ===== AUDIO.TS - Sistema de sonidos con auto-deteccion ===== */

import { STORAGE_KEYS } from '../core/types.js';

type SonidoNombre = 'play' | 'pausa' | 'reiniciar' | 'click' | 'acierto' | 'fin';

const SONIDOS_DISPONIBLES: Partial<Record<SonidoNombre, string>> = {
  acierto: 'acierto.mp3',
  fin: 'fin.mp3',
};

const SONIDOS_GENERALES: Partial<Record<SonidoNombre, string>> = {
  play: 'play.mp3',
  pausa: 'pausa.mp3',
  reiniciar: 'reiniciar.mp3',
  click: 'click.mp3',
};

export class SistemaAudio {
  private static instance: SistemaAudio;
  private audioContext: AudioContext | null = null;
  private buffersCache: Map<string, AudioBuffer> = new Map();
  private activo: boolean = true;
  private volumen: number = 0.7;

  private constructor() {
    this.cargarPreferencia();
  }

  static getInstance(): SistemaAudio {
    if (!SistemaAudio.instance) {
      SistemaAudio.instance = new SistemaAudio();
    }
    return SistemaAudio.instance;
  }

  private cargarPreferencia(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SONIDO);
      if (saved !== null) {
        this.activo = saved === 'true';
      }
    } catch {
      this.activo = true;
    }
  }

  private guardarPreferencia(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SONIDO, String(this.activo));
    } catch { /* ignore */ }
  }

  estaActivo(): boolean {
    return this.activo;
  }

  setActivo(activo: boolean): void {
    this.activo = activo;
    this.guardarPreferencia();
  }

  setVolumen(volumen: number): void {
    this.volumen = Math.max(0, Math.min(1, volumen));
  }

  // Auto-deteccion de archivos de sonido disponibles
  async detectarSonidos(): Promise<Set<string>> {
    // Intenta cargar los archivos de sonido
    const archivosPosibles = [
      'correcto.mp3', 'acierto.mp3', 'fin.mp3',
      'play.mp3', 'pausa.mp3', 'reiniciar.mp3', 'click.mp3',
      'sounds/correcto.mp3', 'sounds/acierto.mp3',
    ];

    const disponibles = new Set<string>();
    const cache = this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const archivo of archivosPosibles) {
      try {
        const response = await fetch(archivo);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await cache.decodeAudioData(arrayBuffer);
          const nombre = archivo.replace(/\.\w+$/, '').replace('sounds/', '');
          this.buffersCache.set(nombre, buffer);
          disponibles.add(nombre);
        }
      } catch {
        // Archivo no disponible, continuar
      }
    }

    return disponibles;
  }

  async reproducir(nombre: SonidoNombre): Promise<void> {
    if (!this.activo) return;

    // Si ya tenemos el buffer en cache, reproducirlo
    if (this.buffersCache.size > 0) {
      const buffer = this.buffersCache.get(nombre) || this.buffersCache.get('correcto');
      if (buffer) {
        this.reproducirBuffer(buffer);
        return;
      }
    }

    // Si no, intentar cargar el archivo
    const archivo = SONIDOS_DISPONIBLES[nombre] || SONIDOS_GENERALES[nombre];
    if (!archivo) return;

    try {
      const response = await fetch(archivo);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const cache = this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await cache.decodeAudioData(arrayBuffer);
      this.buffersCache.set(nombre, buffer);
      this.reproducirBuffer(buffer);
    } catch {
      // Silencioso: error en consola
      console.debug(`No se encontro el sonido: ${archivo}`);
    }
  }

  private reproducirBuffer(buffer: AudioBuffer): void {
    if (!this.activo) return;

    const context = this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    this.audioContext = context;

    if (context.state === 'suspended') {
      context.resume();
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = this.volumen;
    gain.connect(context.destination);
    source.connect(gain);
    source.start(0);
  }

  // Reproduce un sonido desde el elemento de audio HTML
  reproducirDesdeElemento(nombre: SonidoNombre): void {
    if (!this.activo) return;

    const element = document.getElementById('sonidoAcierto') as HTMLAudioElement;
    if (element) {
      const src = SONIDOS_DISPONIBLES[nombre] || SONIDOS_GENERALES[nombre];
      if (src && element.src !== src) {
        element.src = src;
      }
      element.volume = this.volumen;
      element.play().catch(() => {});
    }
  }
}
