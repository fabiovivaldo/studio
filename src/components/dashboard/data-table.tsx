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
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Download, 
  Search
} from "lucide-react";
import { PonteiroData, exportToCSV } from "@/lib/data-service";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  data: PonteiroData[];
}

export function PonteiroDataTable({ data }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof PonteiroData; direction: 'asc' | 'desc' } | null>(null);
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: keyof PonteiroData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      Object.values(item).some(val => 
        val.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    { key: 'Data_Turno', label: 'Data / Turno' },
    { key: 'Funcao', label: 'Função' },
    { key: 'Sinal', label: 'Sinal' },
    { key: 'Original_1', label: 'Original 1' },
    { key: 'Temporario_1', label: 'Temp 1' },
    { key: 'Original_2', label: 'Original 2' },
    { key: 'Temporario_2', label: 'Temp 2' },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar função ou sinal..." 
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
            {currentData.length > 0 ? (
              currentData.map((row, idx) => (
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
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="text-foreground font-medium">{Math.min(currentData.length, itemsPerPage)}</span> de <span className="text-foreground font-medium">{sortedData.length}</span> resultados
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="hover:bg-accent/20 text-muted-foreground hover:text-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                    <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 ${currentPage === pageNum ? 'bg-primary shadow-lg shadow-primary/30' : 'text-muted-foreground'}`}
                    >
                        {pageNum}
                    </Button>
                );
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:bg-accent/20 text-muted-foreground hover:text-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}