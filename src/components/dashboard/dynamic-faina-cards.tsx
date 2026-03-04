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
          <div key={i} className="h-[180px] bg-muted/50 rounded-xl border border-border"></div>
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
          <Card key={pref.id} className="bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col group">
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

            <div className="px-4 pb-4 grid grid-cols-4 gap-2 w-full mt-2">
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
                
                const isCritical = Math.abs(diff) <= 10 && !!shiftData;

                const isHighlighted = selectedShift === 'live' 
                  ? activeShiftFromData === shiftName 
                  : selectedShift === shiftName;

                return (
                  <div 
                    key={shiftName} 
                    className={cn(
                      "rounded-lg p-2 border transition-all duration-200 flex flex-col gap-1.5 relative",
                      !shiftData && "opacity-30 bg-muted/5 border-dashed",
                      shiftData && "bg-muted/10 border-border/40",
                      isHighlighted && "border-blue-600 ring-1 ring-blue-600/30 bg-blue-600/5",
                      isCritical && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest truncate",
                          isHighlighted ? "text-blue-600" : "text-muted-foreground/60"
                        )}>
                          {shiftName}
                        </span>
                        {shiftData?.sinal && (
                          <span className={cn(
                            "text-[10px] font-black leading-none",
                            shiftData.sinal === '-' ? "text-destructive" : "text-green-500"
                          )}>
                            {shiftData.sinal}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className={tinyLabelStyle}>O:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'original' 
                            ? "text-base font-black text-foreground leading-none" 
                            : "text-[10px] font-bold text-muted-foreground/40",
                          modoAtivo === 'original' && isCritical && "text-destructive"
                        )}>
                          {valO || '--'}
                        </span>
                        {modoAtivo === 'original' && isCritical && (
                          <HardHat className="h-3 w-3 text-destructive" />
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={tinyLabelStyle}>P:</span>
                        <span className={cn(
                          "transition-all duration-200",
                          modoAtivo === 'temporario' 
                            ? "text-base font-black text-foreground leading-none" 
                            : "text-[10px] font-bold text-muted-foreground/40",
                          modoAtivo === 'temporario' && isCritical && "text-destructive"
                        )}>
                          {valT || '--'}
                        </span>
                        {modoAtivo === 'temporario' && isCritical && (
                          <HardHat className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/5">
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