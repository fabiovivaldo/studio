'use client';

import { useTransition, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { refreshDashboard } from '@/lib/actions';

/**
 * Botão de atualização que suporta clique manual e 
 * atualização automática em todas as horas cheias (XX:00).
 */
export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  // Referência para controlar a última hora que foi atualizada automaticamente
  const lastHourRef = useRef<number>(new Date().getHours());

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refreshDashboard();
    });
  }, []);

  useEffect(() => {
    // Verifica a cada 30 segundos se chegamos em uma hora cheia
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      // Se o minuto for 0 e for uma hora diferente da última registrada, atualiza
      if (currentMinutes === 0 && currentHour !== lastHourRef.current) {
        handleRefresh();
        lastHourRef.current = currentHour;
      }
      
      // Caso o sistema tenha pulado o minuto 00 por algum motivo (ex: aba em sleep), 
      // o controle de 'lastHourRef' garante que ele tente sincronizar assim que possível.
    }, 30000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <Button 
      variant="outline" 
      className="border-accent/30 text-accent hover:bg-accent/10 min-w-[160px] shadow-lg shadow-accent/5"
      onClick={handleRefresh}
      disabled={isPending}
    >
      <RefreshCcw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Atualizando...' : 'Atualizar Dados'}
    </Button>
  );
}
