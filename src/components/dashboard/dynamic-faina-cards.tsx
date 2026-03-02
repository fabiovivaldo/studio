'use client';

import React from 'react';
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase,
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
}

export function DynamicFainaCards({ scrapedData }: DynamicFainaCardsProps) {
  const { firestore, user, auth } = useFirebase();

  // Garantir que o usuário esteja logado (anonimamente) para ver suas preferências
  React.useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading } = useCollection(preferencesQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted/50 rounded-xl border border-border"></div>
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
        // Encontrar o dado correspondente no scraping para esta faina preferida
        const fainaData = scrapedData.find(d => d.Funcao === pref.faina);

        return (
          <Card key={pref.id} className="bg-[#0f1419] border-none shadow-2xl relative overflow-hidden group">
            {/* Barra lateral de destaque */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent shadow-[0_0_15px_rgba(var(--accent),0.5)]"></div>
            
            <div className="p-5 pt-4 space-y-6">
              {/* Topo: Nome Original da Faina e Sinal */}
              <div className="flex justify-between items-start">
                <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate max-w-[200px]">
                  {pref.faina}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter opacity-80">Sinal</span>
                  <div className="bg-accent/10 border border-accent/20 px-4 py-0.5 rounded-full">
                    <span className="text-xs font-bold text-accent">
                      {fainaData?.Sinal || '+'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Centro: Chamada Personalizada (Texto Grande) */}
              <div className="text-4xl font-bold text-white tracking-tighter py-2">
                {pref.chamada}
              </div>

              {/* Rodapé: Tabela de Valores com fundo escuro */}
              {fainaData ? (
                <div className="bg-[#161b22] rounded-lg p-4 grid grid-cols-4 gap-2 border border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Original 1</span>
                    <span className="text-xl font-bold text-accent tracking-tighter">{fainaData.Original_1}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-white/5 pl-2">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Temp 1</span>
                    <span className="text-xl font-bold text-accent tracking-tighter">{fainaData.Temporario_1}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-white/5 pl-2">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Original 2</span>
                    <span className="text-xl font-bold text-accent tracking-tighter">{fainaData.Original_2}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-white/5 pl-2">
                    <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Temp 2</span>
                    <span className="text-xl font-bold text-accent tracking-tighter">{fainaData.Temporario_2}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive/70 italic text-xs bg-destructive/5 p-4 rounded-lg border border-destructive/10">
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
