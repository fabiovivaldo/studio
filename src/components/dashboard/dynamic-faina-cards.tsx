'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PonteiroData } from '@/lib/data-service';
import { Card } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/components/dashboard/dashboard-content';
import { Badge } from '@/components/ui/badge';

const SHIFT_WEIGHTS: Record<string, number> = {
  'Manhã': 1,
  'Tarde': 2,
  'Noite': 3,
  'Madrugada': 4
};

const SHIFT_LABELS: Record<string, string> = {
  'Madrugada': '01X07',
  'Manhã': '07X13',
  'Tarde': '13X19',
  'Noite': '19X01'
};

const SHIFT_DISPLAY_ORDER = ['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const;

interface DynamicFainaCardsProps {
  scrapedData: PonteiroData[];
  selectedShift?: ViewMode;
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

  const currentScrapedMap = useMemo(() => {
    const map = new Map<string, PonteiroData>();
    scrapedData.forEach(d => {
      map.set(d.Funcao.toUpperCase(), d);
    });
    return map;
  }, [scrapedData]);

  const activeShiftFromData = useMemo(() => {
    if (!scrapedData.length) return null;
    const turnoStr = scrapedData[0].Data_Turno;
    return Object.keys(SHIFT_WEIGHTS).find(s => turnoStr.includes(s)) || null;
  }, [scrapedData]);

  const calculateDistance = (pont: number, chamada: number, sinal: string, tetoStr: string) => {
    const teto = parseInt(tetoStr) || 0;
    const p = pont;
    const c = chamada;

    if (sinal === '+') {
      let d = c - p;
      if (d < 0 && teto > 0) d += teto;
      return d;
    } else if (sinal === '-') {
      let d = p - c;
      if (d < 0 && teto > 0) d += teto;
      return d;
    }
    return c - p;
  };

  const sortedPreferences = useMemo(() => {
    if (!preferences.length) return [];
    
    return [...preferences].sort((a, b) => {
      const liveA = currentScrapedMap.get(a.faina.toUpperCase());
      const liveB = currentScrapedMap.get(b.faina.toUpperCase());

      const getDist = (pref: any, record: PonteiroData | undefined) => {
        if (!record) return 9999;
        const pont = parseInt(pref.modo === 'temporario' ? record.Temporario_1 : record.Original_1) || 0;
        const chamada = parseInt(pref.chamada) || 0;
        const dist = calculateDistance(pont, chamada, record.Sinal, pref.teto);
        
        if (dist >= 0 && dist <= 30) return dist;
        if (dist > 30) return 1000 + dist;
        return 5000 + Math.abs(dist);
      };

      const distA = getDist(a, liveA);
      const distB = getDist(b, liveB);

      return distA - distB;
    });
  }, [preferences, currentScrapedMap]);

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

  const labelStyle = "text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPreferences.map((pref) => {
          const isRegistro = pref.tipo === '1';
          const fainaUpper = pref.faina.toUpperCase();
          const liveRecord = currentScrapedMap.get(fainaUpper);
          const isOffline = !liveRecord;

          return (
            <Card key={pref.id} className={cn(
              "bg-card border-border/50 shadow-sm relative overflow-hidden flex flex-col transition-opacity duration-300",
              isOffline && "opacity-60"
            )}>
              <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full z-10",
                isOffline ? "bg-muted" : "bg-primary"
              )}></div>
              
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-6 min-w-0 flex-1">
                  <div className="space-y-0.5 shrink-0 text-center">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Chamada</span>
                    <div className="text-lg font-black leading-none tracking-tighter text-orange-500">
                      {pref.chamada}
                    </div>
                  </div>
                  
                  <div className="space-y-1 min-w-0 overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-4 text-[7px] font-black px-1.5 uppercase border-primary/30 text-primary whitespace-nowrap">
                        {isRegistro ? 'REGISTRO (P1)' : 'CADASTRO (P2)'}
                      </Badge>
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Faina</span>
                    </div>
                    
                    <div className="w-full overflow-hidden relative">
                      <div className="animate-marquee whitespace-nowrap flex">
                        <h2 className="text-sm font-black text-foreground uppercase tracking-tight pr-12">
                          {pref.faina}
                        </h2>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-tight pr-12">
                          {pref.faina}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                {isOffline && (
                  <Badge variant="outline" className="h-5 text-[8px] font-black uppercase border-muted-foreground/20 text-muted-foreground shrink-0">
                    <WifiOff className="h-2.5 w-2.5 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>

              <div className="px-4 pb-4 grid grid-cols-4 gap-2 w-full">
                {SHIFT_DISPLAY_ORDER.map((shiftName) => {
                  const isActiveShift = activeShiftFromData === shiftName;
                  const thisShiftWeight = SHIFT_WEIGHTS[shiftName];
                  const activeShiftWeight = activeShiftFromData ? SHIFT_WEIGHTS[activeShiftFromData] : -1;
                  
                  let valO, valT, sinal;
                  
                  if (isActiveShift && liveRecord) {
                    valO = isRegistro ? liveRecord.Original_1 : liveRecord.Original_2;
                    valT = isRegistro ? liveRecord.Temporario_1 : liveRecord.Temporario_2;
                    sinal = liveRecord.Sinal;
                  } else {
                    const shiftData = historyData.find(d => 
                      d.funcao.toUpperCase() === fainaUpper && d.dataTurno.includes(shiftName)
                    );
                    valO = isRegistro ? shiftData?.original1 : shiftData?.original2;
                    valT = isRegistro ? shiftData?.temporario1 : shiftData?.temporario2;
                    sinal = shiftData?.sinal;
                  }

                  const isHighlighted = selectedShift === 'live' 
                    ? isActiveShift 
                    : selectedShift === shiftName;

                  const hasData = !!valO || !!valT;
                  const valueToMonitor = pref.modo === 'temporario' ? valT : valO;

                  let alertType: 'none' | 'red' | 'yellow' | 'green' = 'none';
                  if (hasData && valueToMonitor) {
                    const pontNum = parseInt(valueToMonitor) || 0;
                    const chamNum = parseInt(pref.chamada) || 0;
                    const dist = calculateDistance(pontNum, chamNum, sinal || '+', pref.teto);
                    
                    if (dist >= 0) {
                      if (dist <= 10) alertType = 'green';
                      else if (dist <= 20) alertType = 'yellow';
                      else if (dist <= 30) alertType = 'red';
                    }
                  }

                  const alertColorClass = alertType === 'green' ? 'text-green-500' :
                                        alertType === 'yellow' ? 'text-yellow-500' :
                                        alertType === 'red' ? 'text-red-500' : '';

                  const isPassed = activeShiftWeight !== -1 && thisShiftWeight < activeShiftWeight;

                  return (
                    <div 
                      key={shiftName} 
                      className={cn(
                        "rounded-xl p-2.5 border-2 transition-all flex flex-col gap-1 relative min-w-0 h-full",
                        !hasData && "opacity-20 bg-muted/5 border-dashed border-border/20",
                        hasData && "bg-muted/5 border-border/30",
                        
                        alertType === 'green' && "border-green-500 border-[3px] bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
                        alertType === 'yellow' && "border-yellow-500 border-[3px] bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
                        alertType === 'red' && "border-red-500 border-[3px] bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
                        
                        isHighlighted && "ring-[3px] ring-primary ring-inset ring-offset-0",
                        isHighlighted && alertType === 'none' && "border-primary bg-primary/5",
                        
                        isPassed && "opacity-40 grayscale-[0.5]"
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest truncate leading-none",
                          isHighlighted && alertType === 'none' ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {SHIFT_LABELS[shiftName]}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black leading-none mt-1",
                          sinal === '+' ? "text-green-500" : 
                          sinal === '-' ? "text-destructive" : "text-muted-foreground/20"
                        )}>
                          {sinal ? `(${sinal})` : '--'}
                        </span>
                      </div>

                      <div className="space-y-0.5 mt-1">
                        <div className="flex items-center gap-1">
                          <span className={cn(labelStyle, pref.modo !== 'original' && "opacity-30")}>Orig:</span>
                          <span className={cn(
                            "text-[10px] font-black transition-colors leading-none",
                            pref.modo === 'original' 
                              ? (alertColorClass || (isHighlighted ? "text-primary" : "text-foreground")) 
                              : "text-muted-foreground/30"
                          )}>
                            {valO || '--'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn(labelStyle, pref.modo !== 'temporario' && "opacity-30")}>Pont:</span>
                          <span className={cn(
                            "text-[10px] font-black transition-colors leading-none",
                            pref.modo === 'temporario' 
                              ? (alertColorClass || (isHighlighted ? "text-primary" : "text-foreground")) 
                              : "text-muted-foreground/30"
                          )}>
                            {valT || '--'}
                          </span>
                        </div>
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
