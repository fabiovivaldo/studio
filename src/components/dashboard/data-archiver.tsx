
'use client';

import { useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PonteiroData } from '@/lib/data-service';

interface DataArchiverProps {
  data: PonteiroData[];
}

/**
 * Componente que arquiva automaticamente os dados raspados.
 * Otimizado para evitar "Quota Exceeded" no Firestore.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const { firestore, user } = useFirebase();
  const lastArchivedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firestore || !user || !data.length) return;

    // Pega o identificador do turno atual (ex: "03/03/2026 Manhã")
    const currentTurno = data[0].Data_Turno;

    // Verifica se já arquivamos este turno específico nesta sessão do navegador
    // ou se o turno é o mesmo que acabamos de processar
    const sessionKey = `archived_${currentTurno.replace(/\s+/g, '_')}`;
    const alreadyArchivedInSession = sessionStorage.getItem(sessionKey);

    if (alreadyArchivedInSession === 'true' || lastArchivedRef.current === currentTurno) {
      return;
    }

    // Marca como processado para evitar loops e excesso de escrita
    lastArchivedRef.current = currentTurno;
    sessionStorage.setItem(sessionKey, 'true');

    // Executa o arquivamento de cada linha
    data.forEach((row) => {
      // Extrair apenas o nome do turno (ex: "Manhã") para o ID
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
