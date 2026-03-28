
'use client';

import { useEffect, useRef } from 'react';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados no LocalStorage.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const lastArchivedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data.length) return;

    const currentTurno = data[0].Data_Turno;
    // Chave única baseada na data e turno para evitar duplicatas na mesma sessão
    const sessionKey = `archived_${currentTurno.replace(/\s+/g, '_')}`;
    const alreadyArchivedInSession = sessionStorage.getItem(sessionKey);

    if (alreadyArchivedInSession === 'true' || lastArchivedRef.current === currentTurno) {
      return;
    }

    lastArchivedRef.current = currentTurno;
    sessionStorage.setItem(sessionKey, 'true');

    // Carrega histórico atual do LocalStorage
    const savedHistory = localStorage.getItem('ponteiro_history');
    let history = savedHistory ? JSON.parse(savedHistory) : [];

    // Formata os novos registros para armazenamento
    const newRecords = data.map((row) => {
      const turnoName = row.Data_Turno.includes(' ') 
        ? row.Data_Turno.split(' ').slice(1).join('_') 
        : row.Data_Turno;

      const safeId = `${row.Funcao}_${turnoName}`
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

    // Mescla e limita a 1000 registros para otimizar o LocalStorage
    // Remove duplicatas baseadas no ID único (Faina + DataTurno)
    const mergedHistory = [...newRecords, ...history];
    const uniqueHistory = Array.from(new Map(mergedHistory.map(item => [item.id, item])).values())
      .slice(0, 1000);

    localStorage.setItem('ponteiro_history', JSON.stringify(uniqueHistory));
    
    // Dispara evento global para sincronizar outros componentes
    window.dispatchEvent(new Event('ponteiro_history_updated'));
  }, [data]);

  return null;
}
