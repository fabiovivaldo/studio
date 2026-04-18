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
  Zap,
  CloudMoon,
  Sunrise,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  List,
  Ship
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { ShipList } from '@/components/dashboard/ship-list';

interface DashboardContentProps {
  initialData: PonteiroData[];
  lastUpdatedIso: string;
  uniqueFainas: string[];
}

export type ViewMode = 'live' | 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

const SHIFT_CONFIG = [
  { id: 'Manhã', label: '07X13', icon: Sunrise, color: 'text-orange-500' },
  { id: 'Tarde', label: '13X19', icon: Sun, color: 'text-yellow-500' },
  { id: 'Noite', label: '19X01', icon: Moon, color: 'text-blue-500' },
  { id: 'Madrugada', label: '01X07', icon: CloudMoon, color: 'text-indigo-500' },
] as const;

export function DashboardContent({ initialData, lastUpdatedIso, uniqueFainas }: DashboardContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [isShipListVisible, setIsShipListVisible] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/10">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-8 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h1 className="font-headline font-bold text-base sm:text-lg tracking-tight text-foreground">
                PONTEIRO
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
          
          {/* Seletor de Período agora fixo no header */}
          <div className="mt-6">
            <div className="flex items-center gap-2 px-1 mb-3">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selecione o Período</h4>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Button 
                variant={viewMode === 'live' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setViewMode('live')}
                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9 flex-shrink-0"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                REAL
              </Button>
              
              {SHIFT_CONFIG.map((shift) => (
                <Button 
                  key={shift.id}
                  variant={viewMode === shift.id ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => setViewMode(shift.id as any)}
                  className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9 flex-shrink-0"
                >
                  <shift.icon className={cn("h-3.5 w-3.5 mr-1", viewMode === shift.id ? "" : shift.color)} />
                  {shift.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Legenda de Cores */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Até 10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Até 20</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Até 30</span>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lista Navio</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsShipListVisible(!isShipListVisible)}
                className={cn(
                  "h-8 rounded-xl font-black text-[9px] uppercase tracking-widest px-3 transition-all",
                  isShipListVisible
                    ? "bg-accent/10 border-accent/70 text-accent shadow-lg shadow-accent/20"
                    : "border-accent/20 text-accent hover:bg-accent/5"
                )}
              >
                {isShipListVisible ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    FECHAR LISTA
                  </>
                ) : (
                  <>
                    <List className="h-3 w-3 mr-1" />
                    ABRIR LISTA
                  </>
                )}
              </Button>
            </div>
            
            {isShipListVisible && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <ShipList />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="px-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Explorador de Registros por Faina</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTableVisible(!isTableVisible)}
                className={cn(
                  "h-8 rounded-xl font-black text-[9px] uppercase tracking-widest px-3 transition-all",
                  isTableVisible
                    ? "bg-accent/10 border-accent/70 text-accent shadow-lg shadow-accent/20"
                    : "border-accent/20 text-accent hover:bg-accent/5"
                )}
              >
                {isTableVisible ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    FECHAR LISTA
                  </>
                ) : (
                  <>
                    <List className="h-3 w-3 mr-1" />
                    ABRIR LISTA
                  </>
                )}
              </Button>
            </div>
            
            {isTableVisible && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <PonteiroDataTable liveData={initialData} viewMode={viewMode} />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
