export interface PonteiroData {
  Funcao: string;
  Sinal: string;
  Original_1: string;
  Temporario_1: string;
  Original_2: string;
  Temporario_2: string;
}

export async function fetchPonteiroData(): Promise<PonteiroData[]> {
  const url = 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html';
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Regex from prompt: (?i)<tr>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*</tr>
    const pattern = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    
    const data: PonteiroData[] = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const col1 = match[1].trim();
      const col2 = match[2].trim();
      const col3 = match[3].trim();
      const col4 = match[4].trim();
      const col5 = match[5].trim();
      const col6 = match[6].trim();

      // Filter out empty or header rows
      if (col1 && col1 !== "Lista" && !col1.includes("Função")) {
        data.push({
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
    // Return mock data for development if the live site is down or blocking
    return Array.from({ length: 15 }, (_, i) => ({
      Funcao: `MOCK_FUNC_${i + 1}`,
      Sinal: i % 2 === 0 ? "A" : "B",
      Original_1: (Math.random() * 100).toFixed(2),
      Temporario_1: (Math.random() * 100).toFixed(2),
      Original_2: (Math.random() * 100).toFixed(2),
      Temporario_2: (Math.random() * 100).toFixed(2),
    }));
  }
}

export function exportToCSV(data: PonteiroData[]) {
  const headers = ["Funcao", "Sinal", "Original_1", "Temporario_1", "Original_2", "Temporario_2"];
  const rows = data.map(row => [
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