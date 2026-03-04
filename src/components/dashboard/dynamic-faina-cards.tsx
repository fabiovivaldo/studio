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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-[120px] bg-muted/50 rounded-xl border border-border"></div>
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
  const tinyLabelStyle = "text-[9px] font-bold text-muted-foreground/40 uppercase";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {preferences.map((pref) => {
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
        const modoAtivo = pref.modo || 'temporario';

        return (
          <Card key={pref.id} className="bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col group h-full">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 z-10"></div>
            
            <div className="p-4 pb-2 flex items-start gap-6">
              <div className="space-y-0.5">
                <span className={labelStyle}>Chamada</span>
                <div className="text-xl font-black text-blue-600 leading-none">
                  {pref.chamada}
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className={labelStyle}>Faina</span>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight break-words truncate">
                  {pref.faina}
                </h2>
              </div>
            </div>

            <div className="px-4 pb-4 grid grid-cols-4 gap-2 w-full mt-1">
              {SHIFT_ORDER.map((shiftName) => {
                const shiftData = historyData?.find(d => 
                  d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                );

                const isGroup2 = pref.tipo === '2';
                const valO = isGroup2 ? shiftData?.original2 : shiftData?.original1;
                const valT = isGroup2 ? shiftData?.temporario2 : shiftData?.temporario1;

                const monitorValue = modoAtivo === 'original' ? valO : valT;
                const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
                const diff = monitorNum - targetNum;
                const absDiff = Math.abs(diff);
                
                // Lógica de alertas
                const isCritical = absDiff <= 10 && !!shiftData;
                const isWarning = absDiff > 10 && absDiff <= 20 && !!shiftData;

                const isHighlighted = selectedShift === 'live' 
                  ? activeShiftFromData === shiftName 
                  : selectedShift === shiftName;

                return (
                  <div 
                    key={shiftName} 
                    className={cn(
                      "rounded-lg p-2 transition-all duration-200 flex flex-col gap-1 relative flex-1 min-w-0 h-full",
                      !shiftData && "opacity-30 bg-muted/5 border-dashed border-border/20",
                      shiftData && "bg-muted/10",
                      
                      // Moldura EXTERNA (Alertas via Ring - 3px)
                      isCritical && "ring-[3px] ring-destructive bg-destructive/5",
                      isWarning && "ring-[3px] ring-orange-500 bg-orange-500/5",
                      
                      // Moldura INTERNA (Turno Atual via Border - 2px)
                      isHighlighted ? "border-2 border-blue-600 z-10 bg-blue-600/5" : "border-2 border-transparent",
                      
                      // Borda padrão se não houver destaque nem alerta
                      !isHighlighted && !isCritical && !isWarning && "border-2 border-border/40"
                    )}
                  >
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest truncate",
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

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className={tinyLabelStyle}>O:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'original' 
                            ? "text-base font-black text-foreground leading-none" 
                            : "text-[10px] font-bold text-muted-foreground/40",
                          modoAtivo === 'original' && isCritical && "text-destructive",
                          modoAtivo === 'original' && isWarning && "text-orange-500"
                        )}>
                          {valO || '--'}
                        </span>
                        {modoAtivo === 'original' && (isCritical || isWarning) && (
                          <HardHat className={cn("h-3 w-3", isCritical ? "text-destructive" : "text-orange-500")} />
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={tinyLabelStyle}>P:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'temporario' 
                            ? "text-base font-black text-foreground leading-none" 
                            : "text-[10px] font-bold text-muted-foreground/40",
                          modoAtivo === 'temporario' && isCritical && "text-destructive",
                          modoAtivo === 'temporario' && isWarning && "text-orange-500"
                        )}>
                          {valT || '--'}
                        </span>
                        {modoAtivo === 'temporario' && (isCritical || isWarning) && (
                          <HardHat className={cn("h-3 w-3", isCritical ? "text-destructive" : "text-orange-500")} />
                        )}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <span className="text-[18px] font-black text-orange-600 tracking-tighter leading-none block">
                        {shiftData ? (diff > 0 ? `+${diff}` : diff) : ''}
                      </span>
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
