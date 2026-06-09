# LinkedIn Tracker

Progressive Web App (PWA) para registrar y analizar el rendimiento diario en los 5 minijuegos de LinkedIn — **Zip, Tango, Queens, Mini Sudoku y Patches** — en una competencia head-to-head entre dos jugadores: **Francisco** y **Enrique**.

La app no tiene backend propio: lee los resultados desde un **CSV público de Google Sheets** (alimentado externamente por un bot de Telegram + n8n) y realiza todo el cómputo de métricas en el cliente.

---

## ✨ Características

- **Dashboard** con carrusel de resultados diarios, calendario interactivo y dona de "Días Ganados".
- **Drill-down** en la dona: al hacer clic en un segmento se ve el desglose de marcadores (`3-1`, `4-0`, …) y las fechas exactas de cada resultado.
- **Analytics** con récord, tiempos promedio por jugador y gráfico de tendencia por minijuego, filtrable por rango de fechas.
- **Historial** completo con búsqueda, ordenamiento y paginación.
- **Modo oscuro** global persistente.
- **Colores por jugador** personalizables.
- **Fuente de datos configurable** (URL del CSV editable desde Ajustes) con refresco forzado anti-caché.

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | React + TypeScript |
| Bundler / Dev server | Vite |
| Estilos | Tailwind CSS v4 |
| Gráficos | Recharts |
| Parsing CSV | PapaParse |
| Routing | React Router |
| Iconos | lucide-react |
| Persistencia local | `localStorage` (tema, colores, URL del CSV) |
| "Base de datos" | CSV público de Google Sheets (externo) |

> **Nota:** Las dependencias listadas se infieren de los `import` del código fuente. El `package.json`, `vite.config` y el manifiesto PWA viven fuera de la carpeta accesible en este workspace (la raíz es `/src`), por lo que las versiones exactas y la configuración de PWA no se documentan aquí. Consulta esos archivos en la raíz real del repositorio para detalles de versión.

---

## 🚀 Ejecución en local

Requisitos: **Node.js 18+** y un gestor de paquetes (`npm`, `pnpm` o `yarn`).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar la fuente de datos (ver más abajo)
#    Crea un archivo .env en la raíz del proyecto

# 3. Levantar el servidor de desarrollo
npm run dev

# 4. Build de producción
npm run build

# 5. Previsualizar el build
npm run preview
```

> Estos son los scripts estándar de un proyecto Vite. Verifica los nombres exactos en el `package.json` de la raíz del repositorio.

---

## 🔧 Configuración de la fuente de datos

La URL del CSV se resuelve con la siguiente prioridad (ver `hooks/useGamesData.ts → getActiveCsvUrl`):

1. **`localStorage["CUSTOM_CSV_URL"]`** — override configurable desde la página de **Ajustes**.
2. **`import.meta.env.VITE_CSV_URL`** — valor por defecto vía variable de entorno.

Crea un archivo `.env` en la raíz con la URL de tu Google Sheet publicado como CSV:

```env
VITE_CSV_URL=https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv
```

A cada lectura se le añade un parámetro `t=<timestamp>` para evitar respuestas cacheadas por el navegador. Desde Ajustes también puedes **forzar un refresco** o **resetear** a la URL por defecto.

### Formato esperado del CSV

Cada fila es el resultado de **un jugador en un minijuego en una fecha**. Columnas usadas por la app (ver interfaz `GameRecord`):

| Columna | Uso |
|---------|-----|
| `Fecha` | Agrupación por día (formato ISO `YYYY-MM-DD`) |
| `Jugador` | `Francisco` o `Enrique` (case-insensitive) |
| `Juego` | `Zip`, `Tango`, `Queens`, `Mini Sudoku`, `Patches` |
| `Edición (n.º)` | Número de edición del juego |
| `Tiempo` | Marca en formato `M:SS` o `MM:SS` |
| `Top Ranking (%)` | Informativo |
| `Sin Fallos` | Flag "flawless" (`TRUE`/`yes`/`1` → ✨) |
| `Pistas/Notas`, `Mensaje Original` | Metadatos |

---

## 📚 Documentación adicional

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — estructura de carpetas, manejo de estado y flujo de datos.
- [`BUSINESS_LOGIC.md`](./BUSINESS_LOGIC.md) — reglas de negocio (head-to-head, desempates, Win Rate por días) con referencias al código.
