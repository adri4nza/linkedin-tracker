# Reglas de negocio (Business Logic)

Este documento detalla las reglas matemáticas que rigen la evaluación de partidas y métricas de **LinkedIn Tracker**, citando las funciones exactas del código que las implementan.

Archivos clave:
- `src/utils/timeUtils.ts` — conversión de tiempos y resolución head-to-head.
- `src/pages/DashboardPage.tsx` — Win Rate por "Días Ganados".
- `src/pages/AnalyticsPage.tsx` — récord y promedios.
- `src/components/DailyResultsDrawer/DailyResultsDrawer.tsx` — detalle por día.

---

## 1. Conversión de tiempos

Los tiempos llegan como texto `"M:SS"` o `"MM:SS"` y se normalizan a segundos para poder compararlos.

```ts
// src/utils/timeUtils.ts
export function timeToSeconds(time?: string | null): number {
  if (!time || time.trim() === '') return Infinity;
  const [m, s] = time.trim().split(':').map(Number);
  if (isNaN(m) || isNaN(s)) return Infinity;
  return m * 60 + s;
}
```

Regla clave: un tiempo **ausente, vacío o inválido se convierte en `Infinity`**. Esto es lo que habilita la "victoria por abandono" (un `Infinity` siempre pierde contra un tiempo finito).

La función inversa `secondsToTime(secs)` formatea de vuelta a `M:SS` y devuelve `"—"` para valores no finitos o negativos (se usa para mostrar récords y promedios).

---

## 2. Flag "Sin Fallos" (Flawless)

```ts
// src/utils/timeUtils.ts
export function isFlawless(val: string | undefined): boolean {
  return ['true', 'yes', '1'].includes(val?.trim().toLowerCase() ?? '');
}
```

Se considera flawless si la celda `Sin Fallos` es `TRUE`, `true`, `yes` o `1` (case-insensitive). En la UI se representa con el emoji **✨**. Este flag es el criterio de desempate (sección 3.3).

---

## 3. Evaluación head-to-head de un minijuego

La función central es `calculateWinner`, que compara los registros de ambos jugadores para un mismo minijuego en una misma fecha:

```ts
// src/utils/timeUtils.ts
export type MatchResult = 'a' | 'b' | 'tie' | null;

export function calculateWinner(
  recA: HeadToHeadRecord | undefined,
  recB: HeadToHeadRecord | undefined,
): MatchResult {
  const tA = timeToSeconds(recA?.Tiempo);
  const tB = timeToSeconds(recB?.Tiempo);

  if (!isFinite(tA) && !isFinite(tB)) return null;   // (3.4) sin disputa
  if (!isFinite(tA)) return 'b';                     // (3.2) abandono de A
  if (!isFinite(tB)) return 'a';                     // (3.2) abandono de B

  if (tA < tB) return 'a';                           // (3.1) menor tiempo gana
  if (tB < tA) return 'b';

  // Empate exacto → desempate por flawless (3.3)
  const fA = isFlawless(recA?.['Sin Fallos'] ?? undefined);
  const fB = isFlawless(recB?.['Sin Fallos'] ?? undefined);
  if (fA && !fB) return 'a';
  if (fB && !fA) return 'b';
  return 'tie';
}
```

El valor de retorno se interpreta según el orden de los argumentos en cada llamada. En las páginas se llama como `calculateWinner(enrique, francisco)`, por lo que `'a'` = victoria de Enrique y `'b'` = victoria de Francisco.

### 3.1 Criterio primario: menor tiempo gana
Ambos tiempos se convierten a segundos y **gana el menor**. Es la primera comparación tras descartar abandonos.

### 3.2 Victoria por abandono (forfeit)
Si un jugador tiene tiempo válido y el otro no jugó (tiempo → `Infinity`), gana automáticamente quien tiene tiempo finito. Implementado por los dos `if (!isFinite(...))` antes de comparar magnitudes.

### 3.3 Criterio de desempate: Flawless (✨)
Ante un **empate exacto en segundos**, gana quien completó el juego sin fallos. Si **ambos o ninguno** son flawless, es un **empate real** (`'tie'`) y no se otorga punto a ninguno.

### 3.4 Sin disputa
Si **ninguno** de los dos tiene tiempo válido, devuelve `null`: la partida no existe a efectos de cómputo y no se cuenta.

---

## 4. Win Rate por "Días Ganados"

El porcentaje de victoria global **no** se mide por minijuegos individuales sino por **días ganados**. Toda esta lógica vive en el `useMemo` de `src/pages/DashboardPage.tsx`.

### 4.1 Agrupación
Los registros se agrupan en una estructura anidada `Fecha → Juego → { enrique, francisco }`:

```ts
// DashboardPage.tsx
const dateMap = new Map<string, Map<string, { enrique?: GameRecord; francisco?: GameRecord }>>();
// … se llena recorriendo data, normalizando Jugador a minúsculas
```

### 4.2 Igualdad de condiciones (filtro obligatorio)
Para que un día compute en el histórico, **Francisco y Enrique deben haber completado exactamente la misma cantidad de minijuegos** ese día. Si no, el día se descarta del cálculo de días ganados (aunque se pinta en gris en el calendario):

```ts
// DashboardPage.tsx
let eGames = 0, fGames = 0;
for (const { enrique, francisco } of gameMap.values()) {
  if (enrique)   eGames++;
  if (francisco) fGames++;
}
if (eGames !== fGames) {
  dateColorMap.set(fecha, TIE_COLOUR); // pintado como neutro, NO cuenta
  continue;                            // se ignora por completo
}
```

### 4.3 Determinación del ganador del día
Para los días que pasan el filtro, se cuentan las victorias por minijuego con `calculateWinner` y **gana el día quien acumula más victorias**:

```ts
// DashboardPage.tsx
let eWins = 0, fWins = 0;
for (const { enrique, francisco } of gameMap.values()) {
  const result = calculateWinner(enrique, francisco);
  if (result === 'a') eWins++;        // 'a' = Enrique
  else if (result === 'b') fWins++;   // 'b' = Francisco
}

if (eWins > fWins)      enriqueDays++;
else if (fWins > eWins) franciscoDays++;
else                    tieDays++;     // empate de día
```

> Nota: los empates por minijuego (`'tie'`) y las partidas sin disputa (`null`) **no suman** para ninguno, pero el día puede igual contarse (a favor de alguien o como empate de día) según el balance de victorias.

### 4.4 Resultado y porcentaje
Los totales se empaquetan en `winRateData` (con su `breakdown` de marcadores) y el porcentaje mostrado en el centro de la dona es la proporción del segmento dominante sobre el total de días contabilizados:

```ts
// DonutChart.tsx (CentreLabel)
const pct = total > 0 ? Math.round((topValue / total) * 100) : 0;
```

donde `total = Francisco + Enrique + Empates` (solo días que pasaron el filtro de igualdad de condiciones).

### 4.5 Desglose de marcadores (drill-down)
Por cada día contabilizado se registra su marcador normalizado `mayor-menor`:

```ts
// DashboardPage.tsx
const score = `${Math.max(eWins, fWins)}-${Math.min(eWins, fWins)}`;
```

y se agrupa por segmento en `eBreakdown` / `fBreakdown` / `tieBreakdown` (`Record<marcador, fecha[]>`). Esto alimenta el drill-down del `DonutChart`: marcador → cantidad → fechas exactas → apertura del `DailyResultsDrawer`.

---

## 5. Métricas de Analytics

En `src/pages/AnalyticsPage.tsx`, filtrando por minijuego y rango de fechas:

- **Récord (World Record):** el registro con menor `timeToSeconds(row.Tiempo)` dentro del filtro.
  ```ts
  for (const row of filteredRecords) {
    if (timeToSeconds(row.Tiempo) < timeToSeconds(wrRecord.Tiempo)) wrRecord = row;
  }
  ```
- **Tiempos promedio:** media de los tiempos **finitos** (los `Infinity` se excluyen), global y por jugador, vía el helper `avgSecs`.
- **Total Wins:** victorias por jugada head-to-head agrupadas por fecha con `calculateWinner` (aquí la unidad es la fecha del minijuego seleccionado, no el "día ganado" global).
- **Tendencia:** `chartData` ordenado cronológicamente con los tiempos de cada jugador por fecha para el `TrendChart`.

---

## 6. Detalle por día (DailyResultsDrawer) — discrepancia conocida

El panel `DailyResultsDrawer` muestra el ganador de cada minijuego del día seleccionado, pero **no usa `calculateWinner`**: aplica una comparación **solo por tiempo**:

```ts
// DailyResultsDrawer.tsx
const winner: Player | undefined =
  eTime < fTime ? 'enrique' : fTime < eTime ? 'francisco' : undefined;
```

Implicaciones frente a las reglas centrales de la sección 3:
- **Abandono:** se comporta igual que `calculateWinner` (un `Infinity` pierde contra un tiempo finito), porque `Infinity < finito` es falso.
- **Desempate flawless:** **no se aplica**. En un empate exacto de segundos, el drawer marca `undefined` (sin ganador visual) aunque uno sea ✨, mientras que `calculateWinner` sí otorgaría la victoria al flawless.

Por tanto, el marcador del banner del drawer puede diferir del cómputo oficial de "días ganados" en casos de empate con desempate por flawless. Si se busca total consistencia, el drawer debería delegar también en `calculateWinner`.

---

## 7. Constantes de dominio

| Constante | Ubicación | Valor / propósito |
|-----------|-----------|-------------------|
| Lista de minijuegos | `AnalyticsPage.tsx` (`GAMES`) | `Zip, Tango, Queens, Mini Sudoku, Patches` |
| Color de empate | `usePlayerColors.ts` (`TIE_COLOUR`) | `#94a3b8` (fijo, no configurable) |
| Colores por defecto | `usePlayerColors.ts` | Francisco `#3b82f6`, Enrique `#ef4444` |
| Tamaño de página | `ResultsPage.tsx` (`PAGE_SIZE`) | `15` filas |
| Clave de override CSV | `useGamesData.ts` (`CUSTOM_CSV_KEY`) | `CUSTOM_CSV_URL` |
