
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
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from './dashboard-content';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
  selectedShift?: ViewMode;
}

type AlertStatus = 'critical' | 'warning' | 'normal';

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
      limit(200)
    );
  }, [firestore]);

  const { data: historyData, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const getAlertStyle = (valueStr: string | undefined, targetStr: string) => {
    if (!valueStr || !targetStr) return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
    const value = parseInt(valueStr.replace(/\D/g, '')) || 0;
    const target = parseInt(targetStr.replace(/\D/g, '')) || 0;
    if (target === 0 || value === 0) return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
    const diff = Math.abs(value - target);
    if (diff <= 5) return { status: 'critical' as AlertStatus, iconColor: 'text-destructive', showIcon: true };
    else if (diff <= 15) return { status: 'warning' as AlertStatus, iconColor: 'text-yellow-500', showIcon: true };
    return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
  };

  if (isPrefsLoading || isHistoryLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-[200px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-bold">
          Nenhuma preferência configurada. Adicione fainas em Configurações para vê-las aqui.
        </p>
      </div>
    );
  }

  // Estilo de Alto Contraste para Títulos e Rótulos (Preto no Claro / Branco no Escuro)
  const labelStyle = "text-[11px] font-black text-foreground uppercase tracking-tighter";
  const tinyLabelStyle = "text-[10px] font-black text-foreground uppercase opacity-80 tracking-tighter";

  return (
    <div className="grid grid-cols-1 gap-6">
      {preferences.map((pref) => {
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;

        return (
          <Card key={pref.id} className="bg-card dark:bg-[#0f1419] border-border/50 shadow-xl relative overflow-hidden group flex flex-col min-h-[200px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent shadow-[0_0_15px_hsl(var(--accent)/0.5)] z-10"></div>
            
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-end border-b border-border/40 pb-2">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={labelStyle}>Faina</span>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tight leading-none mt-1 break-words">
                    {pref.faina}
                  </h2>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <span className={labelStyle}>Rodízio</span>
                  <div className="text-sm font-black text-accent tracking-tighter leading-none mt-1">
                    {pref.chamada}
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-4 gap-2 mt-1">
                {SHIFT_ORDER.map((shiftName) => {
                  const shiftData = historyData?.find(d => 
                    d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                  );

                  const isGroup2 = pref.tipo === '2';
                  const valO = isGroup2 ? shiftData?.original2 : shiftData?.original1;
                  const valT = isGroup2 ? shiftData?.temporario2 : shiftData?.temporario1;

                  const alertT = getAlertStyle(valT, pref.chamada);

                  const tempNum = parseInt(valT?.replace(/\D/g, '') || '0') || 0;
                  const diffTemp = tempNum - targetNum;
                  const hasData = !!shiftData;
                  const isDecreasing = shiftData?.sinal === '-';
                  
                  // Lógica Inteligente de Diferença solicitada:
                  // 1. Mostrar se o ponteiro subir além do número (Sinal + e Temp > Rodizio)
                  // 2. Mostrar se estiver descendo (Sinal -)
                  const showDiffT = hasData && (isDecreasing || (tempNum > targetNum)) && diffTemp !== 0;

                  const isHighlighted = selectedShift === 'live' 
                    ? activeShiftFromData === shiftName 
                    : selectedShift === shiftName;

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-lg p-2 border transition-all duration-300 flex flex-col justify-between gap-1 relative overflow-hidden",
                        hasData 
                          ? "bg-muted/30 border-border/40" 
                          : "bg-muted/5 border-dashed border-border/20 opacity-40",
                        isHighlighted && "border-accent ring-2 ring-accent/20 bg-accent/5 shadow-[inset_0_0_12px_rgba(var(--accent-rgb),0.05)]",
                        isHighlighted && "scale-[1.02] z-10"
                      )}
                    >
                      {isHighlighted && (
                        <div className="absolute top-0 right-0 p-0.5">
                           <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_hsl(var(--accent))]"></div>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b border-border/10 pb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter",
                          isHighlighted ? "text-accent" : "text-foreground opacity-60"
                        )}>{shiftName}</span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 opacity-50">
                          <span className={tinyLabelStyle}>O:</span>
                          <span className="text-[10px] font-bold text-foreground">{valO || '--'}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={tinyLabelStyle}>Temp</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Valor Principal em ALTO CONTRASTE (Preto/Branco) */}
                            <span className="text-2xl font-black leading-none tracking-tighter text-foreground">
                              {valT || '--'}
                            </span>
                            
                            {/* Diferença em cor DISTINTA (Laranja/Âmbar) para não confundir */}
                            {showDiffT && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-0.5 rounded border border-amber-500/20 shadow-sm whitespace-nowrap">
                                {diffTemp > 0 ? `+${diffTemp}` : diffTemp}
                              </span>
                            )}

                            <div className="flex items-center gap-0.5 ml-0.5">
                               <span className={cn(
                                "text-xs font-black",
                                shiftData?.sinal === '-' ? "text-destructive" : "text-green-500"
                              )}>
                                {shiftData?.sinal || '+'}
                              </span>
                              {alertT.showIcon && <AlertTriangle className={cn("h-3 w-3 animate-pulse", alertT.iconColor)} />}
                            </div>
                          </div>
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
