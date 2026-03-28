
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
  Zap,
  Sun,
  Sunrise,
  Moon,
  CloudMoon,
  Calendar,
  Star,
  Filter
} from "lucide-react";
import { PonteiroData } from "@/lib/data-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { ViewMode } from './dashboard-content';

interface DataTableProps {
  liveData: PonteiroData[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const CATEGORY_CONFIG = [
  { id: "TODOS", label: "T", color: "text-primary" },
  { id: "ESTIVA", label: "E", color: "text-yellow-400" },
  { id: "ARRUMADOR", label: "A", color: "text-blue-400" },
  { id: "CONFERENTE", label: "C", color: "text-orange-400" },
  { id: "VIGIA", label: "V", color: "text-red-400" },
  { id: "BLOCO", label: "B", color: "text-purple-400" },
  { id: "CONSERTADOR", label: "C", color: "text-green-400" },
];

const SHIFT_CONFIG = [
  { id: 'Manhã', label: '07X13', icon: Sunrise, color: 'text-orange-400' },
  { id: 'Tarde', label: '13X19', icon: Sun, color: 'text-yellow-400' },
  { id: 'Noite', label: '19X01', icon: Moon, color: 'text-blue-400' },
  { id: 'Madrugada', label: '01X07', icon: CloudMoon, color: 'text-indigo-400' },
] as const;

export function PonteiroDataTable({ liveData, viewMode, setViewMode }: DataTableProps) {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Carregar dados locais
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

  const handleSort = (key: keyof PonteiroData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const columns = [
    { key: 'Funcao', label: 'Faina' },
    { key: 'Sinal', label: 'S' },
    { key: 'Original_1', label: 'O: 1' },
    { key: 'Temporario_1', label: 'P: 1' },
    { key: 'Original_2', label: 'O: 2' },
    { key: 'Temporario_2', label: 'P: 2' },
    { key: 'Data_Turno', label: 'Data / Turno' },
  ] as const;

  const cellTextStyle = "text-[12px] font-bold tracking-tight py-1.5 px-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Período</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setViewMode('live')}
              className={cn(
                "h-9 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                viewMode === 'live' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background text-muted-foreground border-border hover:bg-muted/50"
              )}
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Real
            </Button>
            
            {SHIFT_CONFIG.map((shift) => (
              <Button 
                key={shift.id}
                variant="outline"
                size="sm" 
                onClick={() => setViewMode(shift.id as any)}
                className={cn(
                  "h-9 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                  viewMode === shift.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                )}
              >
                <shift.icon className={cn("h-3.5 w-3.5 mr-1", viewMode === shift.id ? "text-primary-foreground" : shift.color)} />
                {shift.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filtro</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CONFIG.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                size="sm" 
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "h-9 w-9 flex items-center justify-center border rounded-xl transition-all font-black text-xs",
                  activeCategory === cat.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                <span className={cn(activeCategory === cat.id ? "text-primary-foreground" : cat.color)}>
                  {cat.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                {viewMode === 'live' ? <Zap className="h-4 w-4 text-yellow-500" /> : <Calendar className="h-4 w-4 text-primary" />}
              </div>
              <h3 className="text-sm font-bold">
                {viewMode === 'live' ? 'Lista Atual' : `Histórico Local: ${SHIFT_CONFIG.find(s => s.id === viewMode)?.label}`}
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  "h-8 px-3 rounded-lg border-primary/20 transition-all",
                  showFavoritesOnly ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <Star className={cn("h-3.5 w-3.5 mr-1.5", showFavoritesOnly ? "fill-primary" : "")} />
                <span className="text-[10px] font-bold uppercase">Fav</span>
              </Button>

              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8 h-8 text-[11px] bg-background/50 border-border"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  {columns.map(({ key, label }) => (
                    <TableHead 
                      key={key} 
                      className="cursor-pointer py-2 px-1.5 font-black uppercase tracking-tight text-[10px]"
                      onClick={() => handleSort(key as keyof PonteiroData)}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-primary/5 border-border/50">
                      <TableCell className={cn(cellTextStyle, "font-black")}>{row.Funcao}</TableCell>
                      <TableCell className="py-1.5 px-1.5">
                        <span className={cn(
                          "font-black text-[13px]",
                          row.Sinal === '-' ? "text-destructive" : "text-green-500"
                        )}>
                          {row.Sinal}
                        </span>
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary/60 font-mono")}>{row.Original_1}</TableCell>
                      <TableCell className={cn(cellTextStyle, "text-foreground font-mono")}>{row.Temporario_1}</TableCell>
                      <TableCell className={cn(cellTextStyle, "text-primary/60 font-mono")}>{row.Original_2}</TableCell>
                      <TableCell className={cn(cellTextStyle, "text-foreground font-mono")}>{row.Temporario_2}</TableCell>
                      <TableCell className={cn(cellTextStyle, "text-muted-foreground text-[10px]")}>{row.Data_Turno}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs uppercase font-bold">
                      Nenhum registro no histórico local.
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
