
'use client';

import { useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados no LocalStorage.
 */
export function DataArchiver({ data }: DataArchiverProps) {

  useEffect(() => {
    if (!data.length) return;

    // A lógica de verificação anterior foi removida.
    // Ela impedia atualizações se o nome do turno fosse o mesmo,
    // mesmo que os valores dos ponteiros tivessem mudado.
    // Agora, os dados são sempre processados para garantir que estejam atualizados.

    // Carrega histórico atual do LocalStorage
    const savedHistory = localStorage.getItem('ponteiro_history');
    let history = savedHistory ? JSON.parse(savedHistory) : [];

    // Formata os novos registros para armazenamento
    const newRecords = data.map((row) => {
      // ID único incluindo a data para evitar colisões entre dias diferentes.
      const safeId = `${row.Funcao}_${row.Data_Turno}`
        .replace(/[/\\#?%*:.|"<>\s]/g, '_')
        .substring(0, 100);

      return {
        id: safeId,
        funcao: row.Funcao,
        sinal: row.Sinal,
        original1: row.Original_1,
        temporario1: row.Temporario_1,
        original2: row.Original_2,
        temporario2: row.Temporario_2,
        dataTurno: row.Data_Turno,
        createdAt: new Date().toISOString()
      };
    });

    // Mescla o histórico com novos registros.
    const mergedHistory = [...history, ...newRecords];
    
    // Remove duplicatas baseadas no ID único, garantindo que o registro mais recente (novo) prevaleça.
    const uniqueHistoryMap = new Map(mergedHistory.map(item => [item.id, item]));

    // Ordena por data de criação (mais novos primeiro) e limita a 1000 registros.
    const uniqueHistory = Array.from(uniqueHistoryMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1000);

    localStorage.setItem('ponteiro_history', JSON.stringify(uniqueHistory));
    
    // Dispara evento global para sincronizar outros componentes
    window.dispatchEvent(new Event('ponteiro_history_updated'));
  }, [data]);

  return null;
}
