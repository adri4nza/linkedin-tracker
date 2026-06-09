# LinkedIn Tracker

Progressive Web App (PWA) para registrar y analizar el rendimiento diario en los 5 minijuegos de LinkedIn — **Zip, Tango, Queens, Mini Sudoku y Patches** — en una competencia head-to-head entre dos jugadores: **Francisco** y **Enrique**.

La app **no tiene backend propio**: lee los resultados desde un **CSV público de Google Sheets** (alimentado externamente por un bot de Telegram + n8n) y realiza todo el cómputo de métricas en el cliente.

---

## ✨ Características

- **Dashboard** (`/`) con carrusel de resultados diarios, calendario interactivo (`MiniCalendar`) y dona de "Días Ganados" (`DonutChart`).
- **Drill-down** en la dona: al hacer clic en un segmento se ve el desglose de marcadores (`3-1`, `4-0`, …) y, dentro de cada marcador, las fechas exactas. Al pulsar una fecha se abre el `DailyResultsDrawer`.
- **Analytics** (`/analytics`) con récord (mejor tiempo), tiempos promedio por jugador y gráfico de tendencia (`TrendChart`) por minijuego, filtrable por rango de fechas (7/30/90 días, histórico o rango personalizado).
- **Historial** (`/results`) completo con búsqueda, ordenamiento por columnas y paginación.
- **Modo oscuro** global persistente (`useDarkMode`).
- **Colores por jugador** personalizables (`usePlayerColors`).
- **Fuente de datos configurable** (URL del CSV editable desde Ajustes) con refresco forzado anti-caché.
- **Instalable como PWA** (`vite-plugin-pwa`, `registerType: 'autoUpdate'`).

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | React 19 + TypeScript |
| Bundler / Dev server | Vite 8 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Gráficos | Recharts 3 |
| Parsing CSV | PapaParse |
| Routing | React Router 7 (`BrowserRouter`) |
| Iconos | lucide-react |
| PWA | `vite-plugin-pwa` |
| Persistencia local | `localStorage` (tema, colores, URL del CSV) |
| "Base de datos" | CSV público de Google Sheets (externo) |

Las versiones exactas viven en [`package.json`](./package.json) y la configuración de la PWA en [`vite.config.ts`](./vite.config.ts).

---

## 🚀 Ejecución en local

Requisitos: **Node.js 18+** y `npm` (o `pnpm` / `yarn`).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar la fuente de datos (ver sección siguiente)
#    Copia .env.example a .env y completa VITE_CSV_URL

# 3. Levantar el servidor de desarrollo
npm run dev

# 4. Build de producción (type-check + bundle)
npm run build

# 5. Previsualizar el build
npm run preview

# Lint
npm run lint
```

Scripts definidos en `package.json`:

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `vite` | Servidor de desarrollo con HMR |
| `build` | `tsc -b && vite build` | Compilación de tipos + bundle de producción |
| `lint` | `eslint .` | Análisis estático |
| `preview` | `vite preview` | Sirve el build de producción localmente |

---

## 🔧 Configuración de la fuente de datos

La URL del CSV se resuelve con la siguiente prioridad (ver `src/hooks/useGamesData.ts → getActiveCsvUrl`):

1. **`localStorage["CUSTOM_CSV_URL"]`** — override configurable desde la página de **Ajustes**.
2. **`import.meta.env.VITE_CSV_URL`** — valor por defecto vía variable de entorno.

Crea un archivo `.env` en la raíz (a partir de `.env.example`) con la URL de tu Google Sheet publicado como CSV:

```env
VITE_CSV_URL=https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv
```

A cada lectura se le añade un parámetro `t=<timestamp>` para evitar respuestas cacheadas por el navegador. Desde Ajustes también puedes **forzar un refresco** o **resetear** a la URL por defecto.

### Formato esperado del CSV

Cada fila es el resultado de **un jugador en un minijuego en una fecha**. Columnas usadas por la app (ver interfaz `GameRecord` en `src/hooks/useGamesData.ts`):

| Columna | Uso |
|---------|-----|
| `Fecha` | Agrupación por día (formato ISO `YYYY-MM-DD`) |
| `Jugador` | `Francisco` o `Enrique` (comparado en minúsculas) |
| `Juego` | `Zip`, `Tango`, `Queens`, `Mini Sudoku`, `Patches` |
| `Edición (n.º)` | Número de edición del juego |
| `Tiempo` | Marca en formato `M:SS` o `MM:SS` |
| `Top Ranking (%)` | Informativo |
| `Sin Fallos` | Flag "flawless" (`TRUE` / `yes` / `1` → ✨) |
| `Pistas/Notas`, `Mensaje Original` | Metadatos |

### Generación del CSV (pipeline externo)

El histórico se alimenta de un chat de Telegram. El script [`scripts/parser.cjs`](./scripts/parser.cjs) permite procesar una exportación de chat (`chat_enrique.csv`) localmente: extrae con regex el juego, edición, tiempo, ranking y el flag "sin fallos", ajusta la fecha UTC a la zona local (`-5h`) y emite `historial_limpio.csv` listo para pegar en Google Sheets. En producción esa misma lógica corre en n8n.

---

## 📚 Documentación adicional

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — estructura de carpetas, manejo de estado y flujo de datos (de CSV a render).
- [`BUSINESS_LOGIC.md`](./BUSINESS_LOGIC.md) — reglas de negocio (head-to-head, desempates, Win Rate por días) con referencias al código exacto.
