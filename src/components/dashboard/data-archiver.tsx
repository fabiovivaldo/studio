'use client';

import { useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

const SHIFT_NAMES = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];

const SHIFT_IDENTIFIER_MAP: { [key: string]: string } = {
  'Madrugada': 'madrugada-p1',
  'Manhã': 'manha-p2',
  'Tarde': 'tarde-p3',
  'Noite': 'noite-p4'
};

/**
 * Componente que arquiva os dados raspados no LocalStorage.
 * A lógica agora apaga todos os dados do período atual e os reescreve
 * para garantir que o histórico seja um reflexo fiel da última atualização.
 */
export function DataArchiver({ data }: DataArchiverProps) {

  useEffect(() => {
    // Se não há dados novos, não faz nada.
    if (!data.length) return;

    // 1. Identifica o turno dos novos dados (Manhã, Tarde, etc.)
    const currentDataTurnoString = data[0].Data_Turno;
    const currentShift = SHIFT_NAMES.find(shift => currentDataTurnoString.includes(shift));

    // Se o turno não for reconhecido, interrompe a execução.
    if (!currentShift) return;

    const shiftIdentifier = SHIFT_IDENTIFIER_MAP[currentShift];
    if (!shiftIdentifier) return;

    // 2. Carrega o histórico atual do LocalStorage.
    const savedHistory = localStorage.getItem('ponteiro_history');
    let history: any[] = savedHistory ? JSON.parse(savedHistory) : [];

    // 3. Filtra o histórico, removendo todos os registros do turno atual.
    // Isso garante que estamos substituindo a lista desse turno por completo.
    const historyOfOtherShifts = history.filter(
      (record: any) => record.shift !== currentShift
    );

    // 4. Formata os novos registros para armazenamento, adicionando o campo 'shift' e o novo ID.
    const newRecordsForCurrentShift = data.map((row) => ({
      id: `${row.Funcao}_${shiftIdentifier}`,
      funcao: row.Funcao,
      sinal: row.Sinal,
      original1: row.Original_1,
      temporario1: row.Temporario_1,
      original2: row.Original_2,
      temporario2: row.Temporario_2,
      dataTurno: row.Data_Turno,
      shift: currentShift, // Adiciona o turno para facilitar a filtragem
      createdAt: new Date().toISOString()
    }));

    // 5. Mescla o histórico dos outros turnos com os novos registros do turno atual.
    const updatedHistory = [...historyOfOtherShifts, ...newRecordsForCurrentShift];
    
    // Salva o histórico atualizado de volta no LocalStorage.
    localStorage.setItem('ponteiro_history', JSON.stringify(updatedHistory));
    
    // Dispara um evento global para que outros componentes (como a tabela) saibam que os dados foram atualizados.
    window.dispatchEvent(new Event('ponteiro_history_updated'));
  }, [data]);

  return null;
}
