
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Loader2, 
  Search,
  Edit2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FainaPreferencesModalProps {
  availableFainas: string[];
  trigger?: React.ReactNode;
}

export function FainaPreferencesModal({ availableFainas, trigger }: FainaPreferencesModalProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);
  
  const [newFaina, setNewFaina] = useState({ 
    faina: '', 
    chamada: '', 
    teto: '400',
    tipo: '1', 
    modo: 'temporario' 
  });
  const [isListVisible, setIsListVisible] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar do LocalStorage no início
  useEffect(() => {
    const saved = localStorage.getItem('faina_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    const handleUpdate = () => {
      const updated = localStorage.getItem('faina_preferences');
      if (updated) setPreferences(JSON.parse(updated));
    };

    window.addEventListener('faina_preferences_updated', handleUpdate);
    return () => window.removeEventListener('faina_preferences_updated', handleUpdate);
  }, []);

  const filteredAvailableFainas = useMemo(() => {
    return (availableFainas || []).filter(f => f && f.trim() !== '').sort();
  }, [availableFainas]);

  const searchResults = useMemo(() => {
    if (!newFaina.faina) return filteredAvailableFainas;
    return filteredAvailableFainas.filter(f => 
      f.toLowerCase().includes(newFaina.faina.toLowerCase())
    );
  }, [filteredAvailableFainas, newFaina.faina]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = () => {
    if (!newFaina.faina || !newFaina.chamada || isSubmitting) return;
    
    const normalizedNewFaina = newFaina.faina.trim().toUpperCase();
    
    if (!editingId) {
      const isDuplicate = preferences.some(p => p.faina.trim().toUpperCase() === normalizedNewFaina);
      if (isDuplicate) {
        toast({
          variant: "destructive",
          title: "Já cadastrada",
          description: "Esta faina já está na sua lista."
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    let updatedPrefs;
    if (editingId) {
      updatedPrefs = preferences.map(p => p.id === editingId ? {
        ...p,
        faina: normalizedNewFaina,
        chamada: newFaina.chamada.toUpperCase().trim(),
        teto: newFaina.teto.trim() || '400',
        tipo: newFaina.tipo,
        modo: newFaina.modo,
      } : p);
    } else {
      const newPref = {
        id: crypto.randomUUID(),
        faina: normalizedNewFaina,
        chamada: newFaina.chamada.toUpperCase().trim(),
        teto: newFaina.teto.trim() || '400',
        tipo: newFaina.tipo,
        modo: newFaina.modo,
      };
      updatedPrefs = [...preferences, newPref];
    }

    localStorage.setItem('faina_preferences', JSON.stringify(updatedPrefs));
    setPreferences(updatedPrefs);
    window.dispatchEvent(new Event('faina_preferences_updated'));

    setNewFaina({ faina: '', chamada: '', teto: '400', tipo: '1', modo: 'temporario' });
    setEditingId(null);
    setIsSubmitting(false);
    setIsListVisible(false);

    toast({
      title: editingId ? "Configuração Atualizada" : "Configuração Salva",
      description: `A faina ${normalizedNewFaina} foi processada localmente.`,
    });
  };

  const handleEdit = (pref: any) => {
    setEditingId(pref.id);
    setNewFaina({
      faina: pref.faina,
      chamada: pref.chamada,
      teto: pref.teto || '400',
      tipo: pref.tipo,
      modo: pref.modo
    });
    setIsListVisible(false);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    const updatedPrefs = preferences.filter(p => p.id !== deleteConfirmId);
    localStorage.setItem('faina_preferences', JSON.stringify(updatedPrefs));
    setPreferences(updatedPrefs);
    window.dispatchEvent(new Event('faina_preferences_updated'));
    
    if (editingId === deleteConfirmId) {
      setEditingId(null);
      setNewFaina({ faina: '', chamada: '', teto: '400', tipo: '1', modo: 'temporario' });
    }
    setDeleteConfirmId(null);
    toast({
      title: "Removido",
      description: "Faina removida da lista local.",
    });
  };

  const handleNumericInput = (value: string, field: 'chamada' | 'teto') => {
    const cleanValue = value.replace(/\D/g, '');
    setNewFaina(prev => ({ ...prev, [field]: cleanValue }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingId(null);
            setNewFaina({ faina: '', chamada: '', teto: '400', tipo: '1', modo: 'temporario' });
          }
      }}>
        <DialogTrigger asChild>
          {trigger || (
            <button className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <Settings className="h-5 w-5 mr-3" />
              Preferências
            </button>
          )}
        </DialogTrigger>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col p-0"
        >
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {editingId ? "Editar Localmente" : "Minhas Fainas (Local)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 uppercase font-bold opacity-70">
                Os dados são salvos apenas neste navegador.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6 mt-4">
            <div className={cn(
              "space-y-4 p-5 rounded-xl border transition-all duration-300",
              editingId 
                ? "bg-yellow-400/5 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] ring-1 ring-yellow-400/50" 
                : "bg-muted/20 border-border"
            )}>
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  "text-[10px] font-black flex items-center gap-2 uppercase tracking-widest",
                  editingId ? "text-yellow-500" : "text-primary"
                )}>
                  {editingId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {editingId ? "Atualizar Faina" : "Adicionar Faina"}
                </h4>
                {editingId && (
                  <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 text-[9px] uppercase font-black bg-red-500 hover:bg-red-600 text-white border-none shadow-sm"
                      onClick={() => {
                          setEditingId(null);
                          setNewFaina({ faina: '', chamada: '', teto: '400', tipo: '1', modo: 'temporario' });
                      }}
                  >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Cancelar
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5 relative" ref={listRef}>
                  <Label className="text-[9px] font-black uppercase text-muted-foreground/70">Faina</Label>
                  <div className="relative">
                    <Input
                      placeholder="BUSCAR..."
                      value={newFaina.faina}
                      onChange={(e) => {
                        setNewFaina(prev => ({ ...prev, faina: e.target.value }));
                        setIsListVisible(true);
                      }}
                      onFocus={() => setIsListVisible(true)}
                      className="h-10 text-xs font-bold uppercase bg-background"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                  </div>
                  
                  {isListVisible && (
                    <div className="absolute z-[100] w-full mt-1 bg-popover border border-border shadow-xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
                      <ScrollArea className="h-40">
                        <div className="p-1">
                          {searchResults.map((f) => (
                            <button
                              key={f}
                              type="button"
                              className="flex w-full px-3 py-2 text-[10px] font-bold uppercase hover:bg-primary/10 text-left border-b border-border last:border-0"
                              onClick={() => {
                                setNewFaina(prev => ({ ...prev, faina: f }));
                                setIsListVisible(false);
                              }}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/70">Nº Chamada</Label>
                    <Input 
                      placeholder="130" 
                      value={newFaina.chamada}
                      onChange={(e) => handleNumericInput(e.target.value, 'chamada')}
                      className="h-10 text-xs font-bold uppercase bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/70">Teto</Label>
                    <Input 
                      placeholder="400" 
                      value={newFaina.teto}
                      onChange={(e) => handleNumericInput(e.target.value, 'teto')}
                      className="h-10 text-xs font-bold uppercase bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/70">Grupo</Label>
                    <Select value={newFaina.tipo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, tipo: v }))}>
                      <SelectTrigger className="h-10 text-xs font-bold uppercase bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1" className="text-[10px] font-bold uppercase">Cad</SelectItem>
                        <SelectItem value="2" className="text-[10px] font-bold uppercase">Reg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/70">Monitorar</Label>
                    <Select value={newFaina.modo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, modo: v }))}>
                      <SelectTrigger className="h-10 text-xs font-bold uppercase bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original" className="text-[10px] font-bold uppercase">Orig</SelectItem>
                        <SelectItem value="temporario" className="text-[10px] font-bold uppercase">Pont</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                className={cn(
                  "w-full font-black h-10 uppercase tracking-widest text-[10px]",
                  editingId ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"
                )} 
                onClick={handleAdd}
                disabled={!newFaina.faina || !newFaina.chamada || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  editingId ? "Atualizar Configuração" : "Salvar Configuração"
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Minha Lista Local</h4>
              <div className="space-y-3">
                {preferences.length === 0 && (
                  <p className="text-[10px] italic text-muted-foreground text-center py-4">Nenhuma faina salva localmente.</p>
                )}
                {preferences.map((pref) => (
                  <div 
                    key={pref.id} 
                    className={cn(
                      "bg-card border rounded-lg p-3 flex items-center justify-between transition-all hover:border-primary/50 group",
                      editingId === pref.id ? "border-yellow-400 ring-1 ring-yellow-400" : "border-border"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-[11px] font-black uppercase truncate transition-colors",
                        editingId === pref.id ? "text-yellow-500" : "group-hover:text-primary"
                      )}>{pref.faina}</p>
                      <div className="flex gap-3 mt-1">
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          editingId === pref.id ? "text-yellow-600" : "text-primary"
                        )}>CH: {pref.chamada}</span>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground/60">
                          {pref.tipo === '1' ? 'CAD' : 'REG'} - {pref.modo === 'original' ? 'ORIG' : 'PONT'} (Teto: {pref.teto || '400'})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-7 w-7 transition-colors",
                            editingId === pref.id ? "text-yellow-500 hover:bg-yellow-400/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          )} 
                          onClick={() => handleEdit(pref)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                          onClick={() => setDeleteConfirmId(pref.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="max-w-[350px] border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black uppercase tracking-tight">Confirmar Exclusão?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase font-bold text-muted-foreground">
              Esta faina será removida da sua lista local permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-8 text-[9px] uppercase font-black">Não</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="h-8 text-[9px] uppercase font-black bg-destructive hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
