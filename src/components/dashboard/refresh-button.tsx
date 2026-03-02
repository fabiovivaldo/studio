'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { refreshDashboard } from '@/lib/actions';

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshDashboard();
    });
  };

  return (
    <Button 
      variant="outline" 
      className="border-accent/30 text-accent hover:bg-accent/10 min-w-[140px]"
      onClick={handleRefresh}
      disabled={isPending}
    >
      <RefreshCcw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Atualizando...' : 'Refresh View'}
    </Button>
  );
}
