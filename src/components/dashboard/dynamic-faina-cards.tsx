'use client';

import React, { useMemo } from 'react';
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase
} from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from './dashboard-content';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
  selectedShift?: ViewMode;
}

const SHIFT_ORDER = ['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const;

export function DynamicFainaCards({ scrapedData, selectedShift = 'live' }: DynamicFainaCardsProps) {
  const { firestore, user } = useFirebase();

  // Identifica o turno ativo nos dados raspados agora
  const activeShiftFromData = useMemo(() => {
    if (!scrapedData.length) return null;
    const turnoStr = scrapedData[0].Data_Turno;
    return SHIFT_ORDER.find(s => turnoStr.includes(s));
  }, [scrapedData]);

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading: isPrefsLoading } = useCollection(preferencesQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'ponteiro_data'), 
      orderBy('createdAt', 'desc'), 
      limit(1000) 
    );
  }, [firestore]);

  const { data: historyData, isLoading: isHistoryLoading } = useCollection(historyQuery);

  if (isPrefsLoading || isHistoryLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[200px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-bold italic">
          Nenhuma faina prioritária configurada.
        </p>
      </div>
    );
  }

  const labelStyle = "text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider";
  const tinyLabelStyle = "text-[11px] font-bold text-muted-foreground/40 uppercase";

  return (
    <div className="grid grid-cols-1 gap-6">
      {preferences.map((pref) => {
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
        // Fallback para modo se estiver indefinido (para fainas antigas)
        const modoAtivo = pref.modo || 'temporario';

        return (
          <Card key={pref.id} className="bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col min-h-[180px]">
            {/* Barra lateral azul da imagem */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 z-10"></div>
            
            <div className="p-6 pb-2 flex items-start gap-12">
              <div className="space-y-1">
                <span className={labelStyle}>Chamada</span>
                <div className="text-xl font-black text-blue-600 leading-none">
                  {pref.chamada}
                </div>
              </div>
              <div className="space-y-1">
                <span className={labelStyle}>Faina</span>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                  {pref.faina}
                </h2>
              </div>
            </div>

            <div className="p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SHIFT_ORDER.map((shiftName) => {
                const shiftData = historyData?.find(d => 
                  d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                );

                const isGroup2 = pref.tipo === '2';
                const valO = isGroup2 ? shiftData?.original2 : shiftData?.original1;
                const valT = isGroup2 ? shiftData?.temporario2 : shiftData?.temporario1;

                // Valor monitorado para o alerta
                const monitorValue = modoAtivo === 'original' ? valO : valT;
                const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
                const diff = monitorNum - targetNum;
                
                // Alerta crítico: diferença de 10 ou menos
                const isCritical = Math.abs(diff) <= 10 && !!shiftData;

                const isHighlighted = selectedShift === 'live' 
                  ? activeShiftFromData === shiftName 
                  : selectedShift === shiftName;

                return (
                  <div 
                    key={shiftName} 
                    className={cn(
                      "rounded-xl p-4 border transition-all duration-200 flex flex-col gap-2 relative",
                      !shiftData && "opacity-30 bg-muted/5 border-dashed",
                      shiftData && "bg-muted/10 border-border/40",
                      isHighlighted && "border-blue-600 ring-1 ring-blue-600/30 bg-blue-600/5",
                      isCritical && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isHighlighted ? "text-blue-600" : "text-muted-foreground/60"
                      )}>
                        {shiftName}
                      </span>
                      {shiftData?.sinal && (
                        <span className={cn(
                          "text-[12px] font-black leading-none",
                          shiftData.sinal === '-' ? "text-destructive" : "text-green-500"
                        )}>
                          {shiftData.sinal}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-1 flex-1">
                      {/* ORIGINAL */}
                      <div className="flex items-center gap-2">
                        <span className={tinyLabelStyle}>O:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'original' 
                            ? "text-xl font-black text-foreground" 
                            : "text-sm font-bold text-muted-foreground/40",
                          modoAtivo === 'original' && isCritical && "text-destructive"
                        )}>
                          {valO || '--'}
                        </span>
                        {modoAtivo === 'original' && isCritical && (
                          <HardHat className="h-4 w-4 text-destructive" />
                        )}
                      </div>

                      {/* PONTEIRO */}
                      <div className="flex items-center gap-2">
                        <span className={tinyLabelStyle}>P:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'temporario' 
                            ? "text-xl font-black text-foreground" 
                            : "text-sm font-bold text-muted-foreground/40",
                          modoAtivo === 'temporario' && isCritical && "text-destructive"
                        )}>
                          {valT || '--'}
                        </span>
                        {modoAtivo === 'temporario' && isCritical && (
                          <HardHat className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-end border-t border-border/10 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-black text-orange-600 tracking-tighter leading-none">
                          {shiftData ? (diff > 0 ? `+${diff}` : diff) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
