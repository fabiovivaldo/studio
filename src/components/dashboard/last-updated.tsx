
'use client';

import { useState, useEffect } from 'react';

interface LastUpdatedProps {
  date: string;
}

export function LastUpdatedDisplay({ date }: LastUpdatedProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    // Executa apenas no cliente após a hidratação para capturar o fuso horário local do usuário
    const d = new Date(date);
    setFormattedDate(
      d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );
  }, [date]);

  if (!formattedDate) {
    return <span className="opacity-50 animate-pulse">Carregando...</span>;
  }

  return <span>{formattedDate}</span>;
}
