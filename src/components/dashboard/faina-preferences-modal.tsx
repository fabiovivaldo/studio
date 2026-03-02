
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';

export function FainaPreferencesModal() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFaina, setNewFaina] = useState({ faina: '', chamada: '' });
  const [editFaina, setEditFaina] = useState({ faina: '', chamada: '' });

  // Garantir login anônimo se necessário
  useEffect(() => {
    if (!user && !isUserLoading && isOpen) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, isOpen, auth]);

  const preferencesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faina_preferences'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: preferences, isLoading } = useCollection(preferencesQuery);

  const handleAdd = () => {
    if (!user || !newFaina.faina || !newFaina.chamada) return;
    const prefRef = doc(collection(firestore!, 'faina_preferences'));
    setDocumentNonBlocking(prefRef, {
      id: prefRef.id,
      faina: newFaina.faina,
      chamada: newFaina.chamada,
      userId: user.uid
    }, { merge: true });
    setNewFaina({ faina: '', chamada: '' });
  };

  const handleUpdate = (id: string) => {
    if (!user) return;
    const prefRef = doc(firestore!, 'faina_preferences', id);
    setDocumentNonBlocking(prefRef, {
      ...editFaina,
      userId: user.uid
    }, { merge: true });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const prefRef = doc(firestore!, 'faina_preferences', id);
    deleteDocumentNonBlocking(prefRef);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group text-muted-foreground hover:bg-muted/50 hover:text-foreground">
          <Settings className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
          Preferências
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Preferências de Fainas</DialogTitle>
          <DialogDescription>
            Gerencie nomes personalizados para suas fainas e chamadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <div className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              Adicionar Nova Faina
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faina">Faina</Label>
                <Input 
                  id="faina" 
                  placeholder="Ex: ESTIVA" 
                  value={newFaina.faina}
                  onChange={(e) => setNewFaina(prev => ({ ...prev, faina: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chamada">Chamada</Label>
                <Input 
                  id="chamada" 
                  placeholder="Ex: GRUPO A" 
                  value={newFaina.chamada}
                  onChange={(e) => setNewFaina(prev => ({ ...prev, chamada: e.target.value }))}
                />
              </div>
            </div>
            <Button className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold" onClick={handleAdd}>
              Adicionar
            </Button>
          </div>

          {/* Listagem */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Carregando preferências...</div>
            ) : preferences?.length ? (
              preferences.map((pref) => (
                <div key={pref.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 group">
                  {editingId === pref.id ? (
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input 
                        size={1}
                        value={editFaina.faina} 
                        onChange={(e) => setEditFaina(prev => ({ ...prev, faina: e.target.value }))}
                      />
                      <Input 
                        size={1}
                        value={editFaina.chamada} 
                        onChange={(e) => setEditFaina(prev => ({ ...prev, chamada: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{pref.faina}</p>
                      <p className="text-xs text-muted-foreground truncate">{pref.chamada}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId === pref.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleUpdate(pref.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
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
                            setEditFaina({ faina: pref.faina, chamada: pref.chamada });
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
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                Nenhuma faina personalizada encontrada.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper hook local para facilitar acesso ao Firebase Provider
function useFirebase() {
  const { auth, firestore, user, isUserLoading } = require('@/firebase').useFirebase();
  return { auth, firestore, user, isUserLoading };
}
