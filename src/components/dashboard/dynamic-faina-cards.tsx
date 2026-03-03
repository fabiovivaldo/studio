
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

type AlertStatus = 'critical' | 'normal';

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

  const getAlertStyle = (valueStr: string | undefined, targetStr: string) => {
    if (!valueStr || !targetStr) return { status: 'normal' as AlertStatus, colorClass: 'text-foreground', showIcon: false };
    const value = parseInt(valueStr.replace(/\D/g, '')) || 0;
    const target = parseInt(targetStr.replace(/\D/g, '')) || 0;
    if (target === 0 || value === 0) return { status: 'normal' as AlertStatus, colorClass: 'text-foreground', showIcon: false };
    
    const diff = Math.abs(value - target);
    
    // Alerta Crítico (Capacete Vermelho) quando está a 10 ou menos da chamada
    if (diff <= 10) return { status: 'critical' as AlertStatus, colorClass: 'text-destructive', showIcon: true };
    
    return { status: 'normal' as AlertStatus, colorClass: 'text-foreground', showIcon: false };
  };

  if (isPrefsLoading || isHistoryLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[180px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-bold">
          Nenhuma faina prioritária. Adicione em Configurações para monitorar.
        </p>
      </div>
    );
  }

  const labelStyle = "text-[11px] font-black text-foreground/40 uppercase tracking-tighter";
  const tinyLabelStyle = "text-[10px] font-black text-foreground/30 uppercase tracking-tighter";

  return (
    <div className="grid grid-cols-1 gap-6">
      {preferences.map((pref) => {
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;

        return (
          <Card key={pref.id} className="bg-card dark:bg-[#0f1419] border-border/50 shadow-xl relative overflow-hidden group flex flex-col min-h-[160px]">
            {/* Barra lateral de destaque */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent z-10"></div>
            
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-end border-b border-border/40 pb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="bg-muted/50 p-1.5 rounded-md shrink-0">
                    <HardHat className="h-4 w-4 text-accent/60" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={labelStyle}>Faina</span>
                    <h2 className="text-xs font-black text-foreground uppercase tracking-tight leading-none mt-1 break-words">
                      {pref.faina}
                    </h2>
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <span className={labelStyle}>Chamada</span>
                  <div className="text-sm font-black text-accent tracking-tighter leading-none mt-1">
                    {pref.chamada}
                  </div>
                </div>
              </div>

              {/* Grid de Turnos - 4 turnos em uma linha */}
              <div className="flex-1 grid grid-cols-4 gap-2 mt-1">
                {SHIFT_ORDER.map((shiftName) => {
                  const shiftData = historyData?.find(d => 
                    d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                  );

                  const isGroup2 = pref.tipo === '2';
                  const valO = isGroup2 ? shiftData?.original2 : shiftData?.original1;
                  const valT = isGroup2 ? shiftData?.temporario2 : shiftData?.temporario1;

                  // Escolha qual valor monitorar com base na preferência (Original ou Temporário)
                  const monitorValue = pref.modo === 'original' ? valO : valT;

                  const alertStyle = getAlertStyle(monitorValue, pref.chamada);

                  const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
                  const diff = monitorNum - targetNum;
                  const hasData = !!shiftData;
                  
                  const isHighlighted = selectedShift === 'live' 
                    ? activeShiftFromData === shiftName 
                    : selectedShift === shiftName;

                  const isCritical = alertStyle.status === 'critical';

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-lg p-2 border transition-all duration-300 flex flex-col gap-1 relative overflow-hidden",
                        hasData 
                          ? "bg-muted/30 border-border/40" 
                          : "bg-muted/5 border-dashed border-border/20 opacity-40",
                        isHighlighted && "border-accent ring-1 ring-accent/30 bg-accent/5",
                        isCritical && "border-destructive ring-2 ring-destructive/30 bg-destructive/5",
                        (isHighlighted || isCritical) && "z-10"
                      )}
                    >
                      <div className="flex justify-between items-center border-b border-border/10 pb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter",
                          isCritical ? "text-destructive" : isHighlighted ? "text-accent" : "text-foreground opacity-60"
                        )}>{shiftName}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        {/* Original O: */}
                        <div className="flex items-center gap-1">
                          <span className={tinyLabelStyle}>O:</span>
                          <span className={cn(
                            "text-[10px] font-bold transition-colors",
                            pref.modo === 'original' ? "text-foreground opacity-90" : "text-foreground opacity-40"
                          )}>
                            {valO || '--'}
                          </span>
                        </div>
                        
                        {/* Ponteiro P: */}
                        <div className="flex items-center gap-1.5">
                          <span className={tinyLabelStyle}>P:</span>
                          <span className={cn(
                            "text-xl font-black leading-none tracking-tighter transition-colors",
                            pref.modo === 'temporario' ? alertStyle.colorClass : "text-foreground opacity-40"
                          )}>
                            {valT || '--'}
                          </span>
                          {pref.modo === 'temporario' && alertStyle.showIcon && (
                            <HardHat className={cn("h-4 w-4 shrink-0", alertStyle.colorClass)} />
                          )}
                          {pref.modo === 'original' && alertStyle.showIcon && (
                             <HardHat className={cn("h-4 w-4 shrink-0", alertStyle.colorClass)} />
                          )}
                        </div>

                        {/* Diferencial Laranja (DE BAIXO) */}
                        <div className="flex items-center justify-between min-h-[20px]">
                          {hasData && (
                            <div className={cn(
                              "transition-all",
                              diff === 0 && "opacity-0"
                            )}>
                              <span className="text-[15px] font-black text-orange-500 leading-none whitespace-nowrap">
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </div>
                          )}
                          
                          <span className={cn(
                            "text-[10px] font-black ml-auto",
                            shiftData?.sinal === '-' ? "text-destructive" : "text-green-500"
                          )}>
                            {shiftData?.sinal || (hasData ? '+' : '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
