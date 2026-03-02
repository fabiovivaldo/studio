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
  LayoutGrid
} from "lucide-react";
import { PonteiroData, exportToCSV } from "@/lib/data-service";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataTableProps {
  data: PonteiroData[];
}

export function PonteiroDataTable({ data }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

  // Extrair categorias baseadas na primeira palavra da faina
  const categories = useMemo(() => {
    const cats = data.map(item => item.Funcao.split('-')[0].split(' ')[0].trim());
    return ["TODOS", ...Array.from(new Set(cats))].sort();
  }, [data]);

  const handleSort = (key: keyof PonteiroData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesFilter = Object.values(item).some(val => 
        val.toLowerCase().includes(filter.toLowerCase())
      );
      
      const firstWord = item.Funcao.split('-')[0].split(' ')[0].trim();
      const matchesCategory = activeCategory === "TODOS" || firstWord === activeCategory;
      
      return matchesFilter && matchesCategory;
    });
  }, [data, filter, activeCategory]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar faina ou sinal..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 bg-secondary/50 border-border focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => exportToCSV(sortedData)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Abas de Categorias */}
        <Tabs 
          value={activeCategory} 
          onValueChange={setActiveCategory} 
          className="w-full"
        >
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-accent/20">
            <TabsList className="bg-muted/30 border border-border h-auto p-1 inline-flex whitespace-nowrap">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden shadow-2xl transition-all duration-300">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead 
                  key={key} 
                  className="cursor-pointer hover:text-accent transition-colors py-4 font-headline uppercase tracking-wider text-[10px]"
                  onClick={() => handleSort(key as keyof PonteiroData)}
                >
                  <div className="flex items-center gap-2">
                    {label}
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((row, idx) => (
                <TableRow key={idx} className="group hover:bg-accent/5 transition-all duration-200">
                  <TableCell className="text-[11px] whitespace-nowrap text-muted-foreground">{row.Data_Turno}</TableCell>
                  <TableCell className="font-medium">{row.Funcao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary-foreground font-mono">
                      {row.Sinal}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">{row.Original_1}</TableCell>
                  <TableCell className="text-accent font-mono font-semibold">{row.Temporario_1}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">{row.Original_2}</TableCell>
                  <TableCell className="text-accent font-mono font-semibold">{row.Temporario_2}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <LayoutGrid className="h-8 w-8 opacity-20" />
                    Nenhum registro encontrado para esta categoria.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          Exibindo <span className="text-foreground font-medium">{sortedData.length}</span> registros nesta categoria
        </p>
        <Badge variant="outline" className="text-[10px] uppercase font-bold text-accent border-accent/20">
          Lista Contínua Ativada
        </Badge>
      </div>
    </div>
  );
}