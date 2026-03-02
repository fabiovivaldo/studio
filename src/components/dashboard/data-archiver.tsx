
'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados.
 * Para atender ao pedido de substituir turnos antigos pelos novos:
 * O ID agora é Funcao + Nome_do_Turno, garantindo que a última "Manhã" sempre substitua a anterior.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const { firestore, user } = useFirebase();

  useEffect(() => {
    if (!firestore || !user || !data.length) return;

    data.forEach((row) => {
      // Extrair apenas o nome do turno (ex: "Manhã") para o ID
      // Isso garante que se o turno volta para "Manhã", ele substitua o registro anterior desse turno
      const turnoName = row.Data_Turno.includes(' ') 
        ? row.Data_Turno.split(' ').slice(1).join('_') 
        : row.Data_Turno;

      const safeId = `${row.Funcao}_${turnoName}`
        .replace(/[/\\#?%*:.|"<>\s]/g, '_')
        .substring(0, 100);
      
      const docRef = doc(firestore, 'ponteiro_data', safeId);
      
      setDocumentNonBlocking(docRef, {
        id: safeId,
        funcao: row.Funcao,
        sinal: row.Sinal,
        original1: row.Original_1,
        temporario1: row.Temporario_1,
        original2: row.Original_2,
        temporario2: row.Temporario_2,
        dataTurno: row.Data_Turno,
        createdAt: serverTimestamp()
      }, { merge: true });
    });
  }, [data, firestore, user]);

  return null;
}
