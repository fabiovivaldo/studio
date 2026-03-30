'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { WifiOff, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from './dashboard-content';
import { Badge } from '@/components/ui/badge';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
  selectedShift?: ViewMode;
}

const SHIFT_ORDER = ['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const;

const SHIFT_LABELS: Record<string, string> = {
  'Manhã': '07X13',
  'Tarde': '13X19',
  'Noite': '19X01',
  'Madrugada': '01X07'
};

function calculateDistance(
  monitorNum: number,
  targetNum: number,
  tetoNum: number,
  sinal: string
): number {
  if (tetoNum <= 0) {
    if (sinal === '-') {
      return monitorNum - targetNum;
    } else {
      return targetNum - monitorNum;
    }
  }

  if (sinal === '-') {
    if (monitorNum >= targetNum) {
      return monitorNum - targetNum;
    } else {
      return monitorNum + (tetoNum - targetNum);
    }
  } else {
    if (targetNum >= monitorNum) {
      return targetNum - monitorNum;
    } else {
      return (tetoNum - monitorNum) + targetNum;
    }
  }
}

export function DynamicFainaCards({ scrapedData, selectedShift = 'live' }: DynamicFainaCardsProps) {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocalData = () => {
      const savedPrefs = localStorage.getItem('faina_preferences');
      const savedHistory = localStorage.getItem('ponteiro_history');
      
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      if (savedHistory) setHistoryData(JSON.parse(savedHistory));
      setIsLoading(false);
    };

    loadLocalData();

    window.addEventListener('faina_preferences_updated', loadLocalData);
    window.addEventListener('ponteiro_history_updated', loadLocalData);
    
    return () => {
      window.removeEventListener('faina_preferences_updated', loadLocalData);
      window.removeEventListener('ponteiro_history_updated', loadLocalData);
    };
  }, []);

  const currentScrapedFainas = useMemo(() => {
    return new Set(scrapedData.map(d => d.Funcao.toUpperCase()));
  }, [scrapedData]);

  const activeShiftFromData = useMemo(() => {
    if (!scrapedData.length) return null;
    const turnoStr = scrapedData[0].Data_Turno;
    return SHIFT_ORDER.find(s => turnoStr.includes(s));
  }, [scrapedData]);

  const sortedPreferences = useMemo(() => {
    if (!preferences.length) return [];

    return [...preferences].sort((a, b) => {
      const getMinDist = (pref: any) => {
        let min = Infinity;
        const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
        const tetoNum = parseInt(pref.teto || '0') || 0;
        const isGroupRegistro = pref.tipo === '1';
        const modoAtivo = pref.modo || 'temporario';

        for (const shiftName of SHIFT_ORDER) {
          const shiftData = historyData.find(d => 
            d.funcao === pref.faina && d.dataTurno.includes(shiftName)
          );
          if (shiftData) {
            const valO = isGroupRegistro ? shiftData.original1 : shiftData.original2;
            const valT = isGroupRegistro ? shiftData.temporario1 : shiftData.temporario2;
            const monitorValue = modoAtivo === 'original' ? valO : valT;
            const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
            const dist = calculateDistance(monitorNum, targetNum, tetoNum, shiftData.sinal);
            if (dist > 0 && dist < min) min = dist;
          }
        }
        return min;
      };

      return getMinDist(a) - getMinDist(b);
    });
  }, [preferences, historyData]);

  const closestPrediction = useMemo(() => {
    if (!preferences.length || !historyData.length || !activeShiftFromData) return null;
    
    let minDiff = Infinity;
    let result = null;

    for (const pref of preferences) {
      const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
      const tetoNum = parseInt(pref.teto || '0') || 0;
      const isGroupRegistro = pref.tipo === '1';
      const modoAtivo = pref.modo || 'temporario';

      const shiftData = historyData.find(d => 
        d.funcao === pref.faina && d.dataTurno.includes(activeShiftFromData)
      );

      if (shiftData) {
        const valO = isGroupRegistro ? shiftData.original1 : shiftData.original2;
        const valT = isGroupRegistro ? shiftData.temporario1 : shiftData.temporario2;
        const monitorValue = modoAtivo === 'original' ? valO : valT;
        const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
        
        const diff = calculateDistance(monitorNum, targetNum, tetoNum, shiftData.sinal);

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          result = {
            faina: pref.faina,
            shift: activeShiftFromData,
            diff: diff
          };
        }
      }
    }
    return result;
  }, [preferences, historyData, activeShiftFromData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-[120px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (preferences.length === 0) {
    return (
      <div className="bg-accent/5 border border-dashed border-accent/20 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-bold italic">
          Nenhuma faina prioritária configurada localmente. Clique na engrenagem acima.
        </p>
      </div>
    );
  }

  const labelStyle = "text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider";
  const tinyLabelStyle = "text-[9px] font-bold text-muted-foreground/40 uppercase";

  return (
    <div className="space-y-6">
      {closestPrediction && (
        <div className="px-1 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-xl">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-foreground">
              vai dar boa em <span className="text-accent">{closestPrediction.faina}</span> ({SHIFT_LABELS[closestPrediction.shift]})
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPreferences.map((pref) => {
          const modoAtivo = pref.modo || 'temporario';
          const isGroupRegistro = pref.tipo === '1'; // P1 = REGISTRO
          const isGroupCadastro = pref.tipo === '2'; // P2 = CADASTRO
          const isOffline = !currentScrapedFainas.has(pref.faina.toUpperCase());

          return (
            <Card key={pref.id} className={cn(
              "bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col group h-full transition-opacity duration-500",
              isOffline && "opacity-60"
            )}>
              <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full z-10 transition-colors",
                isOffline ? "bg-muted" : (isGroupRegistro ? "bg-primary" : "bg-orange-500")
              )}></div>
              
              <div className="p-4 pb-2 flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="space-y-0.5">
                    <span className={labelStyle}>Chamada</span>
                    <div className={cn(
                      "text-xl font-black leading-none",
                      isOffline ? "text-muted-foreground" : (isGroupRegistro ? "text-primary" : "text-orange-500")
                    )}>
                      {pref.chamada}
                    </div>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={labelStyle}>Faina</span>
                      <Badge variant="outline" className={cn(
                        "h-4 text-[7px] font-black px-1.5 uppercase",
                        isGroupRegistro ? "border-primary/30 text-primary bg-primary/5" : "border-orange-500/30 text-orange-500 bg-orange-500/5"
                      )}>
                        {isGroupRegistro ? 'REGISTRO' : 'CADASTRO'}
                      </Badge>
                    </div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-tight break-words truncate max-w-[150px] sm:max-w-[250px]">
                      {pref.faina}
                    </h2>
                  </div>
                </div>

                {isOffline && (
                  <Badge variant="outline" className="h-5 text-[8px] font-black uppercase tracking-tighter border-muted-foreground/20 text-muted-foreground bg-muted/5">
                    <WifiOff className="h-2.5 w-2.5 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>

              <div className="px-4 pb-4 grid grid-cols-4 gap-2 w-full mt-1">
                {SHIFT_ORDER.map((shiftName) => {
                  const shiftData = historyData.find(d => 
                    d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                  );

                  const valO = isGroupRegistro ? shiftData?.original1 : shiftData?.original2;
                  const valT = isGroupRegistro ? shiftData?.temporario1 : shiftData?.temporario2;

                  const monitorValue = modoAtivo === 'original' ? valO : valT;
                  const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
                  const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
                  const tetoNum = parseInt(pref.teto || '0') || 0;
                  
                  let displayDiff = null;
                  if (shiftData) {
                    displayDiff = calculateDistance(monitorNum, targetNum, tetoNum, shiftData.sinal);
                  }
                  
                  const isCritical = displayDiff !== null && displayDiff > 0 && displayDiff <= 10;
                  const isWarning = displayDiff !== null && displayDiff > 10 && displayDiff <= 20;

                  const isHighlighted = selectedShift === 'live' 
                    ? activeShiftFromData === shiftName 
                    : selectedShift === shiftName;

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-lg p-2 transition-all duration-200 flex flex-col gap-1 relative flex-1 min-w-0 h-full",
                        !shiftData && "opacity-30 bg-muted/5 border-dashed border-border/20",
                        shiftData && "bg-muted/10",
                        isHighlighted ? (isGroupRegistro ? "ring-2 ring-primary bg-primary/5" : "ring-2 ring-orange-500 bg-orange-500/5") : "border-2 border-transparent",
                        isCritical && "bg-destructive/10 border-2 border-destructive animate-pulse",
                        isWarning && !isCritical && "bg-orange-500/10 border-2 border-orange-500",
                        !isHighlighted && !isCritical && !isWarning && "border-2 border-border/40"
                      )}
                    >
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest truncate",
                            isHighlighted ? (isGroupRegistro ? "text-primary" : "text-orange-500") : "text-muted-foreground/60"
                          )}>
                            {SHIFT_LABELS[shiftName]}
                          </span>
                        </div>
                        {isCritical && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className={tinyLabelStyle}>O:</span>
                          <span className={cn(
                            "transition-all duration-200",
                            modoAtivo === 'original' 
                              ? "text-xs font-black text-foreground leading-none" 
                              : "text-[9px] font-bold text-muted-foreground/40"
                          )}>
                            {valO || '--'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={tinyLabelStyle}>P:</span>
                          <span className={cn(
                            "transition-all duration-200",
                            modoAtivo === 'temporario' 
                              ? "text-xs font-black text-foreground leading-none" 
                              : "text-[9px] font-bold text-muted-foreground/40"
                          )}>
                            {valT || '--'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-1 flex items-baseline gap-1">
                        <span className={cn(
                          "text-[14px] font-black tracking-tighter leading-none block",
                          displayDiff !== null && displayDiff <= 0 ? "text-muted-foreground opacity-50" : (isCritical ? "text-destructive" : isWarning ? "text-orange-600" : isGroupRegistro ? "text-primary/80" : "text-orange-600/80")
                        )}>
                          {shiftData ? displayDiff : ''}
                        </span>
                        {shiftData?.sinal && (
                            <span className={cn(
                              "text-[10px] font-black",
                              shiftData.sinal === '-' ? "text-destructive" : "text-green-500"
                            )}>
                              ({shiftData.sinal})
                            </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
