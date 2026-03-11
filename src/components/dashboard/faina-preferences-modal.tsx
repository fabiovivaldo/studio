
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Loader2, 
  Search
} from "lucide-react";
import { 
  useFirebase,
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FainaPreferencesModalProps {
  availableFainas: string[];
  trigger?: React.ReactNode;
}

export function FainaPreferencesModal({ availableFainas, trigger }: FainaPreferencesModalProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newFaina, setNewFaina] = useState({ faina: '', chamada: '', tipo: '1', modo: 'temporario' });
  const [isListVisible, setIsListVisible] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const [editFaina, setEditFaina] = useState({ faina: '', chamada: '', tipo: '1', modo: 'temporario' });
  const [isEditListVisible, setIsEditListVisible] = useState(false);
  const editListRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAvailableFainas = useMemo(() => {
    return (availableFainas || []).filter(f => f && f.trim() !== '').sort();
  }, [availableFainas]);

  const searchResults = useMemo(() => {
    if (!newFaina.faina) return filteredAvailableFainas;
    return filteredAvailableFainas.filter(f => 
      f.toLowerCase().includes(newFaina.faina.toLowerCase())
    );
  }, [filteredAvailableFainas, newFaina.faina]);

  const editSearchResults = useMemo(() => {
    if (!editFaina.faina) return filteredAvailableFainas;
    return filteredAvailableFainas.filter(f => 
      f.toLowerCase().includes(editFaina.faina.toLowerCase())
    );
  }, [filteredAvailableFainas, editFaina.faina]);

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading } = useCollection(preferencesQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
      }
      if (editListRef.current && !editListRef.current.contains(event.target as Node)) {
        setIsEditListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = () => {
    if (!user || !newFaina.faina || !newFaina.chamada || !firestore || isSubmitting) return;
    
    const normalizedNewFaina = newFaina.faina.trim().toUpperCase();
    const isDuplicate = preferences?.some(p => p.faina.trim().toUpperCase() === normalizedNewFaina);
    
    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Faina já cadastrada",
        description: "Você já possui uma preferência configurada para esta faina."
      });
      return;
    }

    setIsSubmitting(true);
    const prefRef = doc(collection(firestore, 'faina_preferences'));
    
    setDocumentNonBlocking(prefRef, {
      id: prefRef.id,
      faina: normalizedNewFaina,
      chamada: newFaina.chamada.toUpperCase().trim(),
      tipo: newFaina.tipo,
      modo: newFaina.modo,
      userId: user.uid
    }, { merge: true });

    setNewFaina({ faina: '', chamada: '', tipo: '1', modo: 'temporario' });
    setIsSubmitting(false);
    setIsListVisible(false);
  };

  const handleUpdate = (id: string) => {
    if (!user || !firestore || isSubmitting) return;

    setIsSubmitting(true);
    const prefRef = doc(firestore, 'faina_preferences', id);
    setDocumentNonBlocking(prefRef, {
      ...editFaina,
      faina: editFaina.faina.trim().toUpperCase(),
      chamada: editFaina.chamada.trim().toUpperCase(),
      userId: user.uid
    }, { merge: true });
    setEditingId(null);
    setIsSubmitting(false);
    setIsEditListVisible(false);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const prefRef = doc(firestore, 'faina_preferences', id);
    deleteDocumentNonBlocking(prefRef);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            <Settings className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
            Preferências
          </button>
        )}
      </DialogTrigger>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[750px] bg-background border-border max-h-[90vh] overflow-hidden flex flex-col p-0"
      >
        <div className="p-8 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Preferências de Fainas</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Personalize as fainas e números de chamada para os cálculos de proximidade.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-10 mt-6">
          <div className="space-y-6 p-6 rounded-2xl bg-muted/20 border border-border">
            <h4 className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.15em] text-primary">
              <Plus className="h-4 w-4" />
              Adicionar Nova Faina
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2 relative" ref={listRef}>
                <Label htmlFor="faina-input" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Faina</Label>
                <div className="relative">
                  <Input
                    id="faina-input"
                    placeholder="BUSQUE A FAINA..."
                    value={newFaina.faina}
                    onChange={(e) => {
                      setNewFaina(prev => ({ ...prev, faina: e.target.value }));
                      setIsListVisible(true);
                    }}
                    onFocus={() => setIsListVisible(true)}
                    autoComplete="off"
                    className="bg-background pr-10 uppercase h-12 text-sm font-bold border-border focus:ring-1 focus:ring-primary"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                </div>
                
                {isListVisible && (
                  <div className="absolute z-[100] w-full mt-2 bg-popover border border-border shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <ScrollArea className="h-48">
                      <div className="p-1">
                        {searchResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            Nenhuma faina disponível.
                          </div>
                        ) : (
                          searchResults.map((f) => (
                            <button
                              key={f}
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-tight transition-all hover:bg-primary/10 hover:text-primary text-left border-b border-border last:border-0",
                                newFaina.faina === f && "bg-primary/10 text-primary"
                              )}
                              onClick={() => {
                                setNewFaina(prev => ({ ...prev, faina: f }));
                                setIsListVisible(false);
                              }}
                            >
                              {f}
                              {newFaina.faina === f && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chamada" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Chamada</Label>
                  <Input 
                    id="chamada" 
                    placeholder="000" 
                    value={newFaina.chamada}
                    onChange={(e) => setNewFaina(prev => ({ ...prev, chamada: e.target.value }))}
                    className="h-12 text-sm font-bold uppercase bg-background border-border focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Grupo</Label>
                  <Select value={newFaina.tipo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, tipo: v }))}>
                    <SelectTrigger className="h-12 text-sm font-bold bg-background border-border focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="1" className="text-xs font-bold uppercase">Grupo 1</SelectItem>
                      <SelectItem value="2" className="text-xs font-bold uppercase">Grupo 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Modo</Label>
                  <Select value={newFaina.modo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, modo: v }))}>
                    <SelectTrigger className="h-12 text-sm font-bold bg-background border-border focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="Modo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="original" className="text-xs font-bold uppercase">Original</SelectItem>
                      <SelectItem value="temporario" className="text-xs font-bold uppercase">Ponteiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 uppercase tracking-[0.1em] text-[11px] shadow-lg transition-all" 
              onClick={handleAdd}
              disabled={!newFaina.faina || !newFaina.chamada || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Salvar Faina Prioritária
            </Button>
          </div>

          <div className="space-y-5">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-3">
              <span>Minhas Fainas Ativas ({preferences?.length || 0})</span>
              <div className="h-px flex-1 bg-border"></div>
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="text-center py-10 animate-pulse text-xs font-bold uppercase tracking-widest text-muted-foreground">Sincronizando...</div>
              ) : preferences?.length ? (
                preferences.map((pref) => (
                  <div key={pref.id} className="group relative bg-card border border-border rounded-xl p-5 hover:bg-muted/10 transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 rounded-l-xl"></div>
                    
                    <div className="flex items-center justify-between gap-4">
                      {editingId === pref.id ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 relative" ref={editListRef}>
                          <div className="relative">
                            <Input
                              className="h-10 text-xs font-bold bg-background border-border uppercase focus:ring-1 focus:ring-primary"
                              value={editFaina.faina} 
                              onChange={(e) => {
                                setEditFaina(prev => ({ ...prev, faina: e.target.value }));
                                setIsEditListVisible(true);
                              }}
                              onFocus={() => setIsEditListVisible(true)}
                              autoComplete="off"
                            />
                            {isEditListVisible && (
                              <div className="absolute z-[110] w-full mt-1 bg-popover border border-border shadow-2xl rounded-lg overflow-hidden">
                                <ScrollArea className="h-40">
                                  <div className="p-1">
                                    {editSearchResults.map((f) => (
                                      <button
                                        key={f}
                                        className="flex w-full px-3 py-2.5 text-[10px] font-bold uppercase hover:bg-primary/10 border-b border-border last:border-0 text-left"
                                        onClick={() => {
                                          setEditFaina(prev => ({ ...prev, faina: f }));
                                          setIsEditListVisible(false);
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
                          <Input 
                            className="h-10 text-xs font-bold bg-background border-border uppercase focus:ring-1 focus:ring-primary"
                            placeholder="CH"
                            value={editFaina.chamada} 
                            onChange={(e) => setEditFaina(prev => ({ ...prev, chamada: e.target.value }))}
                          />
                          <Select value={editFaina.tipo} onValueChange={(v) => setEditFaina(prev => ({ ...prev, tipo: v }))}>
                            <SelectTrigger className="h-10 text-xs font-bold bg-background border-border focus:ring-1 focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="1" className="text-[10px] font-bold">G1</SelectItem>
                              <SelectItem value="2" className="text-[10px] font-bold">G2</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={editFaina.modo} onValueChange={(v) => setEditFaina(prev => ({ ...prev, modo: v }))}>
                            <SelectTrigger className="h-10 text-xs font-bold bg-background border-border focus:ring-1 focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="original" className="text-[10px] font-bold">ORIG</SelectItem>
                              <SelectItem value="temporario" className="text-[10px] font-bold">PONT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold uppercase truncate text-foreground tracking-tight">{pref.faina}</p>
                            <div className="flex gap-1">
                              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-black uppercase border border-primary/20">G{pref.tipo}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-accent/10 text-accent font-black uppercase border border-accent/20">{pref.modo === 'original' ? 'ORIG' : 'PONT'}</span>
                            </div>
                          </div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase mt-1.5 opacity-70">Chamada: <span className="text-primary font-mono">{pref.chamada}</span></p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {editingId === pref.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-green-500 hover:bg-green-500/10" onClick={() => handleUpdate(pref.id)}>
                              <Check className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted/50" onClick={() => {
                              setEditingId(null);
                              setIsEditListVisible(false);
                            }}>
                              <X className="h-5 w-5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10" 
                              onClick={() => {
                                setEditingId(pref.id);
                                setEditFaina({ faina: pref.faina, chamada: pref.chamada, tipo: pref.tipo || '1', modo: pref.modo || 'temporario' });
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-background border-border rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="uppercase font-black text-sm text-foreground tracking-widest">Excluir?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs font-medium text-muted-foreground">
                                    Remover "{pref.faina}" das prioridades?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6">
                                  <AlertDialogCancel className="text-[10px] font-black uppercase tracking-widest rounded-xl border-border h-10 bg-transparent text-foreground hover:bg-muted">Não</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive hover:bg-destructive/80 text-[10px] font-black uppercase tracking-widest rounded-xl h-10" onClick={() => handleDelete(pref.id)}>
                                    Sim
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Lista vazia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
