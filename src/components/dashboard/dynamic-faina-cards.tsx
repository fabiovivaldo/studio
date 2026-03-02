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
import { Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
}

export function DynamicFainaCards({ scrapedData }: DynamicFainaCardsProps) {
  const { firestore, user } = useFirebase();

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading } = useCollection(preferencesQuery);

  const getAlertStyle = (valueStr: string | undefined, targetStr: string) => {
    if (!valueStr) return { color: '', showIcon: false };
    
    // Remove caracteres não numéricos e converte para número
    const value = parseInt(valueStr.replace(/\D/g, '')) || 0;
    const target = parseInt(targetStr.replace(/\D/g, '')) || 0;
    
    if (target === 0) return { color: '', showIcon: false };
    
    const diff = target - value;
    
    return {
      // Vermelho se faltar 10 ou menos (e for positivo)
      color: (diff <= 10 && diff >= 0) ? 'text-red-500 font-black' : 'text-accent',
      // Ícone se faltar 20 ou menos
      showIcon: diff <= 20 && diff >= 0
    };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (!preferences || preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma preferência configurada. Adicione fainas em <span className="text-accent font-bold">Configurações &gt; Preferências</span> para vê-las aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {preferences.map((pref) => {
        const fainaData = scrapedData.find(d => d.Funcao === pref.faina);
        
        const alert1 = getAlertStyle(fainaData?.Temporario_1, pref.chamada);
        const alert2 = getAlertStyle(fainaData?.Temporario_2, pref.chamada);

        return (
          <Card key={pref.id} className="bg-[#0f1419] border-none shadow-2xl relative overflow-hidden group h-[160px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent shadow-[0_0_15px_rgba(var(--accent),0.5)]"></div>
            
            <div className="p-3 pt-2 space-y-1">
              <div className="flex justify-between items-start">
                <div className="text-xl font-bold text-muted-foreground/80 uppercase tracking-tighter truncate max-w-[80%]">
                  {pref.faina}
                </div>
              </div>

              <div className="flex items-center gap-4 py-0 h-[60px]">
                <div className="text-6xl font-bold text-white tracking-tighter">
                  {pref.chamada}
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/5 border border-accent/20">
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter opacity-80">Sinal</span>
                  <span className="text-lg font-bold text-accent">
                    {fainaData?.Sinal || '+'}
                  </span>
                </div>
              </div>

              {fainaData ? (
                <div className="bg-[#161b22] rounded-lg p-2 grid grid-cols-4 gap-2 border border-white/5">
                  <div className="flex flex-col gap-0">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Original 1</span>
                    <span className="text-lg font-bold text-accent tracking-tighter">{fainaData.Original_1}</span>
                  </div>
                  <div className="flex flex-col gap-0 border-l border-white/5 pl-2 relative">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter flex items-center gap-1">
                      Temp 1 {alert1.showIcon && <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse fill-amber-500/20" />}
                    </span>
                    <span className={cn("text-lg tracking-tighter transition-colors duration-300", alert1.color)}>{fainaData.Temporario_1}</span>
                  </div>
                  <div className="flex flex-col gap-0 border-l border-white/5 pl-2">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Original 2</span>
                    <span className="text-lg font-bold text-accent tracking-tighter">{fainaData.Original_2}</span>
                  </div>
                  <div className="flex flex-col gap-0 border-l border-white/5 pl-2 relative">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter flex items-center gap-1">
                      Temp 2 {alert2.showIcon && <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse fill-amber-500/20" />}
                    </span>
                    <span className={cn("text-lg tracking-tighter transition-colors duration-300", alert2.color)}>{fainaData.Temporario_2}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive/70 italic text-[10px] bg-destructive/5 p-2 rounded-lg border border-destructive/10">
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
