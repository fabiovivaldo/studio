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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity } from 'lucide-react';

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
          <Card key={pref.id} className="bg-card/50 border-border hover:border-accent/50 transition-all duration-300 shadow-xl relative overflow-hidden group min-h-[180px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-foreground leading-tight">{pref.chamada}</h3>
                    {fainaData && (
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-mono">
                        {fainaData.Sinal}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{pref.faina}</p>
                </div>
                <div className="bg-accent/10 p-2.5 rounded-xl group-hover:bg-accent/20 transition-all duration-500 group-hover:rotate-12">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
              </div>

              {fainaData ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Comparativo 1</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-accent">{fainaData.Temporario_1}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">({fainaData.Original_1})</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Comparativo 2</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-accent">{fainaData.Temporario_2}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">({fainaData.Original_2})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-4 text-destructive/70 italic text-xs bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                  <Zap className="h-3 w-3" />
                  <span>Não encontrado nos dados atuais</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
