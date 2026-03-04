
"use client";

import React, { useState, useMemo } from 'react';
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
  ArrowUpDown, 
  Download, 
  Search,
  LayoutGrid,
  Users,
  HardHat,
  ClipboardList,
  Wrench,
  Eye,
  Filter,
  Zap,
  Sun,
  Sunrise,
  Moon,
  CloudMoon,
  Calendar,
  Star
} from "lucide-react";
import { PonteiroData, exportToCSV } from "@/lib/data-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ViewMode } from './dashboard-content';

interface DataTableProps {
  liveData: PonteiroData[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const CATEGORY_CONFIG = [
  { id: "TODOS", label: "Todos", icon: Filter, color: "text-accent" },
  { id: "ESTIVA", label: "Estiva", icon: HardHat, color: "text-yellow-400" },
  { id: "ARRUMADOR", label: "Arrumador", icon: Users, color: "text-blue-400" },
  { id: "CONFERENTE", label: "Conferente", icon: ClipboardList, color: "text-orange-400" },
  { id: "VIGIA", label: "Vigia", icon: Eye, color: "text-red-400" },
  { id: "BLOCO", label: "Bloco", icon: LayoutGrid, color: "text-purple-400" },
  { id: "CONSERTADOR", label: "Consertador", icon: Wrench, color: "text-green-400" },
];

const SHIFT_CONFIG = [
  { id: 'Manhã', label: 'Manhã', icon: Sunrise, color: 'text-orange-400' },
  { id: 'Tarde', label: 'Tarde', icon: Sun, color: 'text-yellow-400' },
  { id: 'Noite', label: 'Noite', icon: Moon, color: 'text-blue-400' },
  { id: 'Madrugada', label: 'Madrugada', icon: CloudMoon, color: 'text-indigo-400' },
] as const;

export function PonteiroDataTable({ liveData, viewMode, setViewMode }: DataTableProps) {
  const { firestore, user } = useFirebase();
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences } = useCollection(preferencesQuery);

  const favoriteFainas = useMemo(() => {
    if (!preferences) return new Set<string>();
    return new Set(preferences.map(p => p.faina.toUpperCase()));
  }, [preferences]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ponteiro_data'), orderBy('createdAt', 'desc'), limit(1000));
  }, [firestore]);

  const { data: historyData, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const mappedHistory = useMemo(() => {
    if (!historyData) return [];
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

  const cellTextStyle = "text-[13px] font-bold tracking-tight py-1.5 px-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Filtro de Turno Principal */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Período de Referência</h4>
          </div>
          <div className="flex flex-wrap gap-3 p-1 w-fit">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setViewMode('live')}
              className={cn(
                "h-10 transition-all duration-300 flex items-center justify-center border",
                viewMode === 'live' 
                  ? "px-6 rounded-full bg-accent/10 border-accent text-accent shadow-sm" 
                  : "w-10 rounded-xl bg-background/50 border-border text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
              )}
            >
              <Zap className={cn("h-5 w-5 shrink-0", viewMode === 'live' ? "text-accent mr-2" : "text-yellow-500")} />
              {viewMode === 'live' && (
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                  Tempo Real
                </span>
              )}
            </Button>
            
            <div className="w-px h-6 bg-border/50 mx-1 self-center hidden sm:block"></div>

            {SHIFT_CONFIG.map((shift) => (
              <Button 
                key={shift.id}
                variant="outline"
                size="sm" 
                onClick={() => setViewMode(shift.id as any)}
                className={cn(
                  "h-10 transition-all duration-300 flex items-center justify-center border",
                  viewMode === shift.id 
                    ? "px-6 rounded-full bg-accent/10 border-accent text-accent shadow-sm" 
                    : "w-10 rounded-xl bg-background/50 border-border text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                )}
              >
                <shift.icon className={cn("h-5 w-5 shrink-0", viewMode === shift.id ? "text-accent mr-2" : shift.color)} />
                {viewMode === shift.id && (
                  <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                    {shift.label}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtro de Categorias */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categorias de Fainas</h4>
          </div>
          <div className="flex flex-wrap gap-3 p-1 w-fit">
            {CATEGORY_CONFIG.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  variant="outline"
                  size="sm" 
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "h-10 transition-all duration-300 flex items-center justify-center border",
                    isActive 
                      ? "px-6 rounded-full bg-accent/10 border-accent text-accent shadow-sm" 
                      : "w-10 rounded-xl bg-background/50 border-border text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-accent mr-2" : cat.color)} />
                  {isActive && (
                    <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                      {cat.label}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                {viewMode === 'live' ? <Zap className="h-5 w-5 text-yellow-500" /> : <Calendar className="h-5 w-5 text-accent" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {viewMode === 'live' ? 'Dados Recentes' : `Histórico: Turno ${viewMode}`}
                </h3>
                <p className="text-xs text-muted-foreground">Exibindo {sortedData.length} registros para {CATEGORY_CONFIG.find(c => c.id === activeCategory)?.label}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              <Button 
                variant={showFavoritesOnly ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  "h-9 px-4 border-accent/30 transition-all",
                  showFavoritesOnly ? "bg-accent/20 text-accent border-accent" : "text-muted-foreground"
                )}
                title="Mostrar apenas minhas fainas favoritas"
              >
                <Star className={cn("h-4 w-4 mr-2", showFavoritesOnly ? "fill-accent text-accent" : "")} />
                <span className="text-[10px] font-bold uppercase">Favoritos</span>
              </Button>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filtrar nesta lista..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background/50 border-border"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => exportToCSV(sortedData)}
                disabled={sortedData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {columns.map(({ key, label }) => (
                    <TableHead 
                      key={key} 
                      className={cn(
                        "cursor-pointer hover:text-accent transition-colors py-2 px-1.5 font-bold uppercase tracking-tight text-[11px]",
                        key === 'Funcao' ? "pl-4" : ""
                      )}
                      onClick={() => handleSort(key as keyof PonteiroData)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewMode !== 'live' && isHistoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground animate-pulse">
                      Buscando registros no banco de dados...
                    </TableCell>
                  </TableRow>
                ) : sortedData.length > 0 ? (
                  sortedData.map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-accent/5 transition-all duration-200 border-border/50">
                      <TableCell className={cn(cellTextStyle, "pl-4")}>
                        {row.Funcao}
                      </TableCell>
                      <TableCell className="py-1.5 px-1.5">
                        <span className={cn(
                          "font-black text-[15px] inline-block min-w-[12px] text-center",
                          row.Sinal === '-' 
                            ? "text-destructive" 
                            : "text-green-500"
                        )}>
                          {row.Sinal}
                        </span>
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-accent font-mono opacity-50")}>
                        {row.Original_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-foreground font-mono")}>
                        {row.Temporario_1}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-accent font-mono opacity-50")}>
                        {row.Original_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "text-foreground font-mono")}>
                        {row.Temporario_2}
                      </TableCell>
                      <TableCell className={cn(cellTextStyle, "whitespace-nowrap text-muted-foreground pr-4")}>
                        {row.Data_Turno}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {viewMode === 'live' 
                        ? 'Nenhum registro encontrado nos dados atuais.' 
                        : `Nenhum registro arquivado encontrado para o turno ${viewMode}.`}
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
