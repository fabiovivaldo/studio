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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted/50 rounded-xl border border-border"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {preferences.map((pref) => {
        // Encontrar o dado correspondente no scraping para esta faina preferida
        const fainaData = scrapedData.find(d => d.Funcao === pref.faina);

        return (
          <Card key={pref.id} className="bg-card/50 border-border hover:border-accent/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{pref.chamada}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mt-1">{pref.faina}</p>
                </div>
                <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <Activity className="h-4 w-4 text-accent" />
                </div>
              </div>

              {fainaData ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Temp 1</p>
                    <p className="text-2xl font-mono font-bold text-accent">{fainaData.Temporario_1}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Temp 2</p>
                    <p className="text-2xl font-mono font-bold text-accent">{fainaData.Temporario_2}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-4 text-destructive/70 italic text-xs">
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