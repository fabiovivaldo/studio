"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Star,
  Filter
} from "lucide-react";
import { PonteiroData } from "@/lib/data-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { ViewMode } from '@/components/dashboard/dashboard-content';

interface DataTableProps {
  liveData: PonteiroData[];
  viewMode: ViewMode;
}

const CATEGORY_CONFIG = [
  { id: "TODOS", label: "T", color: "text-primary" },
  { id: "ESTIVA", label: "E", color: "text-yellow-500" },
  { id: "ARRUMADOR", label: "A", color: "text-blue-500" },
  { id: "CONFERENTE", label: "C", color: "text-orange-500" },
  { id: "VIGIA", label: "V", color: "text-red-500" },
  { id: "BLOCO", label: "B", color: "text-purple-500" },
  { id: "CONSERTADOR", label: "C", color: "text-green-500" },
];

const SHIFT_LABELS: Record<string, string> = {
  'Madrugada': '01X07',
  'Manhã': '07X13',
  'Tarde': '13X19',
  'Noite': '19X01'
};

export function PonteiroDataTable({ liveData, viewMode }: DataTableProps) {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const loadLocal = () => {
      const savedPrefs = localStorage.getItem('faina_preferences');
      const savedHistory = localStorage.getItem('ponteiro_history');
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      if (savedHistory) setHistoryData(JSON.parse(savedHistory));
    };

    loadLocal();
    window.addEventListener('faina_preferences_updated', loadLocal);
    window.addEventListener('ponteiro_history_updated', loadLocal);
    return () => {
      window.removeEventListener('faina_preferences_updated', loadLocal);
      window.removeEventListener('ponteiro_history_updated', loadLocal);
    };
  }, []);

  const favoriteFainas = useMemo(() => {
    return new Set(preferences.map(p => p.faina.toUpperCase()));
  }, [preferences]);

  const mappedHistory = useMemo(() => {
    return historyData.map(h => ({
      Data_Turno: h.dataTurno,
      Funcao: h.funcao,
      Sinal: h.sinal,
      Original_1: h.original1,
      Temporario_1: h.temporario1,
      Original_2: h.original2,
      Temporario_2: h.temporario2
    }));
  }, [historyData]);

  const currentData = useMemo(() => {
    if (viewMode === 'live') return liveData;
    return mappedHistory.filter(h => h.Data_Turno.includes(viewMode));
  }, [viewMode, liveData, mappedHistory]);

  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      const matchesFilter = Object.values(item).some(val => 
        String(val).toLowerCase().includes(filter.toLowerCase())
      );
      
      const functionUpper = item.Funcao.toUpperCase();
      const matchesCategory = activeCategory === "TODOS" || functionUpper.startsWith(activeCategory);
      
      const isFavorite = favoriteFainas.has(functionUpper);
      const matchesFavorites = !showFavoritesOnly || isFavorite;
      
      return matchesFilter && matchesCategory && matchesFavorites;
    });
  }, [currentData, filter, activeCategory, showFavoritesOnly, favoriteFainas]);

  const cellTextStyle = "text-[12px] font-bold tracking-tight py-2 px-3";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Filtrar por Categoria</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CONFIG.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "h-9 w-9 p-0 flex items-center justify-center border rounded-xl font-black text-xs",
                  activeCategory === cat.id ? "" : cat.color
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="p-4 bg-muted/20 border-b border-border/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black uppercase tracking-tight">
                {viewMode === 'live' ? 'Lista em Tempo Real' : `Histórico: ${SHIFT_LABELS[viewMode] || viewMode}`}
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="h-9 px-3 rounded-lg"
              >
                <Star className={cn("h-4 w-4 mr-1.5", showFavoritesOnly ? "fill-current" : "")} />
                <span className="text-[10px] font-black uppercase">Fav</span>
              </Button>

              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="BUSCAR FAINA..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 h-9 text-[11px] font-bold uppercase"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-3 px-4 text-[10px] font-black uppercase">Faina</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase text-center w-16">S</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">REG: O</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">REG: P</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">CAD: O</TableHead>
                  <TableHead className="py-3 px-3 text-[10px] font-black uppercase">CAD: P</TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-black uppercase">Data / Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-accent/5 transition-colors border-border/40">
                      <TableCell className={cn(cellTextStyle, "font-black text-foreground min-w-[200px]")}>
                        {row.Funcao}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-black text-[13px]",
                          row.Sinal === '-' ? "text-destructive" : "text-green-500"
                        )}>
                          {row.Sinal}
                        </span>
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                        {row.Original_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary font-mono")}>
                        {row.Temporario_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                        {row.Original_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary font-mono")}>
                        {row.Temporario_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground text-[10px] whitespace-nowrap")}>
                        {row.Data_Turno}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}