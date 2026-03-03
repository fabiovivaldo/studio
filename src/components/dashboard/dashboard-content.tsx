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
  LayoutDashboard as LayoutIcon, 
  Settings,
  LogOut,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardContentProps {
  initialData: PonteiroData[];
  lastUpdatedIso: string;
  uniqueFainas: string[];
}

export type ViewMode = 'live' | 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

export function DashboardContent({ initialData, lastUpdatedIso, uniqueFainas }: DashboardContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('live');

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-headline font-bold text-xl tracking-tight text-foreground">
              Ponteiro<span className="text-accent">Scope</span>
            </h1>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-8 mt-4">
          <nav className="space-y-1">
            <NavItem icon={LayoutIcon} label="Painel" active />
          </nav>

          <div className="space-y-4">
            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configurações</p>
            <nav className="space-y-1">
              <FainaPreferencesModal availableFainas={uniqueFainas} />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/10">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Monitoramento de Ponteiros</h2>
            <div className="flex items-center gap-2">
               <h1 className="text-2xl font-bold">Dashboard OGMOPR</h1>
               <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Tempo Real</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <FainaPreferencesModal 
                availableFainas={uniqueFainas} 
                trigger={
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors">
                    <Settings className="h-5 w-5" />
                  </Button>
                } 
             />
             <div className="hidden md:flex flex-col items-end mr-4 text-right">
                <span className="text-xs text-muted-foreground">Última Atualização</span>
                <span className="text-xs font-mono font-bold text-accent whitespace-nowrap">
                   <LastUpdatedDisplay date={lastUpdatedIso} />
                </span>
             </div>
             <RefreshButton />
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-12">
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
    </>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
      active 
        ? 'bg-accent/10 text-accent' 
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    }`}>
      <Icon className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"></span>}
    </button>
  );
}