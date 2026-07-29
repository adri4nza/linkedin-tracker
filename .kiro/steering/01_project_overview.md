---
inclusion: always
---

# 01 · Project Overview

## Propósito

**linkedin-tracker** es una PWA (Progressive Web App) que registra y visualiza
una competencia head-to-head entre **dos jugadores fijos: Francisco y Enrique**,
sobre los minijuegos diarios de LinkedIn. La app no es un tracker genérico
multiusuario: toda la lógica está diseñada alrededor de exactamente dos
contendientes cuyos nombres se comparan siempre en minúsculas
(`'francisco'` / `'enrique'`).

Los cinco minijuegos soportados (en orden de display) son:

- **Zip**
- **Tango**
- **Queens**
- **Mini Sudoku**
- **Patches**

La meta de la app es responder tres preguntas: quién ganó cada partida, quién
ganó cada día, y cómo evolucionan las métricas (récords, promedios, rachas) por
minijuego a lo largo del tiempo.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework UI | **React 19** con TypeScript |
| Bundler / dev server | **Vite 8** |
| Ruteo | **react-router-dom 7** (`BrowserRouter`, rutas en `src/App.tsx`) |
| Estilos | **Tailwind CSS 4** (vía `@tailwindcss/vite`) |
| Gráficas | **Recharts 3** (DonutChart, TrendChart) |
| Iconos | **lucide-react** |
| Parseo CSV | **papaparse 5** |
| PWA | **vite-plugin-pwa** |
| Lint | **ESLint 9** + `typescript-eslint` + `eslint-plugin-react-hooks` |

Scripts (`package.json`): `dev` (vite), `build` (`tsc -b && vite build`),
`lint` (`eslint .`), `preview`. **No existe script de test** (ver
`04_coding_standards.md`).

## Pipeline de datos (sin backend)

La app **no tiene servidor ni base de datos**. Los datos viven en una hoja de
**Google Sheets publicada como CSV** y se parsean íntegramente en el frontend:

1. **Origen del URL** — `getActiveCsvUrl()` en `src/hooks/useGamesData.ts`
   resuelve el URL en este orden de precedencia:
   1. Override en `localStorage` bajo la clave `CUSTOM_CSV_URL`.
   2. Variable de entorno `VITE_CSV_URL`.
   Además añade un parámetro cache-buster `t=<timestamp>` para evitar respuestas
   cacheadas por el navegador.

2. **Descarga y parseo** — `useGamesData(csvUrl)` usa `Papa.parse` con
   `download: true`, `header: true`, `skipEmptyLines: true`. Cada fila se mapea
   al tipo `GameRecord`.

3. **Enriquecimiento on-the-fly** — para las filas cuyo `Juego` es `zip`, se
   deriva el campo `Retrocesos` (número de retrocesos / backtracks) a partir del
   texto crudo de la columna `Mensaje Original`, usando `extractRetrocesos()`.
   **Este campo NO existe en el Google Sheet**; se calcula en cliente para
   evitar migrar la hoja (ver `02_business_logic.md`).

4. **Normalización de fechas por edición** — `normalizeEditionDates(enriched)`
   (`src/utils/normalizeEditionDates.ts`) unifica la `Fecha` de todos los
   registros que pertenecen a la misma edición de un juego, asignando a todos
   la **fecha mínima válida** del grupo. Esto corrige el caso en que un jugador
   completa el minijuego después de medianoche y su registro queda en el día
   siguiente (distinta fecha que la del otro jugador), lo que de otro modo
   causaría que el enfrentamiento no se computara correctamente en ningún utils
   de aggregación downstream.

5. **Estado expuesto** — el hook devuelve `{ data, isLoading, error }`, que cada
   página consume directamente. **`data` ya viene enriquecido y normalizado**;
   ningún componente ni utils debe re-normalizar fechas.

### Pipeline completo de ingesta

```
CSV raw (PapaParse)
  ↓ Step 1 — enrich:    Retrocesos derivado de Mensaje Original (solo Zip)
  ↓ Step 2 — normalize: Fecha unificada por Juego+Edición (fecha mínima del grupo)
  ↓ setData(normalized)
```

### Estructura de `GameRecord`

Columnas del CSV (nombres exactos, incluidas tildes y espacios):
`Fecha`, `Jugador`, `Juego`, `Edición (n.º)`, `Tiempo`, `Top Ranking (%)`,
`Sin Fallos`, `Pistas/Notas`, `Mensaje Original`.
Campos derivados en cliente: `Retrocesos?: number | null`.

- `Fecha`: ISO `YYYY-MM-DD`. **Después de la normalización, todos los registros
  de la misma `Juego+Edición` comparten la misma fecha (la más antigua del
  grupo).** No asumas que la `Fecha` del CSV original es la fecha correcta del
  enfrentamiento.
- `Tiempo`: string `M:SS` o `MM:SS`. Vacío / inválido ⇒ se trata como `Infinity`
  (ausencia / abandono).

## Configuración de usuario (localStorage)

- `CUSTOM_CSV_URL` — override del URL de datos (Settings → Data Source).
- `PLAYER_COLOURS` — colores de cada jugador (`usePlayerColors`). El color de
  empate `#94a3b8` (`TIE_COLOUR`) es fijo y no configurable.
- `theme` — `dark` / `light` (`useDarkMode`).

Cambios en URL o colores aplican **tras recargar la página**
(`window.location.reload()`).
