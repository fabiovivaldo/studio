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
    if (!valueStr || !targetStr) return { color: 'text-accent', showIcon: false };
    
    // Extrair apenas números para comparação
    const value = parseInt(valueStr.replace(/\D/g, '')) || 0;
    const target = parseInt(targetStr.replace(/\D/g, '')) || 0;
    
    if (target === 0 || value === 0) return { color: 'text-accent', showIcon: false };
    
    const diff = Math.abs(target - value);
    
    return {
      // Vermelho se faltar 10 ou menos
      color: diff <= 10 ? 'text-destructive font-black' : 'text-accent',
      // Ícone se faltar 20 ou menos
      showIcon: diff <= 20
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
          Nenhuma preferência configurada. Adicione fainas em <span className="text-accent font-bold">Configurações {'>'} Preferências</span> para vê-las aqui.
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

        // Extrair apenas a parte do turno (ex: Manhã) do texto "Data Turno"
        const turnoText = fainaData?.Data_Turno?.includes(' ') 
          ? fainaData.Data_Turno.split(' ').slice(1).join(' ') 
          : fainaData?.Data_Turno;

        return (
          <Card key={pref.id} className="bg-[#0f1419] border-none shadow-2xl relative overflow-hidden group h-[160px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent shadow-[0_0_15px_rgba(var(--accent),0.5)]"></div>
            
            <div className="p-3 pt-2 space-y-1">
              <div className="flex justify-between items-start">
                <div className="text-sm font-bold text-muted-foreground/80 uppercase tracking-tighter truncate max-w-[80%]">
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

                {/* Exibição do Turno (Conforme imagem do usuário) */}
                {turnoText && (
                  <div className="flex flex-col ml-auto text-right">
                    <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-tighter">Turno</span>
                    <span className="text-[10px] font-bold text-accent/50 whitespace-nowrap">
                      {turnoText}
                    </span>
                  </div>
                )}
              </div>

              {fainaData ? (
                <div className="bg-[#161b22] rounded-lg p-3 grid grid-cols-2 gap-4 border border-white/5">
                  <div className="flex flex-col gap-0 relative">
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter flex items-center gap-2">
                      Original {isGroup2 ? '2' : '1'} {alertO.showIcon && <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse fill-yellow-500/20" />}
                    </span>
                    <span className={cn("text-2xl tracking-tighter transition-colors duration-300", alertO.color)}>{origVal}</span>
                  </div>
                  
                  <div className="flex flex-col gap-0 border-l border-white/5 pl-4 relative">
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter flex items-center gap-2">
                      Temp {isGroup2 ? '2' : '1'} {alertT.showIcon && <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse fill-yellow-500/20" />}
                    </span>
                    <span className={cn("text-2xl tracking-tighter transition-colors duration-300", alertT.color)}>{tempVal}</span>
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
