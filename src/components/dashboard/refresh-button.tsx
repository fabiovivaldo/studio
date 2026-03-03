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
    }, 30000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <Button 
      variant="outline" 
      size="icon"
      className="border-accent/30 text-accent hover:bg-accent/10 shadow-lg shadow-accent/5 h-9 w-9 transition-all active:scale-95"
      onClick={handleRefresh}
      disabled={isPending}
      title="Atualizar Dados"
    >
      <RefreshCcw className={`h-5 w-5 ${isPending ? 'animate-spin' : ''}`} />
      <span className="sr-only">Atualizar Dados</span>
    </Button>
  );
}
