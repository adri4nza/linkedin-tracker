---
inclusion: always
---

# 03 · UI Architecture

## Ruteo y shell

`src/App.tsx` monta `BrowserRouter` con un `Layout` compartido
(`src/components/Layout/`) que envuelve cuatro rutas:

| Ruta | Página | Rol |
|------|--------|-----|
| `/` | `DashboardPage` | Resumen de **días ganados** (visión global) |
| `/analytics` | `AnalyticsPage` | Métricas **por minijuego** con tabs |
| `/results` | `ResultsPage` | Historial completo en tabla pivotada |
| `/settings` | `SettingsPage` | Fuente de datos, caché, tema y colores |

`Layout` incluye `Sidebar` para la navegación. `useDarkMode()` se invoca en
`App` para aplicar la clase `dark` en `<html>` desde el arranque.

Las tres páginas de datos comparten el mismo esqueleto: consumen
`useGamesData(CSV_URL)` y `usePlayerColors()`, y renderizan estados de
**loading** (spinner `Loader2`) y **error** (`AlertCircle`) antes del contenido.

## DashboardPage (`/`) — días ganados

Fuente única de verdad: `computeDailyOutcomes(activeData, colors)` (de
`dayWins.ts`). `activeData` es `data` filtrado sin Mini Sudoku cuando el toggle
`excludeMiniSudoku` está activo (ver `02_business_logic.md §8`); de lo contrario
es igual a `data`. La página **solo reforma** el resultado para presentación.
De un solo `useMemo` sobre `outcomes` deriva:

- **`dateColorMap`** — color por fecha para el calendario (incluye días
  `'excluded'`, pintados como empate).
- **`winRateData`** — datos del `DonutChart` (días ganados Francisco / Enrique /
  Empates), con `breakdown` por marcador para el desglose.
- **`dailyCards`** — tarjetas del carrusel de resultados diarios, ordenadas
  cronológicamente; un `useEffect` auto-scrollea al card más reciente (derecha).
  Cada tarjeta es **clickeable** (abre el `DailyResultsDrawer`) y muestra los
  logos y dots de ganador por minijuego del día via `GameDotRow`.

Gestiona **dos drawers en cascada** con dos estados independientes:
- `scoreSelection` — abre `ScoreBreakdownDrawer` al clicar una pill de marcador
  en el `DonutChart`.
- `selectedDate` — abre `DailyResultsDrawer`. Cuando viene del
  `ScoreBreakdownDrawer`, el primer drawer permanece montado detrás y el drawer
  diario muestra un botón `← Volver`.

Toggle "Sin Mini Sudoku": chip ámbar en la parte superior de la página. Activa
el modo hipotético (ver `02_business_logic.md §8`).

Componentes: toggle · carrusel de tarjetas · `MonthlyTally` + `MiniCalendar` ·
`DonutChart` · `ScoreBreakdownDrawer` · `DailyResultsDrawer`.

## AnalyticsPage (`/analytics`) — métricas por minijuego con Tabs

Dos barras de **Tabs** (componente genérico `GameTabs<T>`):

1. **Tabs de juego** — `['Zip','Tango','Queens','Mini Sudoku','Patches']`.
2. **Tabs de rango temporal** — `['Last 7 Days','Last 30 Days','Last 90 Days',
   'All Time','Custom']`. En `'Custom'` aparecen dos `input[type=date]`.

`GameTabs` es un segmented control **accesible y reutilizable** (`role=tablist`,
roving `tabIndex`, activación automática con flechas, `Home`/`End`,
`Enter`/`Space`). No contiene lógica de datos.

Flujo de datos (todo memoizado):

- **`stats`** — filtra `data` por juego activo **y** por rango temporal, luego
  delega en `computeGameStats`. El filtrado de rango vive **en la página**.
- **`heatmapColorMap`** y **`gameTally`** — derivan del `data` **completo**
  (independientes del rango temporal), vía `buildGameColorMap` y
  `computeGameMonthlyTally`. Esto permite que la navegación mensual del
  calendario recorra todo el historial sin importar el selector de rango.

Render: `MonthlyTally` + `MiniCalendar` (coloreado por ganador head-to-head del
juego activo), tarjetas de métricas (`MetricCard`: WR por jugador, Avg por
jugador, Total Wins con sub-items), `TrendChart` y `DailyResultsDrawer`.

## ResultsPage (`/results`) — tabla pivotada head-to-head

Pipeline de 4 etapas, cada una en su `useMemo`:

1. **Pivot** — `pivotRecords(data)` → una fila por `Fecha|Juego|Edición` con
   ambos jugadores enfrentados. Gracias a `normalizeEditionDates`, los dos
   registros de una edición siempre comparten la misma `Fecha` en este punto.
2. **Filter** — tres filtros combinables:
   - Por juego (`select`: All / Zip / Tango / Queens / Mini Sudoku / Patches).
   - Por búsqueda de texto (juego / fecha / edición).
   - **"Solo incompletos"** (`incompleteOnly: boolean`): muestra únicamente las
     filas donde `francisco === undefined || enrique === undefined`, es decir,
     ediciones con el resultado de solo un jugador. Útil para auditar casos
     especiales. Las filas incompletas tienen un fondo ámbar sutil
     (`bg-amber-500/5`) incluso cuando el filtro está desactivado.
3. **Sort** — `sortPivotRows` por columna `Fecha` / `JuegoEdicion` / `Tiempo`;
   encabezados clicables alternan dirección. Filas sin tiempo van al final.
4. **Paginate** — páginas de `PAGE_SIZE = 15`.

Cada fila muestra las dos celdas de jugador (`PlayerCell`, con
`RetroIndicator` de Zip: ✨ si `Retrocesos === 0`, el número si `> 0`, `—` si
`null`) y la columna `Winner` (`WinnerCell`, coloreada con los colores de
jugador / `TIE_COLOUR`). Click en fila abre el `DailyResultsDrawer` de esa
fecha.

## Componentes transversales

### `MonthlyTally` (independiente)

`src/components/MonthlyTally/`. Componente de **presentación pura**: recibe un
objeto `MonthlyTally` (`{ francisco, enrique, ties }`) más `colors` y **no hace
ninguna agregación** — solo renderiza los tres conteos con su color, en orden
Francisco / Enrique / Empates. Se usa tanto en Dashboard como en Analytics,
alimentado por distintas funciones de `utils` según el contexto.

### `MiniCalendar` (mapa de calor)

`src/components/MiniCalendar/`. Rejilla mensual (semana Lun–Dom) que funciona
como **heatmap**: cada día con datos muestra un punto indicador cuyo color
proviene de `dateColorMap` (fecha ISO → hex). Props clave:
`dateColorMap`, `datesWithData`, `onDayClick(day, month, year)` y
`onMonthChange(month, year)`. Este último notifica al padre el mes visible (vía
`useEffect`) para sincronizar el `MonthlyTally`. Navegación con
`ChevronLeft`/`ChevronRight`, con días de relleno de meses adyacentes en gris.

### `DailyResultsDrawer`

Panel lateral (drawer) que se abre al seleccionar una fecha en cualquier página.
Agrupa los registros del día por juego, resuelve cada uno con
`calculateWinner(francisco, enrique, name)` (Francisco-first) y muestra un
`GameCard` por minijuego con logo oficial, indicador de retrocesos de Zip y
un banner con el ganador del día. Acepta el prop opcional `onBack?: () => void`:
cuando está presente muestra un botón `←` en el header (viene de
`ScoreBreakdownDrawer`); el ✕ siempre cierra todo. El backdrop click también
cierra todo.

### `DonutChart` y `TrendChart`

Basados en **Recharts**. `DonutChart` muestra la proporción de días ganados
(Dashboard). Al clicar un segmento se despliegan pills de marcador (ej. `5-0 ×3`);
al clicar una pill dispara `onScoreSelect(player, playerColor, score, sortedDates)`
con las fechas ya ordenadas de más reciente a más antigua. Esto abre el
`ScoreBreakdownDrawer` — ya no hay fechas inline en el `DonutChart`.
`TrendChart` grafica la evolución de tiempos por jugador (Analytics) usando
`chartData` de `computeGameStats`.

### `ScoreBreakdownDrawer`

`src/components/ScoreBreakdownDrawer/`. Panel de vidrio (`backdrop-blur-2xl`)
que recibe `player`, `playerColor`, `score` y `dates` (ordenadas). Por cada
fecha renderiza un `DateCard` que muestra la fecha y una fila de logos de
minijuego con dots de color indicando el ganador de cada uno (via `GameDotRow`).
Al clicar una tarjeta abre el `DailyResultsDrawer` **sin cerrar** el
`ScoreBreakdownDrawer`, que queda montado detrás.

### `GameDotRow`

`src/components/GameDotRow/`. Componente de presentación pura compartido por
`ScoreBreakdownDrawer` y el carrusel del `DashboardPage`. Recibe `dateRecords`
(ya filtrados a una fecha) y renderiza los 5 logos de minijuego en orden
canónico (`GAME_ORDER = ['Zip','Tango','Queens','Mini Sudoku','Patches']`) con
un dot de color debajo de cada uno indicando el ganador (Francisco-first
convention). **Solo muestra los juegos que tienen al menos un registro para esa
fecha** — los que no existían ese día no aparecen. Soporta tamaño `'sm'` (w-6
h-6, carrusel) y `'md'` (w-7 h-7, ScoreBreakdownDrawer).

## Colores

`usePlayerColors()` provee `{ francisco, enrique }` (defaults `#3b82f6` /
`#ef4444`, override en `localStorage`). `TIE_COLOUR = #94a3b8` es fijo. Los
colores se pasan por props a los componentes de visualización; nunca se
hardcodean colores de jugador en los componentes.
