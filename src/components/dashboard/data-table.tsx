
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
  Calendar
} from "lucide-react";
import { PonteiroData, exportToCSV } from "@/lib/data-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface DataTableProps {
  liveData: PonteiroData[];
}

type ViewMode = 'live' | 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

const CATEGORY_CONFIG = [
  { id: "TODOS", label: "Todos", icon: Filter, color: "text-accent" },
  { id: "ARRUMADOR", label: "Arrumador", icon: Users, color: "text-blue-400" },
  { id: "BLOCO", label: "Bloco", icon: LayoutGrid, color: "text-purple-400" },
  { id: "CONFERENTE", label: "Conferente", icon: ClipboardList, color: "text-orange-400" },
  { id: "CONSERTADOR", label: "Consertador", icon: Wrench, color: "text-green-400" },
  { id: "ESTIVA", label: "Estiva", icon: HardHat, color: "text-yellow-400" },
  { id: "VIGIA", label: "Vigia", icon: Eye, color: "text-red-400" },
];

const SHIFT_CONFIG = [
  { id: 'Manhã', label: 'Manhã', icon: Sunrise, color: 'text-orange-400' },
  { id: 'Tarde', label: 'Tarde', icon: Sun, color: 'text-yellow-400' },
  { id: 'Noite', label: 'Noite', icon: Moon, color: 'text-blue-400' },
  { id: 'Madrugada', label: 'Madrugada', icon: CloudMoon, color: 'text-indigo-400' },
] as const;

export function PonteiroDataTable({ liveData }: DataTableProps) {
  const { firestore } = useFirebase();
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>("TODOS");

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
    if (!activeCategory) return [];

    return currentData.filter(item => {
      const matchesFilter = Object.values(item).some(val => 
        String(val).toLowerCase().includes(filter.toLowerCase())
      );
      
      const functionUpper = item.Funcao.toUpperCase();
      const matchesCategory = activeCategory === "TODOS" || functionUpper.includes(activeCategory);
      
      return matchesFilter && matchesCategory;
    });
  }, [currentData, filter, activeCategory]);

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
    { key: 'Data_Turno', label: 'Data / Turno' },
    { key: 'Funcao', label: 'Faina' },
    { key: 'Sinal', label: 'Sinal' },
    { key: 'Original_1', label: 'Original 1' },
    { key: 'Temporario_1', label: 'Temp 1' },
    { key: 'Original_2', label: 'Original 2' },
    { key: 'Temporario_2', label: 'Temp 2' },
  ] as const;

  // Classe utilitária para manter a mesma fonte e tamanho em toda a linha e reduzir altura
  const cellTextStyle = "text-[11px] font-bold tracking-tight py-1.5";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        <Button 
          variant={viewMode === 'live' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setViewMode('live')}
          className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg px-4"
        >
          <Zap className="h-4 w-4 mr-2 text-yellow-500" />
          Tempo Real
        </Button>
        
        <div className="w-px h-6 bg-border/50 mx-1 self-center hidden sm:block"></div>

        {SHIFT_CONFIG.map((shift) => (
          <Button 
            key={shift.id}
            variant={viewMode === shift.id ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode(shift.id as any)}
            className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg px-4"
          >
            <shift.icon className={`h-4 w-4 mr-2 ${shift.color}`} />
            {shift.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORY_CONFIG.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(isActive ? null : cat.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group
                ${isActive 
                  ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                  : 'bg-card/50 border-border hover:border-accent/50 hover:bg-accent/5'}
              `}
            >
              <Icon className={`h-6 w-6 mb-2 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : cat.color}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {cat.label}
              </span>
              {isActive && (
                <div className="mt-2 h-1 w-4 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {!activeCategory ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/20 border border-dashed border-border rounded-2xl">
          <Filter className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground font-medium">Selecione uma categoria acima.</p>
        </div>
      ) : (
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

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
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
                        className="cursor-pointer hover:text-accent transition-colors py-2 font-headline uppercase tracking-wider text-[9px]"
                        onClick={() => handleSort(key as keyof PonteiroData)}
                      >
                        <div className="flex items-center gap-2">
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
                        <TableCell className={cn(cellTextStyle, "whitespace-nowrap text-muted-foreground")}>
                          {row.Data_Turno}
                        </TableCell>
                        <TableCell className={cellTextStyle}>
                          {row.Funcao}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className={cn(
                            "border-opacity-20 px-2 font-black text-[11px]",
                            row.Sinal === '-' 
                              ? "bg-destructive/10 border-destructive/20 text-destructive" 
                              : "bg-green-500/10 border-green-500/20 text-green-500"
                          )}>
                            {row.Sinal}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                          {row.Original_1}
                        </TableCell>
                        <TableCell className={cn(cellTextStyle, "text-accent font-mono")}>
                          {row.Temporario_1}
                        </TableCell>
                        <TableCell className={cn(cellTextStyle, "text-muted-foreground font-mono")}>
                          {row.Original_2}
                        </TableCell>
                        <TableCell className={cn(cellTextStyle, "text-accent font-mono")}>
                          {row.Temporario_2}
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
      )}
    </div>
  );
}
