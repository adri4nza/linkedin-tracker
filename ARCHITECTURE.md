# Arquitectura

Este documento describe la estructura de carpetas, el manejo de estado y el flujo de datos de **LinkedIn Tracker**, desde la lectura del CSV remoto hasta el renderizado de cada vista.

---

## 1. Visión general

La app es una **SPA client-side** servida como PWA. No existe servidor de aplicación propio: el único origen de datos es un **CSV público de Google Sheets**. Todo el procesamiento (parsing, agregaciones, cálculo de victorias y métricas) ocurre en el navegador.

```
┌────────────────────┐     fetch CSV (+cache-buster)     ┌──────────────────────┐
│  Google Sheets CSV │ ◀──────────────────────────────── │  useGamesData (hook) │
│  (alimentado por    │                                   │  PapaParse → GameRecord[]
│   Telegram + n8n)   │                                   └───────────┬──────────┘
└────────────────────┘                                                │ data, isLoading, error
                                                                       ▼
                                              ┌────────────────────────────────────────┐
                                              │  Páginas (useMemo: agregación + cálculo) │
                                              │  Dashboard / Analytics / Results         │
                                              └───────────────┬──────────────────────────┘
                                                              │ props
                                                              ▼
                                              ┌────────────────────────────────────────┐
                                              │  Componentes de presentación             │
                                              │  DonutChart, TrendChart, MiniCalendar,    │
                                              │  DailyResultsDrawer, MetricCard…          │
                                              └────────────────────────────────────────┘
```

---

## 2. Estructura de carpetas

```
linkedin-tracker/
├── index.html                 # Punto de entrada HTML
├── vite.config.ts             # Config Vite + React + Tailwind v4 + PWA
├── package.json               # Dependencias y scripts
├── .env / .env.example        # VITE_CSV_URL
├── public/                    # Iconos PWA, favicon
├── scripts/
│   └── parser.cjs             # Pipeline offline: chat exportado → CSV limpio
└── src/
    ├── main.tsx               # Bootstrap de React
    ├── App.tsx                # Router + rutas + activación de dark mode
    ├── index.css / App.css    # Estilos globales (Tailwind)
    ├── hooks/
    │   ├── useGamesData.ts     # Fetch + parseo del CSV (fuente de datos)
    │   ├── useDarkMode.ts      # Estado de tema, persistido en localStorage
    │   └── usePlayerColors.ts  # Colores por jugador, persistidos en localStorage
    ├── utils/
    │   └── timeUtils.ts        # Conversión de tiempos + reglas head-to-head
    ├── components/
    │   ├── Layout/             # Layout + Sidebar (shell de navegación)
    │   ├── MetricCard/         # Tarjeta de métrica (Analytics)
    │   ├── DonutChart/         # Dona "Días Ganados" + drill-down
    │   ├── TrendChart/         # Línea de tendencia de tiempos
    │   ├── MiniCalendar/       # Calendario con puntos por día
    │   ├── DailyResultsDrawer/ # Panel lateral con el detalle de un día
    │   └── WinnerCard/         # Tarjeta de ganador
    └── pages/
        ├── DashboardPage.tsx   # Inicio: carrusel + calendario + dona
        ├── AnalyticsPage.tsx   # Métricas y tendencia por minijuego
        ├── ResultsPage.tsx     # Tabla/historial con filtros y paginación
        └── SettingsPage.tsx    # Fuente de datos, caché, tema y colores
```

**Convención de componentes:** cada componente vive en su propia carpeta `ComponentName/ComponentName.tsx`. Las páginas son componentes "contenedor" que orquestan datos; los componentes de `components/` son mayormente de presentación.

---

## 3. Routing

Definido en `src/App.tsx` con React Router. Todas las rutas comparten un `Layout` común (sidebar + contenedor):

| Ruta | Componente | Propósito |
|------|------------|-----------|
| `/` | `DashboardPage` | Resultados diarios, calendario y días ganados |
| `/analytics` | `AnalyticsPage` | Récord, promedios y tendencia por juego |
| `/results` | `ResultsPage` | Historial filtrable y paginado |
| `/settings` | `SettingsPage` | Configuración de datos, caché y apariencia |

`App` invoca `useDarkMode()` en el nivel raíz para aplicar la clase `dark` al `<html>` desde el arranque.

---

## 4. Manejo de estado

No hay una librería de estado global (Redux/Zustand). El estado se distribuye en tres niveles:

### 4.1 Estado de datos remotos — `useGamesData`
Hook que recibe la URL del CSV y devuelve `{ data, isLoading, error }`. Internamente usa `PapaParse` con `download: true` (PapaParse hace el fetch) y `header: true` para mapear cada fila a un `GameRecord`. Se re-ejecuta cuando cambia `csvUrl` (dependencia del `useEffect`).

> Cada página llama a `getActiveCsvUrl()` **una vez a nivel de módulo** (`const CSV_URL = getActiveCsvUrl()`), de modo que el cache-buster `t=<timestamp>` se fija al cargar el módulo. Por eso los cambios de URL/colores aplican **tras recargar** la página (las acciones de Ajustes hacen `window.location.reload()`).

### 4.2 Estado derivado — `useMemo` por página
Las agregaciones (agrupar por fecha/juego, calcular ganadores, días ganados, promedios, datos del gráfico) se calculan con `useMemo` dentro de cada página, dependiendo de `data` y de los filtros locales. No se persisten: se recalculan en cada render relevante.

### 4.3 Estado de UI / preferencias — `useState` + `localStorage`
- **Filtros y selección**: `useState` local (rango de fechas, juego seleccionado, búsqueda, página, fecha seleccionada para el drawer, segmento seleccionado en la dona).
- **Preferencias persistentes** vía `localStorage`:

| Clave | Hook | Contenido |
|-------|------|-----------|
| `theme` | `useDarkMode` | `"dark"` / `"light"` |
| `PLAYER_COLOURS` | `usePlayerColors` | `{ francisco, enrique }` (hex) |
| `CUSTOM_CSV_URL` | `useGamesData` (`CUSTOM_CSV_KEY`) | Override de la URL del CSV |

El color de empate (`TIE_COLOUR = #94a3b8`) es fijo y no configurable.

---

## 5. Flujo de datos extremo a extremo

1. **Origen externo.** Un bot de Telegram + n8n procesa los mensajes con resultados y escribe filas en un Google Sheet, publicado como CSV. (`scripts/parser.cjs` reproduce esa extracción de forma local con regex.)
2. **Resolución de URL.** `getActiveCsvUrl()` elige `localStorage["CUSTOM_CSV_URL"]` o `VITE_CSV_URL`, y le añade `?t=<timestamp>` para evitar caché del navegador.
3. **Fetch + parseo.** `useGamesData` invoca `PapaParse`, que descarga y parsea el CSV a `GameRecord[]`. Expone `isLoading` y `error` para los estados de carga/fallo (renderizados de forma uniforme con spinners y mensajes en cada página).
4. **Agregación en cliente.** Cada página agrupa los registros:
   - **Dashboard**: `Fecha → Juego → { francisco, enrique }`, calcula ganador por juego con `calculateWinner`, determina el ganador del día y arma `dateColorMap`, `winRateData` (con breakdown de marcadores) y `dailyCards`.
   - **Analytics**: filtra por juego + rango, calcula récord (mínimo tiempo), promedios por jugador y `chartData` cronológico.
   - **Results**: filtra (búsqueda + juego), ordena por columna y pagina (`PAGE_SIZE = 15`).
5. **Render.** Las páginas pasan los datos derivados como props a los componentes de presentación (Recharts para dona/línea, calendario, drawer, etc.).
6. **Interacción.** Click en un segmento de la dona → breakdown de marcadores → fechas → `onDateSelect` abre `DailyResultsDrawer`; click en un día del calendario o en una fila del historial hace lo mismo.

---

## 6. Patrón del drill-down (DonutChart → Drawer)

El `DonutChart` recibe `winRateData`, donde cada entrada incluye un `breakdown: Record<string, string[]>` que mapea un marcador (`"3-1"`) a la lista de fechas con ese marcador. El componente maneja dos niveles de selección con `useState` local:

1. `selectedSegment` — el jugador/empate elegido (resalta el segmento y muestra su % y total).
2. `selectedScore` — un marcador concreto dentro del segmento, que despliega los chips de fecha.

Al pulsar una fecha se llama `onDateSelect(fecha)`, que en `DashboardPage` setea `selectedDate` y abre el `DailyResultsDrawer`. El drawer recalcula, sobre el `data` completo, el detalle por juego de ese día (tiempos, ✨ flawless y ganador por minijuego).

---

## 7. PWA

`vite.config.ts` configura `vite-plugin-pwa` con `registerType: 'autoUpdate'` (la app se actualiza sola al desplegar nuevos cambios) y un manifest con nombre "LNKD Games", modo `standalone` e iconos en `public/`.

---

## 8. Notas y consideraciones

- **Coherencia del cálculo de ganador por juego:** la regla completa (abandono + desempate flawless) vive en `calculateWinner` (`utils/timeUtils.ts`) y la usan `DashboardPage` y `AnalyticsPage`. El `DailyResultsDrawer` aplica una variante **solo por tiempo** para mostrar el ganador visual de cada tarjeta (ver detalle en `BUSINESS_LOGIC.md`).
- **Recarga tras cambios de preferencias:** por el patrón de `getActiveCsvUrl()` a nivel de módulo y de `usePlayerColors` (lectura memoizada al montar), los cambios de URL y de colores se aplican recargando la página, lo que `SettingsPage` hace automáticamente.
- **Sin tests automatizados** en el repositorio al momento de escribir este documento.
