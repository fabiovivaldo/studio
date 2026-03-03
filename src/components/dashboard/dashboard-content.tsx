'use client';

import React, { useState } from 'react';
import { PonteiroData } from '@/lib/data-service';
import { PonteiroDataTable } from '@/components/dashboard/data-table';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { LastUpdatedDisplay } from '@/components/dashboard/last-updated';
import { FainaPreferencesModal } from '@/components/dashboard/faina-preferences-modal';
import { DynamicFainaCards } from '@/components/dashboard/dynamic-faina-cards';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { 
  HardHat, 
  Settings,
  Wrench,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardContentProps {
  initialData: PonteiroData[];
  lastUpdatedIso: string;
  uniqueFainas: string[];
}

export type ViewMode = 'live' | 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

export function DashboardContent({ initialData, lastUpdatedIso, uniqueFainas }: DashboardContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('live');

  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/10">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-8 py-4">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-bold text-base sm:text-lg tracking-tight text-foreground">
              Monitoramento de Ponteiros
            </h1>
            <Badge variant="secondary" className="w-fit h-5 text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border-green-500/20">
              <Zap className="h-2.5 w-2.5 mr-1 fill-green-500" />
              Tempo Real
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <FainaPreferencesModal 
                availableFainas={uniqueFainas} 
                trigger={
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors">
                    <Settings className="h-5 w-5" />
                  </Button>
                } 
            />
            <div className="hidden lg:flex flex-col items-end mr-4 text-right">
                <span className="text-xs text-muted-foreground">Última Atualização</span>
                <span className="text-xs font-mono font-bold text-accent whitespace-nowrap">
                  <LastUpdatedDisplay date={lastUpdatedIso} />
                </span>
            </div>
            <RefreshButton />
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Minhas Fainas Prioritárias</h3>
            <div className="h-px flex-1 bg-border/50"></div>
          </div>
          <DynamicFainaCards scrapedData={initialData} selectedShift={viewMode} />
        </section>

        <section className="space-y-6">
          <div className="px-1">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Explorador de Registros por Faina</h3>
            </div>
            <PonteiroDataTable liveData={initialData} viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </section>
      </div>
    </main>
  );
}
