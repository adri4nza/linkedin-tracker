---
inclusion: always
---

# 02 · Business Logic (reglas de victoria)

> Esta es la fuente de verdad sobre **cómo se decide un ganador**. Toda la
> lógica vive en funciones puras dentro de `src/utils/`. No dupliques ni
> reimplementes estas reglas en componentes; llama a las funciones existentes.

## 1. Victoria por minijuego — `calculateWinner`

Ubicación: `src/utils/timeUtils.ts`.

```ts
calculateWinner(recA, recB, gameName): 'a' | 'b' | 'tie' | null
```

Reglas evaluadas **en orden**:

1. **Menor tiempo gana** (criterio primario). El tiempo se obtiene con
   `timeToSeconds(Tiempo)`; un string vacío / inválido / ausente ⇒ `Infinity`.
2. **Victoria por abandono / forfeit (`Infinity`)** — si un jugador tiene tiempo
   `Infinity` (no jugó o dato inválido) y el otro tiene tiempo finito, gana el
   que tiene tiempo finito automáticamente.
3. **Empate exacto de tiempo (mismo número de segundos):**
   - **Solo para `Zip`**: gana quien tenga **menos `Retrocesos`** (desempate).
     El desempate es decisivo **únicamente si AMBOS conteos son conocidos**
     (`!= null`). Si cualquiera de los dos es `null` (desconocido) ⇒ `'tie'`.
   - **Para cualquier otro juego**: siempre `'tie'` (no se otorga punto).
4. **Ambos tiempos `Infinity`** ⇒ `null` (no hay competencia; el día/partida no
   se cuenta).

### ⚠️ Convención de orden de argumentos (crítica)

El significado de `'a'` / `'b'` depende **enteramente** del orden en que se
pasan los registros. Hay DOS convenciones vigentes en el código y son
intencionales — **no las "unifiques"**:

- **Francisco-first** (`calculateWinner(francisco, enrique, juego)`):
  `'a'` = Francisco, `'b'` = Enrique. Usada en `dayWins.ts`, `gameHeatmap.ts`,
  `pivot.ts` y `DailyResultsDrawer`. Es la convención estándar y preferida.
- **Enrique-first** (`calculateWinner(enrique, francisco, juego)`):
  `'a'` = Enrique, `'b'` = Francisco. Usada **solo** en `analyticsStats.ts`
  (`computeGameStats`). Se conserva a propósito para no invertir los totales
  históricos de la AnalyticsPage.

Al escribir código nuevo, **usa siempre Francisco-first** salvo que estés
tocando `analyticsStats.ts`.

## 2. Normalización de fechas por edición — `normalizeEditionDates`

Ubicación: `src/utils/normalizeEditionDates.ts`. Invocada en `useGamesData`
como **paso 2 del pipeline de ingesta**, antes de que cualquier utils de
agregación vea los datos.

### Problema que resuelve

Un jugador que completa el minijuego después de medianoche registra la partida
en el día calendario siguiente. Sin normalización, los dos registros de la misma
edición tienen fechas distintas → `dayWins.ts`, `gameHeatmap.ts` y
`analyticsStats.ts` los tratan como eventos independientes → el día queda
`'excluded'` o genera victorias por forfeit incorrectas.

### Regla

Para cada grupo `Juego + Edición (n.º)` (normalizado con `.trim().toLowerCase()`),
se asigna a **todos los registros del grupo** la **fecha mínima válida** encontrada.
La comparación de fechas ISO `YYYY-MM-DD` es lexicográficamente equivalente a
la cronológica, por lo que se usa `<` directamente.

### Precauciones (invariantes que no deben romperse)

1. **Fechas inválidas / vacías**: un registro sin fecha o con formato incorrecto
   se excluye del cálculo del mínimo. Si el grupo tiene al menos una fecha válida,
   el registro inválido la recibe; si no, su `Fecha` queda intacta.
2. **Edición vacía**: registros sin `Edición (n.º)` se devuelven sin alterar.
   No hay nada con qué agruparlos.
3. **Inmutabilidad**: el array de entrada no se muta. Los registros modificados
   son shallow copies (`{ ...record, Fecha: minDate }`).
4. **Idempotencia**: aplicar la función dos veces produce el mismo resultado.

### Consecuencia para el resto del código

Todos los utils downstream (`dayWins.ts`, `gameHeatmap.ts`, `analyticsStats.ts`,
`pivot.ts`) siguen agrupando por `Fecha` sin cambios — funcionan correctamente
porque después de la normalización todos los registros de la misma edición ya
comparten la misma fecha.

## 3. Extracción dinámica de Retrocesos (exclusiva para el desempate de Zip)
Ubicación: `extractRetrocesos(text)` en `src/utils/timeUtils.ts`, invocada desde
`useGamesData` solo para filas de `Zip`.

- Es un campo **derivado en cliente** desde `Mensaje Original`; **no existe
  columna en el Google Sheet**.
- El **orden de chequeo importa**:
  1. Frases de partida perfecta (`/no\s+backtracks|sin\s+retrocesos/i`) ⇒ `0`.
  2. Número explícito ES/EN, singular o plural
     (`/(\d+)\s*(?:retroceso|retrocesos|backtrack|backtracks)/i`) ⇒ ese número.
  3. Sin señal fiable ⇒ `null` (**desconocido**).
- `null` es deliberadamente distinto de `0`: nunca se asume 0 para no otorgar
  indebidamente la estrella ✨ (partida perfecta) a registros mal parseados o
  legacy. Un `null` en cualquiera de los dos lados anula el desempate de Zip
  (resultado `'tie'`).

## 4. Victoria por día — "días ganados" (`computeDailyOutcomes`)

Ubicación: `src/utils/dayWins.ts`. Convención Francisco-first.

Algoritmo por fecha:

1. Agrupar los registros por `Fecha` → `Juego` → `{ francisco, enrique }`.
2. **Regla de exclusión (juegos jugados desiguales):** contar cuántos juegos
   jugó cada quien ese día. Si `eGames !== fGames` (jugaron un número distinto
   de minijuegos), el día se marca `'excluded'`:
   - Se pinta con el color de empate (`TIE_COLOUR`) en el calendario, **pero
     NUNCA se cuenta** en el tally mensual (`franciscoWins`/`enriqueWins = 0`).
   - Esto evita comparar días asimétricos donde uno jugó más partidas.
3. Si el número de juegos coincide, resolver cada minijuego con
   `calculateWinner(francisco, enrique, juego)` y acumular `fWins` / `eWins`.
   El día pertenece a quien gane la **mayoría** de minijuegos:
   - `fWins > eWins` ⇒ `'francisco'`.
   - `eWins > fWins` ⇒ `'enrique'`.
   - iguales ⇒ `'tie'`.

Salida: un `DailyOutcome` por fecha con datos, incluyendo `outcome`, `color`,
`franciscoWins`, `enriqueWins`.

### Tally mensual — `computeMonthlyTally`

Cuenta los `DailyOutcome` cuya `Fecha` cae en un mes/año dados (mes 0-based).
Los `'excluded'` **jamás** incrementan ningún contador. Días de relleno de meses
adyacentes se ignoran por construcción.

## 5. Head-to-head por minijuego (Analytics) — `gameHeatmap.ts`

- `buildGameColorMap(data, game, colors)` — agrupa solo los registros del juego
  seleccionado por fecha, resuelve con `calculateWinner(francisco, enrique)` y
  asigna color: `'a'`→francisco, `'b'`→enrique, `'tie'`→tieColor. Resultado
  `null` ⇒ la fecha se **omite** del mapa (sin indicador). **No aplica filtro de
  rango temporal**: opera sobre `data` completo (independencia estructural).
- `computeGameMonthlyTally(data, game, month, year)` — mismo criterio, contando
  días ganados por juego en el mes visible. `null` se ignora.

## 6. Estadísticas de Analytics — `analyticsStats.ts`

`computeGameStats(records, game)` (⚠️ convención **Enrique-first**) produce:

- **World Record** global (menor tiempo) y **por jugador** (mejor tiempo finito,
  o `null`).
- **Promedios** (overall / Francisco / Enrique) sobre tiempos finitos;
  `Infinity` si no hay ninguno, formateado con `secondsToTime` (`'—'`).
- **Total Wins**: agrupa por fecha y resuelve
  `calculateWinner(enrique, francisco, game)` (`'a'`→Enrique, `'b'`→Francisco).
- **chartData**: un punto por fecha, orden cronológico, tiempo en segundos por
  jugador (`undefined` si ese jugador no jugó ese día).

El **filtrado por rango temporal y por juego es responsabilidad de la página**
(AnalyticsPage), no de `computeGameStats`.

## 7. Pivote head-to-head — `pivot.ts`

`pivotRecords(records)` agrupa por clave única `Fecha|Juego|Edición`, con a lo
sumo un registro por jugador. Resolución de duplicados: se conserva el de
**menor tiempo** (`pickLowerTime`); en empate exacto se conserva el primero
visto. `winner` se mapea desde `calculateWinner` (Francisco-first) a
`'francisco' | 'enrique' | 'tie' | 'none'`. `sortTimeSecs = min(tF, tE)`.

`sortPivotRows(rows, col, dir)` ordena por columna; las filas sin tiempo finito
(`sortTimeSecs === Infinity`) van **siempre al final**, independientemente de la
dirección.

## Helpers de tiempo — `timeUtils.ts`

- `timeToSeconds(time)`: `'M:SS'`/`'MM:SS'` → segundos; vacío/inválido ⇒ `Infinity`.
- `secondsToTime(secs)`: segundos → `'M:SS'`; no finito o negativo ⇒ `'—'`.
- `isFlawless(val)`: interpreta `'Sin Fallos'`. **Ya NO se usa como desempate**;
  se conserva solo para display informativo.

## 8. Modo hipotético "Sin Mini Sudoku" (Dashboard)

`DashboardPage` expone un toggle de estado `excludeMiniSudoku: boolean`. Cuando
está activo, el `data` se filtra antes de pasarlo a `computeDailyOutcomes`:

```ts
const activeData = excludeMiniSudoku
  ? data.filter((r) => r.Juego?.trim() !== 'Mini Sudoku')
  : data;
```

**Esto no modifica ninguna función pura** — es un filtrado del input en la página,
exactamente como `AnalyticsPage` filtra por rango temporal. El modo se indica
visualmente con un chip ámbar y el label "Modo hipotético". Los números que
muestra el DonutChart bajo este modo **no son oficiales** y no deben usarse para
comparaciones definitivas de la competencia. El `DailyResultsDrawer` siempre
muestra los tiempos reales del día, incluido Mini Sudoku, independientemente del
toggle.
