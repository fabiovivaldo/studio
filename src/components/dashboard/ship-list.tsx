'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { ShipData, ShipDataPayload } from '@/lib/ship-data-service';
import { fetchShipDataAction } from '@/lib/actions';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ShipList() {
  const [shipData, setShipData] = useState<ShipData[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, startUpdateTransition] = useTransition();

  const handleFetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const payload: ShipDataPayload = await fetchShipDataAction();
      if (payload && payload.data.length > 0) {
        setShipData(payload.data);
        setLastUpdated(payload.lastUpdated);
      } else {
        setError('Nenhum navio encontrado na previsão.');
        setShipData(null);
        setLastUpdated(null);
      }
    } catch (e) {
      console.error(e);
      setError('Falha ao buscar os dados dos navios.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };
  
  const triggerUpdate = () => {
    startUpdateTransition(async () => {
        await handleFetchData(false);
    });
  };


  useEffect(() => {
    handleFetchData();
  }, []);

  const { headers, getRowClass } = useMemo(() => {
    if (!shipData || shipData.length === 0) return { headers: [], getRowClass: () => '' };
    
    const unwantedColumns = ["Rebocadores", "Indicativo", "Boca"];
    const filteredHeaders = Object.keys(shipData[0]).filter(
      (header) => !unwantedColumns.includes(header)
    );

    const getRowClass = (status: string) => {
        if (!status) return 'hover:bg-accent/5';
        const s = status.toUpperCase();
        if (s.includes('EM ANDAMENTO')) {
          return 'bg-green-500/40 hover:bg-green-500/50';
        }
        if (s.includes('CONFIRMADA')) {
          return 'bg-yellow-500/40 hover:bg-yellow-500/50';
        }
        if (s.includes('A CONFIRMAR')) {
          return 'bg-pink-500/40 hover:bg-pink-500/50';
        }
        return 'hover:bg-accent/5';
    };

    return { headers: filteredHeaders, getRowClass };
  }, [shipData]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-10 min-h-[300px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="ml-4 text-sm text-muted-foreground font-bold">Carregando lista de navios...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center p-10 min-h-[300px] text-destructive bg-destructive/5 rounded-lg">
            <AlertTriangle className="h-8 w-8 mb-4" />
            <p className="text-sm font-bold">{error}</p>
        </div>
    );
  }

  if (shipData && headers.length > 0) {
    return (
        <Card className="border-border/50 bg-card overflow-hidden shadow-lg">
            <CardContent className="p-0">
                <div className="p-4 bg-muted/20 border-b border-border/50 flex justify-between items-center">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground font-bold uppercase">
                            {lastUpdated}
                        </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={triggerUpdate} disabled={isUpdating} className="h-8 text-xs font-bold ml-auto">
                        <RefreshCcw className={`h-3.5 w-3.5 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                        {isUpdating ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                </div>
                <div className="h-[600px] w-full overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                            <TableRow>
                            {headers.map((header) => (
                                <TableHead key={header} className="py-3 px-4 text-[10px] font-black uppercase whitespace-nowrap">
                                {header}
                                </TableHead>
                            ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipData.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className={cn("transition-colors border-border/40", getRowClass(row['Situação']))}>
                                {headers.map((header) => (
                                <TableCell key={`${rowIndex}-${header}`} className="text-[11px] font-bold tracking-tight py-2 px-4 whitespace-nowrap">
                                    {row[header]}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
  }

  return null;
}
