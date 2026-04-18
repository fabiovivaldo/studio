'use client';

import { useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados no LocalStorage.
 * A lógica agora apaga os dados do período atual e os reescreve para
 * garantir que o histórico seja um reflexo fiel da última atualização.
 */
export function DataArchiver({ data }: DataArchiverProps) {

  useEffect(() => {
    // Se não há dados novos, não faz nada.
    if (!data.length) return;

    // Pega o identificador do turno atual a partir dos novos dados.
    const currentDataTurno = data[0].Data_Turno;

    // Carrega histórico atual do LocalStorage.
    const savedHistory = localStorage.getItem('ponteiro_history');
    let history = savedHistory ? JSON.parse(savedHistory) : [];

    // Filtra o histórico, removendo todos os registros do turno atual.
    // Isso garante que fainas removidas da lista ao vivo também sejam removidas do histórico.
    const historyOfOtherTurnos = history.filter(
      (record: any) => record.dataTurno !== currentDataTurno
    );

    // Formata os novos registros para armazenamento.
    const newRecordsForCurrentTurno = data.map((row) => {
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

    // Mescla o histórico dos outros turnos com os novos registros do turno atual.
    const updatedHistory = [...historyOfOtherTurnos, ...newRecordsForCurrentTurno];
    
    // Ordena por data de criação (mais novos primeiro) e limita a 1000 registros.
    const sortedAndSlicedHistory = updatedHistory
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 1000);

    localStorage.setItem('ponteiro_history', JSON.stringify(sortedAndSlicedHistory));
    
    // Dispara evento global para sincronizar outros componentes.
    window.dispatchEvent(new Event('ponteiro_history_updated'));
  }, [data]);

  return null;
}
