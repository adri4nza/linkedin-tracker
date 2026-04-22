const fs = require("fs");
const Papa = require("papaparse");

// 1. Leemos el archivo que exportaste de Excel/Sheets
const fileContent = fs.readFileSync("./chat_enrique.csv", "utf8");

console.log("Iniciando la minería de datos... ⏳");

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const parsedData = [];
    let ignorados = 0;

    results.data.forEach((row) => {
      const text = row.CONTENT || "";
      if (!text) return;

      // Filtro para ignorar charla normal (igual que en n8n)
      if (!text.includes("lnkd.in/")) {
        ignorados++;
        return;
      }

      // LA REGEX MEJORADA: Soporta saltos de línea (\n) o barras (|)
      const headerRegex =
        /(Zip|Tango|Queens|Mini Sudoku|Patches)\s*(?:#|n\.º)\s*(\d+)[\s|]+(\d+:\d+)/i;
      const match = text.match(headerRegex);

      if (match) {
        // Asignar jugador
        let player = "Desconocido";
        if (row.FROM && row.FROM.includes("Francisco")) player = "Francisco";
        if (row.FROM && row.FROM.includes("Enrique")) player = "Enrique";

        // Ajustar la fecha UTC a la zona horaria local
        let date = "";
        if (row.DATE) {
          // Crea un objeto Date reconociendo que está en UTC
          const dateObj = new Date(row.DATE);

          // Restamos el desfase horario (Usa -4 o -5 según la hora exacta que quieran usar como referencia)
          // Esto empujará las horas de la madrugada de vuelta al día anterior
          dateObj.setHours(dateObj.getHours() - 5);

          // Extraemos la fecha corregida en formato YYYY-MM-DD
          date = dateObj.toISOString().split("T")[0];
        }
        // Extraer Top Ranking (Soporta español e inglés)
        const rankMatch = text.match(/(?:Top|en el)\s*(\d+)\s*%/i);
        const ranking = rankMatch ? rankMatch[1] : "";

        // Extraer Sin Fallos
        const flawless =
          /flawless|sin fallos|sin pistas|no hints|sin retrocesos/i.test(text);

        // Extraer Pistas/Notas
        const notasMatch = text.match(
          /.*(?:hints|pistas|redraws|repetir|retrocesos).*/i,
        );
        const notas = notasMatch ? notasMatch[0].trim() : "";

        parsedData.push({
          Fecha: date,
          Jugador: player,
          Juego: match[1].trim(),
          "Edición (n.º)": match[2],
          Tiempo: match[3],
          "Top Ranking (%)": ranking,
          "Sin Fallos": flawless ? "TRUE" : "FALSE",
          "Pistas/Notas": notas,
          "Mensaje Original": text.replace(/\n/g, " "), // Quita los saltos de línea para que Sheets no se rompa
        });
      }
    });

    // 2. Convertimos el JSON resultante a formato CSV
    const finalCsv = Papa.unparse(parsedData);

    // 3. Guardamos el resultado limpio
    fs.writeFileSync("./historial_limpio.csv", finalCsv);

    console.log(`✅ ¡Éxito!`);
    console.log(`🎮 Se extrajeron ${parsedData.length} resultados de juegos.`);
    console.log(`💬 Se ignoraron ${ignorados} mensajes de chat normal.`);
    console.log(
      `📄 Revisa el archivo 'historial_limpio.csv' y pégalo en tu Google Sheets.`,
    );
  },
});
