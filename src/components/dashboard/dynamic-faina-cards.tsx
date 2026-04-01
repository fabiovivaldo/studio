'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/components/dashboard/dashboard-content';
import { Badge } from '@/components/ui/badge';

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
  selectedShift?: ViewMode;
}

// Ordem lógica para exibição cronológica no Porto
const SHIFT_DISPLAY_ORDER = ['Madrugada', 'Manhã', 'Tarde', 'Noite'] as const;

// Pesos cronológicos para determinar o que já passou no dia
const SHIFT_CHRONO_WEIGHTS: Record<string, number> = {
  'Madrugada': 0,
  'Manhã': 1,
  'Tarde': 2,
  'Noite': 3
};

const SHIFT_LABELS: Record<string, string> = {
  'Madrugada': '01X07',
  'Manhã': '07X13',
  'Tarde': '13X19',
  'Noite': '19X01'
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
    return Object.keys(SHIFT_CHRONO_WEIGHTS).find(s => turnoStr.includes(s)) || null;
  }, [scrapedData]);

  const activeShiftChronoWeight = useMemo(() => {
    if (!activeShiftFromData) return -1;
    return SHIFT_CHRONO_WEIGHTS[activeShiftFromData];
  }, [activeShiftFromData]);

  const sortedPreferences = useMemo(() => {
    if (!preferences.length) return [];
    return [...preferences].sort((a, b) => a.faina.localeCompare(b.faina));
  }, [preferences]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-[140px] bg-muted/50 rounded-xl border border-border"></div>
        ))}
      </div>
    );
  }

  if (preferences.length === 0) {
    return (
      <div className="bg-muted/10 border border-dashed border-border rounded-xl p-10 text-center">
        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-50">
          Nenhuma faina prioritária configurada.
        </p>
      </div>
    );
  }

  const labelStyle = "text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest";
  const tinyLabelStyle = "text-[9px] font-bold text-muted-foreground/50 uppercase";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPreferences.map((pref) => {
          const modoAtivo = pref.modo || 'temporario';
          const isRegistro = pref.tipo === '1';
          const isOffline = !currentScrapedFainas.has(pref.faina.toUpperCase());

          return (
            <Card key={pref.id} className={cn(
              "bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col transition-opacity duration-300",
              isOffline && "opacity-60"
            )}>
              <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full z-10",
                isOffline ? "bg-muted" : "bg-primary"
              )}></div>
              
              <div className="p-4 flex items-start justify-between">
                <div className="flex gap-6">
                  <div className="space-y-0.5">
                    <span className={labelStyle}>Chamada</span>
                    <div className={cn(
                      "text-2xl font-black leading-none tracking-tighter",
                      isOffline ? "text-muted-foreground" : "text-primary"
                    )}>
                      {pref.chamada}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-4 text-[7px] font-black px-1.5 uppercase border-primary/30 text-primary">
                        {isRegistro ? 'REGISTRO (P1)' : 'CADASTRO (P2)'}
                      </Badge>
                      <span className={labelStyle}>Faina</span>
                    </div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-tight truncate max-w-[180px] sm:max-w-[300px]">
                      {pref.faina}
                    </h2>
                  </div>
                </div>

                {isOffline && (
                  <Badge variant="outline" className="h-5 text-[8px] font-black uppercase border-muted-foreground/20 text-muted-foreground">
                    <WifiOff className="h-2.5 w-2.5 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>

              <div className="px-4 pb-4 grid grid-cols-4 gap-2 w-full">
                {SHIFT_DISPLAY_ORDER.map((shiftName) => {
                  const shiftData = historyData.find(d => 
                    d.funcao === pref.faina && d.dataTurno.includes(shiftName)
                  );

                  const valO = isRegistro ? shiftData?.original1 : shiftData?.original2;
                  const valT = isRegistro ? shiftData?.temporario1 : shiftData?.temporario2;

                  const monitorValue = modoAtivo === 'original' ? valO : valT;
                  const monitorNum = parseInt(monitorValue?.replace(/\D/g, '') || '0') || 0;
                  const targetNum = parseInt(pref.chamada.replace(/\D/g, '')) || 0;
                  const tetoNum = parseInt(pref.teto || '0') || 0;
                  
                  let displayDiff = null;
                  if (shiftData) {
                    displayDiff = calculateDistance(monitorNum, targetNum, tetoNum, shiftData.sinal);
                  }
                  
                  const isHighlighted = selectedShift === 'live' 
                    ? activeShiftFromData === shiftName 
                    : selectedShift === shiftName;

                  const thisShiftWeight = SHIFT_CHRONO_WEIGHTS[shiftName];
                  const isPassed = activeShiftChronoWeight !== -1 && thisShiftWeight < activeShiftChronoWeight;

                  // Alertas aparecem apenas se não passou
                  const isCritical = isHighlighted && !isPassed && displayDiff !== null && displayDiff >= 0 && displayDiff <= 10;
                  const isWarning = isHighlighted && !isPassed && !isCritical && displayDiff !== null && displayDiff > 10 && displayDiff <= 20;

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-xl p-2.5 border-2 transition-all flex flex-col gap-1.5 relative min-w-0 h-full",
                        !shiftData && "opacity-20 bg-muted/5 border-dashed border-border/20",
                        shiftData && "bg-muted/5 border-border/30",
                        isHighlighted && !isCritical && !isWarning && "ring-2 ring-primary border-primary/50 bg-primary/5",
                        isCritical && "bg-destructive/10 border-destructive",
                        isWarning && "bg-orange-500/10 border-orange-500",
                        isPassed && "opacity-40 grayscale-[0.5]"
                      )}
                    >
                      <div className="flex items-center justify-between min-w-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest truncate",
                          isHighlighted ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          ({shiftData?.sinal || ''}) {SHIFT_LABELS[shiftName]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={tinyLabelStyle}>O:</span>
                          <span className={cn(
                            "text-[10px] font-black",
                            modoAtivo === 'original' ? "text-foreground" : "text-muted-foreground/40"
                          )}>
                            {valO || '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={tinyLabelStyle}>P:</span>
                          <span className={cn(
                            "text-[10px] font-black",
                            modoAtivo === 'temporario' ? "text-foreground" : "text-muted-foreground/40"
                          )}>
                            {valT || '--'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-1.5 border-t border-border/30 flex items-center justify-between min-h-[1.5rem]">
                        {!isPassed && shiftData && (
                          <div className="flex items-baseline gap-1">
                            <span className={cn(
                              "text-base font-black tracking-tighter leading-none",
                              displayDiff !== null && displayDiff <= 0 
                                ? "text-muted-foreground/30" 
                                : (isCritical ? "text-destructive" : isWarning ? "text-orange-600" : "text-primary")
                            )}>
                              {displayDiff}
                            </span>
                            {displayDiff !== null && displayDiff > 0 && (
                              <span className="text-[8px] font-black uppercase opacity-40">Faltam</span>
                            )}
                          </div>
                        )}
                        {isHighlighted && isCritical && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
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
