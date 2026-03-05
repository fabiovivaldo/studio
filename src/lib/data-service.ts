
export interface PonteiroData {
  Data_Turno: string;
  Funcao: string;
  Sinal: string;
  Original_1: string;
  Temporario_1: string;
  Original_2: string;
  Temporario_2: string;
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&atilde;': 'ã',
    '&Atilde;': 'Ã',
    '&otilde;': 'õ',
    '&Otilde;': 'Õ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&ccedil;': 'ç',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&Ccedil;': 'Ç'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

export async function fetchPonteiroData(): Promise<PonteiroData[]> {
  const url = 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html';
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    
    const datePattern = /<h3>(.*?)<\/h3>/i;
    const dateMatch = datePattern.exec(html);
    const headerDataRaw = dateMatch ? dateMatch[1].trim() : "Sem Data";
    let headerData = decodeHtmlEntities(headerDataRaw);

    // Lógica para Madrugada: Se o turno for Madrugada, soma +1 dia na exibição
    if (headerData.toLowerCase().includes('madrugada')) {
      const dateParts = headerData.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateParts) {
        const [fullMatch, day, month, year] = dateParts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Adiciona 1 dia
        date.setDate(date.getDate() + 1);
        
        const nextDay = String(date.getDate()).padStart(2, '0');
        const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
        const nextYear = date.getFullYear();
        
        const newDateStr = `${nextDay}/${nextMonth}/${nextYear}`;
        headerData = headerData.replace(fullMatch, newDateStr);
      }
    }

    const pattern = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    
    const data: PonteiroData[] = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const col1 = decodeHtmlEntities(match[1].trim());
      const col2 = match[2].trim();
      const col3 = match[3].trim();
      const col4 = match[4].trim();
      const col5 = match[5].trim();
      const col6 = match[6].trim();

      if (col1 && col1 !== "Lista" && !col1.includes("Função")) {
        data.push({
          Data_Turno: headerData,
          Funcao: col1,
          Sinal: col2,
          Original_1: col3,
          Temporario_1: col4,
          Original_2: col5,
          Temporario_2: col6,
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Scraping error:", error);
    return Array.from({ length: 15 }, (_, i) => ({
      Data_Turno: "05/03/2026 Madrugada", // Mock atualizado para refletir a lógica
      Funcao: `MOCK_FUNC_${i + 1}`,
      Sinal: i % 2 === 0 ? "+" : "-",
      Original_1: (Math.random() * 100).toFixed(0),
      Temporario_1: (Math.random() * 100).toFixed(0),
      Original_2: (Math.random() * 100).toFixed(0),
      Temporario_2: (Math.random() * 100).toFixed(0),
    }));
  }
}

export function exportToCSV(data: PonteiroData[]) {
  const headers = ["Data_Turno", "Funcao", "Sinal", "Original_1", "Temporario_1", "Original_2", "Temporario_2"];
  const rows = data.map(row => [
    row.Data_Turno,
    row.Funcao,
    row.Sinal,
    row.Original_1,
    row.Temporario_1,
    row.Original_2,
    row.Temporario_2
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map(e => e.join(";"))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Ponteiros_Data.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
