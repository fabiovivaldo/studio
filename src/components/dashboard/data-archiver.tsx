
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
 * Componente invisível que arquiva automaticamente os dados raspados no Firestore.
 * Usa um ID composto (Funcao + Data_Turno) para evitar duplicatas.
 */
export function DataArchiver({ data }: DataArchiverProps) {
  const { firestore, user } = useFirebase();

  useEffect(() => {
    if (!firestore || !user || !data.length) return;

    // Arquivar cada linha de dados de forma não bloqueante
    data.forEach((row) => {
      // Criar um ID amigável e único para o documento
      const safeId = `${row.Funcao}_${row.Data_Turno}`
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
