
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
  ChevronDown,
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
  
  const [newFaina, setNewFaina] = useState({ faina: '', chamada: '', tipo: '1' });
  const [isListVisible, setIsListVisible] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const [editFaina, setEditFaina] = useState({ faina: '', chamada: '', tipo: '1' });
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

  // Fechar listas ao clicar fora
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
    
    const isDuplicate = preferences?.some(p => p.faina === newFaina.faina);
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
      faina: newFaina.faina.toUpperCase(),
      chamada: newFaina.chamada.toUpperCase(),
      tipo: newFaina.tipo,
      userId: user.uid
    }, { merge: true });

    setNewFaina({ faina: '', chamada: '', tipo: '1' });
    setIsSubmitting(false);
    setIsListVisible(false);
  };

  const handleUpdate = (id: string) => {
    if (!user || !firestore || isSubmitting) return;

    setIsSubmitting(true);
    const prefRef = doc(firestore, 'faina_preferences', id);
    setDocumentNonBlocking(prefRef, {
      ...editFaina,
      faina: editFaina.faina.toUpperCase(),
      chamada: editFaina.chamada.toUpperCase(),
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
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preferências de Fainas</DialogTitle>
          <DialogDescription>
            Personalize os nomes das fainas e escolha o grupo de ponteiros (1 ou 2).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1 space-y-6">
          {/* Formulário de Adição */}
          <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <h4 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-accent">
              <Plus className="h-4 w-4" />
              Adicionar Nova Faina
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Campo Faina com Lista Sugerida */}
              <div className="md:col-span-5 space-y-2 relative" ref={listRef}>
                <Label htmlFor="faina-input">Faina</Label>
                <div className="relative">
                  <Input
                    id="faina-input"
                    placeholder="DIGITE OU BUSQUE..."
                    value={newFaina.faina}
                    onChange={(e) => {
                      setNewFaina(prev => ({ ...prev, faina: e.target.value }));
                      setIsListVisible(true);
                    }}
                    onFocus={() => setIsListVisible(true)}
                    autoComplete="off"
                    className="bg-background pr-8 uppercase h-9 text-xs font-bold"
                  />
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                </div>
                
                {isListVisible && (
                  <div className="absolute z-[100] w-full mt-1 bg-card border border-border shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="h-48">
                      <div className="p-1">
                        {searchResults.length === 0 ? (
                          <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                            Nenhuma faina encontrada.
                          </div>
                        ) : (
                          searchResults.map((f) => (
                            <button
                              key={f}
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-tight transition-colors hover:bg-accent hover:text-accent-foreground text-left border-b border-border/30 last:border-0",
                                newFaina.faina === f && "bg-accent/20 text-accent"
                              )}
                              onClick={() => {
                                setNewFaina(prev => ({ ...prev, faina: f }));
                                setIsListVisible(false);
                              }}
                            >
                              {f}
                              {newFaina.faina === f && <Check className="h-3 w-3" />}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label htmlFor="chamada">Nome Exibido (Chamada)</Label>
                <Input 
                  id="chamada" 
                  placeholder="EX: TURMA A" 
                  value={newFaina.chamada}
                  onChange={(e) => setNewFaina(prev => ({ ...prev, chamada: e.target.value }))}
                  className="h-9 text-xs font-bold uppercase"
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <Label>Grupo</Label>
                <Select value={newFaina.tipo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger className="h-9 text-xs font-bold">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="1" className="text-xs">Grupo 1</SelectItem>
                    <SelectItem value="2" className="text-xs">Grupo 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold h-9 uppercase tracking-widest text-[10px]" 
              onClick={handleAdd}
              disabled={!newFaina.faina || !newFaina.chamada || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Salvar Faina Prioritária
            </Button>
          </div>

          {/* Lista de Preferências Existentes */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
              Minhas Fainas Ativas ({preferences?.length || 0})
            </h4>
            
            <div className="space-y-2 pb-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse text-xs">Sincronizando...</div>
              ) : preferences?.length ? (
                preferences.map((pref) => (
                  <div key={pref.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-all group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl opacity-40"></div>
                    
                    {editingId === pref.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 relative" ref={editListRef}>
                        <div className="relative">
                          <Input
                            className="h-8 text-[10px] font-bold bg-background uppercase"
                            value={editFaina.faina} 
                            onChange={(e) => {
                              setEditFaina(prev => ({ ...prev, faina: e.target.value }));
                              setIsEditListVisible(true);
                            }}
                            onFocus={() => setIsEditListVisible(true)}
                            autoComplete="off"
                          />
                          {isEditListVisible && (
                            <div className="absolute z-[110] w-full mt-1 bg-card border border-border shadow-2xl rounded-lg overflow-hidden">
                              <ScrollArea className="h-40">
                                <div className="p-1">
                                  {editSearchResults.map((f) => (
                                    <button
                                      key={f}
                                      className="flex w-full px-2 py-2 text-[10px] font-bold uppercase hover:bg-accent hover:text-accent-foreground"
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
                          className="h-8 text-[10px] font-bold bg-background uppercase"
                          value={editFaina.chamada} 
                          onChange={(e) => setEditFaina(prev => ({ ...prev, chamada: e.target.value }))}
                        />
                        <Select value={editFaina.tipo} onValueChange={(v) => setEditFaina(prev => ({ ...prev, tipo: v }))}>
                          <SelectTrigger className="h-8 text-[10px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200]">
                            <SelectItem value="1" className="text-xs">G1</SelectItem>
                            <SelectItem value="2" className="text-xs">G2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase truncate tracking-tight">{pref.faina}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black uppercase">Grupo {pref.tipo}</span>
                        </div>
                        <p className="text-[10px] font-bold text-accent uppercase mt-0.5">{pref.chamada}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === pref.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleUpdate(pref.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {
                            setEditingId(null);
                            setIsEditListVisible(false);
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-accent hover:bg-accent/10" 
                            onClick={() => {
                              setEditingId(pref.id);
                              setEditFaina({ faina: pref.faina, chamada: pref.chamada, tipo: pref.tipo || '1' });
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
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="uppercase font-black text-sm">Excluir Preferência?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Isso removerá a faina "{pref.faina}" do seu dashboard prioritário.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-xs font-bold">Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/80 text-xs font-bold" onClick={() => handleDelete(pref.id)}>
                                  Sim, Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl border-border/50 bg-muted/5">
                  <Settings className="h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nenhuma faina prioritária</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
