'use client';

import React from 'react';
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase
} from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
}

type AlertStatus = 'critical' | 'warning' | 'normal';

export function DynamicFainaCards({ scrapedData }: DynamicFainaCardsProps) {
  const { firestore, user } = useFirebase();

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading } = useCollection(preferencesQuery);

  const getAlertStyle = (valueStr: string | undefined, targetStr: string) => {
    if (!valueStr || !targetStr) return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
    
    const value = parseInt(valueStr.replace(/\D/g, '')) || 0;
    const target = parseInt(targetStr.replace(/\D/g, '')) || 0;
    
    if (target === 0 || value === 0) return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
    
    // Alerta só se o valor atual for igual ou maior que a chamada
    if (target > value) {
      return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
    }

    const diff = Math.abs(value - target);
    
    if (diff <= 10) {
      return { status: 'critical' as AlertStatus, iconColor: 'text-destructive', showIcon: true };
    } else if (diff <= 20) {
      return { status: 'warning' as AlertStatus, iconColor: 'text-yellow-500', showIcon: true };
    }
    
    return { status: 'normal' as AlertStatus, iconColor: '', showIcon: false };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[185px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma preferência configurada. Adicione fainas em Configurações para vê-las aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {preferences.map((pref) => {
        const fainaData = scrapedData.find(d => d.Funcao === pref.faina);
        const isGroup2 = pref.tipo === '2';
        
        const origVal = isGroup2 ? fainaData?.Original_2 : fainaData?.Original_1;
        const tempVal = isGroup2 ? fainaData?.Temporario_2 : fainaData?.Temporario_1;
        
        const alertO = getAlertStyle(origVal, pref.chamada);
        const alertT = getAlertStyle(tempVal, pref.chamada);

        const worstStatus: AlertStatus = (alertO.status === 'critical' || alertT.status === 'critical') 
          ? 'critical' 
          : (alertO.status === 'warning' || alertT.status === 'warning') 
            ? 'warning' 
            : 'normal';

        const barColorClass = worstStatus === 'critical' 
          ? "bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" 
          : worstStatus === 'warning'
            ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse"
            : "bg-accent shadow-[0_0_15px_hsl(var(--accent)/0.5)]";

        const turnoText = fainaData?.Data_Turno?.includes(' ') 
          ? fainaData.Data_Turno.split(' ').slice(1).join(' ') 
          : fainaData?.Data_Turno;

        const sinalValue = fainaData?.Sinal || '+';

        return (
          <Card key={pref.id} className="bg-card border-border/50 shadow-2xl relative overflow-hidden group h-[185px]">
            <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-all duration-500 z-10", barColorClass)}></div>
            
            <div className="p-4 pt-3 space-y-2 h-full flex flex-col">
              <div className="flex justify-between items-start">
                <div className="text-base font-bold text-muted-foreground/80 uppercase tracking-tighter truncate max-w-[80%]">
                  {pref.faina}
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                <div className="text-3xl font-black text-foreground tracking-tighter">
                  {pref.chamada}
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/5 border border-accent/20">
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter opacity-80">Sinal</span>
                  <span className={cn(
                    "text-xl font-black transition-colors duration-300",
                    sinalValue === '-' ? "text-destructive" : "text-green-500"
                  )}>
                    {sinalValue}
                  </span>
                </div>

                {turnoText && (
                  <div className="flex flex-col ml-auto text-right">
                    <span className="text-sm font-black text-muted-foreground/40 uppercase tracking-tighter">Turno</span>
                    <span className="text-lg font-black text-accent whitespace-nowrap">
                      {turnoText}
                    </span>
                  </div>
                )}
              </div>

              {fainaData ? (
                <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-4 border border-border/10 mt-auto mb-1">
                  <div className="flex flex-col gap-0 relative">
                    <span className="text-sm font-bold text-muted-foreground/50 uppercase tracking-tighter">
                      Original {isGroup2 ? '2' : '1'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl tracking-tighter text-accent font-bold">
                        {origVal}
                      </span>
                      {alertO.showIcon && <AlertTriangle className={cn("h-4 w-4 animate-bounce", alertO.iconColor)} />}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-0 border-l border-border/10 pl-4 relative">
                    <span className="text-sm font-bold text-muted-foreground/50 uppercase tracking-tighter">
                      Temp {isGroup2 ? '2' : '1'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl tracking-tighter text-accent font-bold">
                        {tempVal}
                      </span>
                      {alertT.showIcon && <AlertTriangle className={cn("h-4 w-4 animate-bounce", alertT.iconColor)} />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive/70 italic text-[10px] bg-destructive/5 p-2 rounded-lg border border-destructive/10 mt-auto">
                  <Zap className="h-3 w-3" />
                  <span>Não encontrado nos dados atuais</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
