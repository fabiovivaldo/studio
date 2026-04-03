/**
 * Interface para os dados extraídos do site oficial.
 */
export interface PonteiroData {
  Data_Turno: string;
  Funcao: string;
  Sinal: string;
  Original_1: string;
  Temporario_1: string;
  Original_2: string;
  Temporario_2: string;
}

/**
 * Utilitário para decodificar entidades HTML comuns no site do OGMO.
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
 * Realiza o scraping dos dados de ponteiros do OGMO.
 */
export async function fetchPonteiroData(): Promise<PonteiroData[]> {
  const url = 'https://www.ogmopgua.com.br/ogmopr/TempHtml/Ponteiros.html';
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const html = await response.text();
    const datePattern = /<h3>(.*?)<\/h3>/i;
    const dateMatch = datePattern.exec(html);
    const headerDataRaw = dateMatch ? dateMatch[1].trim() : "Sem Data";
    let headerData = decodeHtmlEntities(headerDataRaw);

    const pattern = /<tr>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
    
    const data: PonteiroData[] = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const col1 = decodeHtmlEntities(match[1].trim());
      if (col1 && col1 !== "Lista" && !col1.includes("Função")) {
        const orig1 = match[3].trim();
        const temp1 = match[4].trim();
        let sinal = match[2].trim();
        
        // Inteligência de sinal: se o temporário é maior que o original, a tendência é (+)
        // Isso corrige erros onde o site mostra (-) mas a fila está subindo (ex: 92 para 148)
        const nOrig = parseInt(orig1);
        const nTemp = parseInt(temp1);
        if (!isNaN(nOrig) && !isNaN(nTemp)) {
          if (nTemp > nOrig) {
            sinal = '+';
          }
        }

        data.push({
          Data_Turno: headerData,
          Funcao: col1,
          Sinal: sinal,
          Original_1: orig1,
          Temporario_1: temp1,
          Original_2: match[5].trim(),
          Temporario_2: match[6].trim(),
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error("Scraping error:", error);
    return [];
  }
}
