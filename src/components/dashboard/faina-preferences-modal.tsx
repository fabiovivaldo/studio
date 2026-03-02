
'use client';

import React, { useState, useMemo } from 'react';
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
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
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
  ChevronDown 
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [editFaina, setEditFaina] = useState({ faina: '', chamada: '', tipo: '1' });
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAvailableFainas = useMemo(() => {
    return availableFainas.filter(f => f && f.trim() !== '');
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
      faina: newFaina.faina,
      chamada: newFaina.chamada,
      tipo: newFaina.tipo,
      userId: user.uid
    }, { merge: true });

    setNewFaina({ faina: '', chamada: '', tipo: '1' });
    setIsSubmitting(false);
    setIsPopoverOpen(false);
  };

  const handleUpdate = (id: string) => {
    if (!user || !firestore || isSubmitting) return;

    setIsSubmitting(true);
    const prefRef = doc(firestore, 'faina_preferences', id);
    setDocumentNonBlocking(prefRef, {
      ...editFaina,
      userId: user.uid
    }, { merge: true });
    setEditingId(null);
    setIsSubmitting(false);
    setIsEditPopoverOpen(false);
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
      <DialogContent className="sm:max-w-[550px] bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Preferências de Fainas</DialogTitle>
          <DialogDescription>
            Gerencie nomes personalizados e escolha o grupo de ponteiros (1 ou 2).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              Adicionar Nova Faina
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 flex flex-col md:col-span-1">
                <Label htmlFor="faina-input">Faina</Label>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative">
                      <Input
                        id="faina-input"
                        placeholder="Digite ou selecione..."
                        value={newFaina.faina}
                        onChange={(e) => {
                          setNewFaina(prev => ({ ...prev, faina: e.target.value }));
                          if (!isPopoverOpen) setIsPopoverOpen(true);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (!isPopoverOpen) setIsPopoverOpen(true);
                        }}
                        autoComplete="off"
                        className="bg-background pr-8 uppercase h-9 text-xs"
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPopoverOpen(!isPopoverOpen);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent 
                    className="w-[var(--radix-popover-anchor-width)] p-0 bg-card border-border shadow-2xl z-[150]" 
                    align="start" 
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <ScrollArea className="h-[350px] w-full" scrollHideDelay={0}>
                      <div className="p-1">
                        {searchResults.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            Nenhuma faina encontrada.
                          </div>
                        ) : (
                          searchResults.map((f) => (
                            <button
                              key={f}
                              className={cn(
                                "flex w-full items-center justify-between rounded-sm px-2 py-3 text-[10px] font-medium uppercase tracking-tight transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                                newFaina.faina === f && "bg-accent/30 text-accent"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewFaina(prev => ({ ...prev, faina: f }));
                                setIsPopoverOpen(false);
                              }}
                            >
                              <span className="truncate">{f}</span>
                              {newFaina.faina === f && <Check className="h-4 w-4 shrink-0 ml-2" />}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chamada">Chamada</Label>
                <Input 
                  id="chamada" 
                  placeholder="Ex: GRUPO A" 
                  value={newFaina.chamada}
                  onChange={(e) => setNewFaina(prev => ({ ...prev, chamada: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Ponteiro</Label>
                <Select value={newFaina.tipo} onValueChange={(v) => setNewFaina(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="z-[160]">
                    <SelectItem value="1">Tipo 1</SelectItem>
                    <SelectItem value="2">Tipo 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold h-9" 
              onClick={handleAdd}
              disabled={!newFaina.faina || !newFaina.chamada || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar Preferência
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/20">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Carregando preferências...</div>
            ) : preferences?.length ? (
              preferences.map((pref) => (
                <div key={pref.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 group">
                  {editingId === pref.id ? (
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Popover open={isEditPopoverOpen} onOpenChange={setIsEditPopoverOpen}>
                        <PopoverAnchor asChild>
                          <div className="relative">
                            <Input
                              className="h-8 text-[10px] bg-background pr-6 uppercase"
                              value={editFaina.faina} 
                              placeholder="Faina"
                              onChange={(e) => {
                                setEditFaina(prev => ({ ...prev, faina: e.target.value }));
                                if (!isEditPopoverOpen) setIsEditPopoverOpen(true);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              autoComplete="off"
                            />
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEditPopoverOpen(!isEditPopoverOpen);
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </PopoverAnchor>
                        <PopoverContent 
                          className="w-[var(--radix-popover-anchor-width)] p-0 bg-card border-border shadow-xl z-[150]" 
                          align="start" 
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <ScrollArea className="h-[300px] w-full" scrollHideDelay={0}>
                            <div className="p-1">
                              {editSearchResults.map((f) => (
                                <button
                                  key={f}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-sm px-2 py-2.5 text-[10px] font-medium uppercase transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                                    editFaina.faina === f && "bg-accent/30 text-accent"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditFaina(prev => ({ ...prev, faina: f }));
                                    setIsEditPopoverOpen(false);
                                  }}
                                >
                                  <span className="truncate">{f}</span>
                                  {editFaina.faina === f && <Check className="h-3 w-3 shrink-0 ml-1" />}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                      <Input 
                        className="h-8 text-[10px] bg-background"
                        value={editFaina.chamada} 
                        onChange={(e) => setEditFaina(prev => ({ ...prev, chamada: e.target.value }))}
                      />
                      <Select value={editFaina.tipo} onValueChange={(v) => setEditFaina(prev => ({ ...prev, tipo: v }))}>
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[160]">
                          <SelectItem value="1">Tipo 1</SelectItem>
                          <SelectItem value="2">Tipo 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{pref.faina}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">Tipo {pref.tipo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{pref.chamada}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId === pref.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleUpdate(pref.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {
                          setEditingId(null);
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-accent" 
                          onClick={() => {
                            setEditingId(pref.id);
                            setEditFaina({ faina: pref.faina, chamada: pref.chamada, tipo: pref.tipo || '1' });
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Preferência?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A faina "{pref.faina}" será removida da sua lista.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => handleDelete(pref.id)}>
                                Excluir
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
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl border-border/50">
                Nenhuma faina personalizada encontrada.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
