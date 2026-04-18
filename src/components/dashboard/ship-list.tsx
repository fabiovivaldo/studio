'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ShipData } from '@/lib/ship-data-service';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ShipList() {
  const [shipData, setShipData] = useState<ShipData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleFetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchShipDataAction();
        if (data && data.length > 0) {
          setShipData(data);
        } else {
          setError('Nenhum navio encontrado na previsão.');
        }
      } catch (e) {
        console.error(e);
        setError('Falha ao buscar os dados dos navios.');
      } finally {
        setIsLoading(false);
      }
    };

    handleFetchData();
  }, []);

  const headers = useMemo(() => {
    if (!shipData || shipData.length === 0) return [];
    // Remove colunas indesejadas
    const unwantedColumns = ["Rebocadores", "Indicativo", "Boca"];
    return Object.keys(shipData[0]).filter(
      (header) => !unwantedColumns.includes(header)
    );
  }, [shipData]);

  const getRowClass = (status: string) => {
    if (!status) return 'hover:bg-accent/5';
    const s = status.toUpperCase();
    if (s.includes('EM ANDAMENTO')) {
      return 'bg-green-500/10 hover:bg-green-500/20';
    }
    if (s.includes('CONFIRMADA')) {
      return 'bg-yellow-500/10 hover:bg-yellow-500/20';
    }
    if (s.includes('A CONFIRMAR')) {
      return 'bg-pink-500/10 hover:bg-pink-500/20';
    }
    return 'hover:bg-accent/5';
  };

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
                <ScrollArea className="h-[600px] w-full">
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
                            <TableRow 
                                key={rowIndex} 
                                className={cn(
                                    "transition-colors border-border/40",
                                    getRowClass(row['Situação'])
                                )}
                            >
                                {headers.map((header) => (
                                <TableCell key={`${rowIndex}-${header}`} className="text-[11px] font-bold tracking-tight py-2 px-4 whitespace-nowrap">
                                    {row[header]}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
  }

  return null;
}
