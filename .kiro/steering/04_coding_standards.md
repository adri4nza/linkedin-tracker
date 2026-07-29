---
inclusion: always
---

# 04 · Coding Standards

Reglas de desarrollo obligatorias para este proyecto. Derivadas del código real
actual; respétalas para no romper la arquitectura existente.

## A. Toda la lógica de agregación matemática vive en `src/utils/` (funciones puras)

- Cualquier cálculo de ganadores, conteos, promedios, récords, pivotes o mapas
  de color **debe implementarse como función pura** en `src/utils/`:
  `timeUtils.ts`, `dayWins.ts`, `gameHeatmap.ts`, `analyticsStats.ts`,
  `pivot.ts`, `normalizeEditionDates.ts`.
- **Puras = sin efectos secundarios, deterministas**: mismas entradas → mismas
  salidas. No leen `localStorage`, no tocan el DOM, no llaman a `Date.now()`
  internamente para la lógica de negocio (el rango temporal se calcula en la
  página y se pasa como argumento).
- Las **páginas y componentes NO reimplementan agregación**. Orquestan: filtran
  el `data`, invocan las funciones de `utils` y reforman el resultado para
  presentación. `DashboardPage` y `AnalyticsPage` son el patrón a seguir (un
  `useMemo` delgado que llama a `computeDailyOutcomes` / `computeGameStats`).
- **El pre-procesamiento de datos pertenece a `useGamesData`**, no a las páginas
  ni a los utils de agregación. La función `normalizeEditionDates` es el patrón
  a seguir: transforma el array de entrada antes de exponerlo, de modo que todos
  los consumidores downstream reciben datos ya correctos sin saberlo. Si en el
  futuro se necesita otro paso de normalización (ej. deduplicación, corrección de
  nombres), debe añadirse en ese mismo pipeline (`useGamesData`) como un paso
  numerado adicional.
- **`calculateWinner` es la única autoridad** para decidir un ganador
  head-to-head. No dupliques su lógica (comparación de tiempos, forfeit,
  desempate de Zip) en ningún otro lugar; llámala.
- Respeta la **convención de orden de argumentos** documentada en
  `02_business_logic.md` (Francisco-first por defecto; Enrique-first solo en
  `analyticsStats.ts`).
- Los componentes de presentación (`MonthlyTally`, `MetricCard`, celdas de
  `ResultsPage`) reciben datos ya calculados por props y **no agregan nada**.

## B. Cero testing automatizado — la validación es manual

- **No hay framework de tests** (ni Jest, ni Vitest, ni Testing Library) y
  **no debe añadirse uno** salvo petición explícita del usuario. `package.json`
  no tiene script `test`.
- La verificación de cambios se hace **manualmente**:
  - `npm run lint` (ESLint) para calidad estática.
  - `npm run build` (`tsc -b && vite build`) para validar tipos y compilación.
  - `npm run dev` + revisión visual en el navegador para el comportamiento.
- Por esto, **la corrección de las funciones de `utils` es crítica**: al ser la
  única red de seguridad la revisión manual, manténlas pequeñas, puras y bien
  documentadas con JSDoc (como ya lo están). Preserva las invariantes
  documentadas (p. ej. `null` ≠ `0` en retrocesos, exclusión de días
  asimétricos, orden de argumentos).

## C. Minimizar `useEffect` para transformar datos — priorizar `useMemo`

- **Toda transformación derivada de datos debe hacerse con `useMemo`**, no con
  `useEffect` + `useState`. El patrón establecido: `data` → `useMemo` → valor
  derivado (ver `stats`, `outcomes`, `pivoted`, `filtered`, `sorted`,
  `pageRows`, `heatmapColorMap`, `gameTally`).
- **No** guardes resultados calculados en estado y los recalcules dentro de un
  `useEffect`; deriva sobre la marcha con `useMemo` a partir del `data` crudo.
- `useEffect` se reserva **solo para efectos secundarios reales**, tal como se
  usa hoy:
  - Fetch/parseo del CSV (`useGamesData`).
  - Persistencia y clase del tema (`useDarkMode`).
  - Sincronizar el mes visible con el padre (`MiniCalendar` `onMonthChange`).
  - Auto-scroll imperativo del carrusel (`DashboardPage`).
- Declara correctamente los **arrays de dependencias** de `useMemo`/`useEffect`;
  `eslint-plugin-react-hooks` está activo. Solo suprime la regla
  `exhaustive-deps` con justificación explícita (como en `MiniCalendar`).

## Convenciones generales

- **TypeScript estricto**: tipa las estructuras de datos (interfaces exportadas
  como `GameRecord`, `DailyOutcome`, `PivotRow`, `GameStats`). Usa
  `import type` para tipos.
- **Comparaciones de identidad**: normaliza siempre nombres de jugador y juego
  con `.trim().toLowerCase()` antes de comparar (los datos vienen de un CSV
  editado a mano).
- **Estilos con Tailwind**; soporte dark mode con la variante `dark:`. No CSS
  ad-hoc salvo utilidades globales ya existentes (`hide-scrollbar`).
- **Colores de jugador siempre por props** desde `usePlayerColors`; nunca
  hardcodear `#3b82f6` / `#ef4444` en componentes. `TIE_COLOUR` es la constante
  para empates.
- **Organización**: un componente por carpeta bajo `src/components/<Nombre>/`;
  hooks en `src/hooks/`; páginas en `src/pages/`; lógica pura en `src/utils/`.
