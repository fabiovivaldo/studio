/**
 * Interface para os dados extraídos do site da Sinprapar.
 * As chaves são dinâmicas, baseadas nos cabeçalhos da tabela.
 */
export interface ShipData {
  [key: string]: string;
}

export interface ShipDataPayload {
  data: ShipData[];
  lastUpdated: string | null;
}

/**
 * Utilitário para decodificar entidades HTML.
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&atilde;': 'ã', '&Atilde;': 'Ã', '&otilde;': 'õ', '&Otilde;': 'Õ',
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó',
    '&uacute;': 'ú', '&ccedil;': 'ç', '&nbsp;': ' ', '&amp;': '&',
    '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó',
    '&Uacute;': 'Ú', '&Ccedil;': 'Ç'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

/**
 * Realiza o scraping dos dados de previsão de navios do site da Sinprapar.
 */
export async function fetchShipData(): Promise<ShipDataPayload> {
  const url = 'https://www.sinprapar.com.br/PREV.HTM';
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalida a cada 60 segundos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'max-age=0',
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ship data: ${response.statusText}`);
      return { data: [], lastUpdated: null };
    }

    const html = await response.text();

    // 1. Extrair todas as linhas de tabela e células (td ou th) diretamente do HTML
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    
    const allRows: string[][] = [];
    let trMatch;
    
    while ((trMatch = trRegex.exec(html)) !== null) {
      const rowHtml = trMatch[1];
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          // Remove as tags html internas que possam estar dentro do td/th (como a tag <font> etc)
          let cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
          cellText = decodeHtmlEntities(cellText).replace(/\s+/g, ' '); // Limpa quebras de linhas estranhas
          cells.push(cellText);
      }
      
      if (cells.length > 0) {
          allRows.push(cells);
      }
    }

    // 2. Encontrar o índice da linha que serve como cabeçalho da tabela de dados
    const headerRowIndex = allRows.findIndex(row => row.some(cell => cell.toUpperCase().includes('NAVIO') || cell.toUpperCase().includes('MANOBRA')));

    if (headerRowIndex === -1) {
      console.error("Nenhum cabeçalho de navio (Navio, Manobra) encontrado nas tabelas.");
      return { data: [], lastUpdated: null };
    }

    const originalHeaders = allRows[headerRowIndex];
    let lastUpdated: string | null = null;
    
    const cleanedHeaders = originalHeaders.map(h => {
        if (h.toUpperCase().includes('MANOBRAS PREVISTAS')) {
            lastUpdated = h.replace(/DATA\s*$/i, '').trim();
            return 'DATA';
        }
        return h;
    });
    
    const data: ShipData[] = [];
    const dataRows = allRows.slice(headerRowIndex + 1);

    // 3. Montar a lista formatada no record key-value
    for (const row of dataRows) {
        // Ignorar lixo (linhas curtas que não fazem parte dessa tabela real)
        if (row.length !== cleanedHeaders.length) continue;

        const record: ShipData = {};
        
        cleanedHeaders.forEach((header, index) => {
          record[header] = row[index];
        });
        
        data.push(record);
    }
    
    return { data, lastUpdated };

  } catch (error) {
    console.error("Erro ao buscar ou processar dados dos navios:", error);
    return { data: [], lastUpdated: null };
  }
}
