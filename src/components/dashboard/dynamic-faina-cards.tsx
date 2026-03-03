'use client';

import React from 'react';
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

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
}

type AlertStatus = 'critical' | 'warning' | 'normal';

const SHIFTS = ['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const;

export function DynamicFainaCards({ scrapedData }: DynamicFainaCardsProps) {
  const { firestore, user } = useFirebase();

  // Buscar preferências do usuário
  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading: isPrefsLoading } = useCollection(preferencesQuery);

  // Buscar dados históricos do Firestore para compor os 4 turnos
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
    if (target > value) return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };

    const diff = Math.abs(value - target);
    if (diff <= 10) return { status: 'critical' as AlertStatus, iconColor: 'text-destructive', showIcon: true };
    else if (diff <= 20) return { status: 'warning' as AlertStatus, iconColor: 'text-yellow-500', showIcon: true };
    
    return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
  };

  if (isPrefsLoading || isHistoryLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-[280px] bg-muted/50 rounded-xl border border-border"></div>
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

  // Estilo padrão para rótulos: Preto no tema claro, Branco no tema escuro, Fonte Grande e Negrito
  const labelStyle = "text-[12px] font-black text-black dark:text-white uppercase tracking-tighter";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {preferences.map((pref) => {
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;

        return (
          <Card key={pref.id} className="bg-card dark:bg-[#0f1419] border-border/50 shadow-xl relative overflow-hidden group min-h-[280px] flex flex-col">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent shadow-[0_0_15px_hsl(var(--accent)/0.5)] z-10"></div>
            
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              {/* Header do Card */}
              <div className="flex justify-between items-end border-b border-border/40 pb-3">
                <div className="flex flex-col flex-1">
                  <span className={labelStyle}>Faina</span>
                  <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-tight leading-none mt-1">
                    {pref.faina}
                  </h2>
                </div>
                <div className="text-right ml-4">
                  <span className={labelStyle}>Chamada</span>
                  <div className="text-3xl font-black text-accent tracking-tighter leading-none mt-1">
                    {pref.chamada}
                  </div>
                </div>
              </div>

              {/* Grid de Turnos */}
              <div className="flex-1 flex flex-col gap-2 mt-1">
                {SHIFTS.map((shiftName) => {
                  const shiftData = historyData?.find(d => 
                    d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                  );

                  const isGroup2 = pref.tipo === '2';
                  const valO = isGroup2 ? shiftData?.original2 : shiftData?.original1;
                  const valT = isGroup2 ? shiftData?.temporario2 : shiftData?.temporario1;

                  const alertO = getAlertStyle(valO, pref.chamada);
                  const alertT = getAlertStyle(valT, pref.chamada);

                  const origNum = parseInt(valO?.replace(/\D/g, '') || '0') || 0;
                  const tempNum = parseInt(valT?.replace(/\D/g, '') || '0') || 0;
                  
                  const diffOrig = origNum - targetNum;
                  const diffTemp = tempNum - targetNum;

                  const hasData = !!shiftData;

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-xl p-2 border transition-all duration-300 grid grid-cols-12 items-center gap-3",
                        hasData 
                          ? "bg-muted/30 border-border/40" 
                          : "bg-muted/5 border-dashed border-border/20 opacity-40"
                      )}
                    >
                      {/* Coluna Turno */}
                      <div className="col-span-3 flex flex-col">
                        <span className={cn(labelStyle, "text-[10px]")}>Turno</span>
                        <span className="text-[14px] font-black text-accent uppercase leading-tight">{shiftName}</span>
                      </div>

                      {/* Coluna Sinal */}
                      <div className="col-span-1 flex flex-col items-center">
                        <span className={cn(labelStyle, "text-[10px]")}>S</span>
                        <span className={cn(
                          "text-[16px] font-black",
                          shiftData?.sinal === '-' ? "text-destructive" : "text-green-500"
                        )}>
                          {shiftData?.sinal || '+'}
                        </span>
                      </div>

                      {/* Coluna Original */}
                      <div className="col-span-4 flex flex-col border-l border-border/20 pl-3">
                        <span className={cn(labelStyle, "text-[11px]")}>Orig {isGroup2 ? '2' : '1'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-foreground">{valO || '--'}</span>
                          {hasData && diffOrig >= 0 && (
                            <span className="text-[12px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/30 shadow-sm">
                              +{diffOrig}
                            </span>
                          )}
                          {alertO.showIcon && <AlertTriangle className={cn("h-4 w-4 animate-pulse", alertO.iconColor)} />}
                        </div>
                      </div>

                      {/* Coluna Temp */}
                      <div className="col-span-4 flex flex-col border-l border-border/20 pl-3">
                        <span className={cn(labelStyle, "text-[11px]")}>Temp {isGroup2 ? '2' : '1'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-foreground">{valT || '--'}</span>
                          {hasData && diffTemp >= 0 && (
                            <span className="text-[12px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/30 shadow-sm">
                              +{diffTemp}
                            </span>
                          )}
                          {alertT.showIcon && <AlertTriangle className={cn("h-4 w-4 animate-pulse", alertT.iconColor)} />}
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
