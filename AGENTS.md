# AGENTS.md — Guía para Implementación del Proyecto

## Descripción

Entrenador de Lectura Veloz: aplicación web (HTML/CSS/JS vanilla) para practicar lectura rápida con 4 modos de entrenamiento, configuración avanzada y seguimiento de estadísticas.

## Estado actual (2026-09-19)

**✅ COMPLETADO:**
- 4 modos funcionales: Palabra por palabra, Palabras en grupo, Frases completas, Galáctico
- Arquitectura modular: 4 motores separados + coordinador (app.js)
- Modo Galáctico: scroll ascendente, texto dorado (#ffd700), fondo negro, WPM en tiempo real, grupos adaptativos (máx 25 chars, 5 palabras)
- Responsive móvil: modales, controles, Galáctico, visual customizer (≤640px)
- Tests: 27/27 unitarios + JSDOM runtime test
- Git: `main` (producción/GitHub Pages) / `dev` (desarrollo local)
- GitHub Pages: https://phylossopho.github.io/proyecto_LECTURA_VELOZ/

## Progreso y estadísticas

### Archivo progress.json

Ubicación: `proyecto_LECTURA_VELOZ/progress.json`

Estructura:
```json
{
    "sessions": 0,
    "totalWords": 0,
    "totalTime": 0,
    "bestWPM": 0,
    "history": []
}
```

## Estructura del proyecto

```
proyecto_LECTURA_VELOZ/
  index.html              ← Estructura DOM, referencia CSS/JS
  styles.css              ← Estilos (3 temas + responsive + animaciones)
  app.js                  ← Coordinador principal (estado compartido, flujo global)
  mode-word.js            ← Motor modo palabra por palabra (RSVP)
  mode-chunk.js           ← Motor modo palabras en grupo (chunking)
  mode-line.js            ← Motor modo frases completas
  mode-galactico.js        ← Motor modo Galáctico (scroll ascendente)
  test_app.js             ← Tests unitarios (Node.js)
  test_runtime.js         ← JSDOM smoke test
  test_galactico_debug.js  ← Debug Galáctico en JSDOM
  progress.json           ← Estadísticas de entrenamiento (plantilla)
  historia_prehistoria.json ← Textos de historia para práctica
  notas-lectura-veloz.md
  README.md
  AGENTS.md
  prompt.txt              ← Prompt para próximas sesiones
```

## Arquitectura de motores

Cada modo de práctica tiene su propio archivo JS ("motor"). `app.js` es el coordinador que mantiene el estado compartido (variables globales, DOM, eventos) y delega las operaciones específicas de cada modo a su motor correspondiente.

Los motores se cargan en `index.html` antes que `app.js` (funciones globales disponibles por hoisting):

| Motor | Archivo | Funciones |
|---|---|---|
| Palabra por palabra | `mode-word.js` | `renderWordDisplay`, `scheduleWordNext` |
| Palabras en grupo | `mode-chunk.js` | `renderChunkDisplay`, `scheduleChunkNext` |
| Frases completas | `mode-line.js` | `renderLineDisplay`, `updateLineTimer`, `scheduleLineNext` |
| Galáctico | `mode-galactico.js` | `splitStarWarsGroups`, `renderStarWarsDisplay`, `startStarWarsAnimation`, `animateStarWars`, `pauseStarWars`, `resumeStarWars`, `clearStarWarsPresentation`, `getStarWarsDuration`, `showCountdownNumber`, `hideCountdownNumber`, `escapeHtml` |

`app.js` coordina mediante delegación: `renderDisplay()` llama al render del motor activo, `togglePause()` llama al pause/resume del motor, y el handler de teclado delega el avance a cada motor.

## Flujo de desarrollo

Los algoritmos de procesamiento de texto (agrupación, chunking, splitting) se desarrollan y prueban primero en **Python** (`C:\Users\Jorge\AppData\Local\Temp\kilo\galactico_algo.py`). Cuando la lógica produce grupos correctos en Python con múltiples textos de prueba, se porta fielmente a JS en el archivo del modo correspondiente. Esto evita iterar a ciegas en el navegador.

## Flujo de ejecución

```
1. Abrir index.html en navegador
2. Carga preferencias desde localStorage (tema, WPM, chunk size, modo, font size)
3. Modal "Selecciona método" → usuario elige modo (word/chunk/line/galactico)
4. Modal "Configurar Texto" → usuario pega texto, carga archivo .txt/.md, o elige ejemplo
5. Sesión activa con controles de velocidad y avance
6. Al terminar → pantalla "Fin!" + registro de estadísticas en localStorage
```

## Modelo de estado clave

```javascript
mode              // 'word' | 'chunk' | 'line' | 'galactico'
wpm               // velocidad (50-600)
chunkSize         // palabras por grupo (3, 5, 7) — solo modo chunk
currentTheme      // 'dark' | 'neon' | 'light'
fontSize          // 'small' | 'medium' | 'large'
words[]           // array de palabras (modo word)
chunks[]          // array de {words: [], endsWith: type} (modo chunk)
sentences[]       // array de oraciones completas (modo line)
currentChunk      // índice actual en chunks[]
currentIndex      // índice actual en words[]
currentSentence   // índice actual en sentences[]
isRunning / isPaused
pausedDuration    // tiempo acumulado en pausas
chunkPauseMs      // micro-pausa variable según puntuación
trainingStats     // { sessions, totalWords, totalTime, bestWPM }
galacticoGroups[]  // grupos de texto para modo Galáctico
galacticoOffset    // posición actual scroll
galacticoPhase     // fase animación: countdown/pre-scroll/scroll/fadeout
```

## Preferencias en localStorage

| Clave | Valor |
|---|---|
| `reading-theme` | 'dark' \| 'neon' \| 'light' |
| `reading-wpm` | número (50-600) |
| `reading-chunkSize` | 3 \| 5 \| 7 |
| `reading-mode` | 'word' \| 'chunk' \| 'line' \| 'galactico' |
| `reading-fontSize` | 'small' \| 'medium' \| 'large' |
| `reading-stats` | JSON { sessions, totalWords, totalTime, bestWPM } |

## Funciones principales

### Coordinador (`app.js`)

| Función | Propósito |
|---|---|
| `startReading()` | Inicia sesión según modo, delega al motor |
| `togglePause()` | Pausa/reanuda, delega pause/resume al motor |
| `resetReading()` | Reinicia todo, limpia estado del motor activo |
| `finishReading()` | Termina sesión, limpia motor y registra stats |
| `renderDisplay()` | Delega render al motor del modo activo |
| `updateTimer()` | Actualiza timer, delega timer visual al motor |
| `loadText(text)` | Procesa texto → words, sentences, chunks |
| `splitIntoChunks(text, targetSize)` | Divide texto en chunks respetando puntuación |
| `getPauseForEndType(type)` | Retorna micro-pausa (200-600ms) según signo |
| `updateWPM()` | Actualiza WPM y notifica al motor si aplica |
| `adjustWPM(delta)` | Ajusta WPM +/- 20 |
| `setChunk(size)` | Cambia chunk size |
| `loadPreferences()` / `savePreferences()` | Persistencia de configuración |
| `setTheme(theme)` / `setFontSize(size)` / `setColor(type)` | Configuración visual |
| `backToModeSelection()` | Vuelve al selector de modo |
| `loadFileText(event)` | Carga archivo .txt/.md |
| `loadSample(idx)` / `loadHistory(key)` | Carga textos de ejemplo |

### Motores de modo

| Motor | Archivo | Funciones clave |
|---|---|---|
| Palabra por palabra | `mode-word.js` | `renderWordDisplay`, `scheduleWordNext` |
| Palabras en grupo | `mode-chunk.js` | `renderChunkDisplay`, `scheduleChunkNext` |
| Frases completas | `mode-line.js` | `renderLineDisplay`, `updateLineTimer`, `scheduleLineNext` |
| Galáctico | `mode-galactico.js` | `splitStarWarsGroups`, `renderStarWarsDisplay`, `startStarWarsAnimation`, `animateStarWars`, `pauseStarWars`, `resumeStarWars`, `clearStarWarsPresentation`, `getStarWarsDuration` |

## Funciones testeables (test_app.js)

| Función | Test |
|---|---|
| `cleanWord(word)` | Elimina puntuación |
| `getEndType(word)` | Clasifica tipo de fin (sentence/clause/list/normal) |
| `getPauseForEndType(type)` | Retorna ms según tipo |
| `splitSentences(text)` | Divide por puntuación final |
| `splitIntoChunks(text, target)` | Respetando puntuación, N palabras máx |
| `formatTime(seconds)` | Formato MM:SS |
| `loadPref(key, default)` | Retorna default si no existe |
| `savePref(key, value)` | Almacena en localStorage |

Ejecutar: `node test_app.js` → debe mostrar `27/27 tests passed`

Los tests de `test_app.js` cubren solo funciones compartidas (utilidades, chunking, formato). Las funciones específicas de modo (ej. `splitStarWarsGroups`) se prueban en **Python** antes de portar a JS.

## Modo Galáctico — Detalles técnicos

- **Algoritmo agrupación**: máx 25 chars, máx 5 palabras, mín 10 chars por grupo
- **Fusión grupos cortos**: tolerancia +10 chars
- **Animación**: 4 fases - countdown(3s) → pre-scroll(2.5s, ease-out cúbico) → scroll(WPM) → fadeout(1s)
- **Scroll**: desde abajo (offset negativo grande) → centro → arriba
- **Velocidad**: proporcional a WPM, slider funciona en tiempo real
- **Teclado**: Space/Enter/flechas no cambian modo en Galáctico

## Responsive móvil (≤640px)

- Modales: 95vw, scroll, padding ajustado
- Controles: sliders 100%, botones chunk flexibles
- Galáctico: fuente 1.8rem, line-height 2, letter-spacing 1px
- Visual customizer: toolbar wrap, panel 50vh
- Stats: wrap, fuente menor
- Sample texts: 1 columna

## Tests

```bash
node test_app.js        # 27/27 unit tests
node test_runtime.js    # JSDOM smoke test
node test_galactico_debug.js  # Debug Galáctico en JSDOM
```

## Flujo de trabajo Git

| Rama | Propósito | Despliegue |
|---|---|---|
| `main` | Producción (estable) | GitHub Pages automático |
| `dev` | Desarrollo/pruebas locales | Solo local |

**Pasar a producción:**
1. `git checkout dev` → verifica en local
2. `git checkout main`
3. `git merge dev`
4. GitHub Desktop → `Push origin`

## Problemas conocidos

- **Tema claro**: fondo `#d8d8d8`, texto `#2a2a2a`. `setColor('bg')` guarda color por tema.
- **Brave**: puede requerir desactivar escudos para localStorage en file:// (funciona en GitHub Pages)

## Próximos pasos

- [ ] Ajustar font-size Galáctico si grupos de 25 chars siguen amplios en algunas pantallas
- [ ] Verificar visual customizer en móvil
- [ ] Probar carga de archivos .txt/.md en tablet/celular