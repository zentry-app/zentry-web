"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Filter,
  ArrowRightLeft,
  LayoutGrid,
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "@/lib/firebase/config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// New modular components
import { ComunicadoCard } from "@/components/dashboard/comunicados/ComunicadoCard";
import { ComunicadosStats } from "@/components/dashboard/comunicados/ComunicadosStats";
import { AIGeneratorDialog } from "@/components/dashboard/comunicados/AIGeneratorDialog";

interface Comunicado {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'texto' | 'imagen' | 'pdf';
  url?: string;
  fecha: any;
  path?: string;
}

export default function ComunicadosPage() {
  const { userClaims, user } = useAuth();
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Identity states
  const [residencialDocId, setResidencialDocId] = useState<string | null>(null);
  const [residencialFieldId, setResidencialFieldId] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [comunicadoAEliminar, setComunicadoAEliminar] = useState<Comunicado | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // AI states
  const [ideaComunicado, setIdeaComunicado] = useState("");
  const [textoGenerado, setTextoGenerado] = useState("");
  const [generando, setGenerando] = useState(false);
  const [ideaOriginal, setIdeaOriginal] = useState("");

  // Real-time subscription
  useEffect(() => {
    if (!userClaims?.residencialId) return;

    const initialize = async () => {
      try {
        const residencialesRef = collection(db, 'residenciales');
        const q = query(residencialesRef, where('residencialID', '==', userClaims.residencialId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const resDoc = querySnapshot.docs[0];
          setResidencialDocId(resDoc.id);
          setResidencialFieldId(userClaims.residencialId);

          const docsRef = collection(db, 'residenciales', resDoc.id, 'documentos');
          const docsQuery = query(docsRef, orderBy('fecha', 'desc'));

          const unsubscribe = onSnapshot(docsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Comunicado));
            setComunicados(data);
            setIsLoading(false);
            setIsRefreshing(false);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, [userClaims?.residencialId]);

  const handleUpload = async () => {
    if (!residencialDocId || !residencialFieldId || titulo.trim().length === 0) return;

    setLoading(true);
    try {
      let url = '';
      let path = '';
      let tipo: 'texto' | 'imagen' | 'pdf' = 'texto';

      if (file) {
        const isPdf = file.type === 'application/pdf';
        tipo = isPdf ? 'pdf' : 'imagen';
        path = `residenciales/${residencialFieldId}/documentos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage!, path);

        toast.loading("Subiendo archivo...");
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'residenciales', residencialDocId, 'documentos'), {
        titulo: titulo,
        descripcion: descripcion || '',
        url: url || '',
        path: path || '',
        tipo: tipo,
        fecha: serverTimestamp(),
      });

      // Notify residents
      try {
        const notify = httpsCallable(functions, 'sendDocumentAnnouncement');
        await notify({
          residencialId: residencialFieldId,
          titulo: titulo,
          descripcion: descripcion || '',
          url: url || '',
          tipo: tipo
        });
        toast.success("Comunicado enviado y residentes notificados");
      } catch (e) {
        console.warn('Notification error:', e);
        toast.info("Comunicado guardado, pero hubo un error al notificar");
      }

      // Reset
      setTitulo("");
      setDescripcion("");
      setFile(null);
      setShowCreateDialog(false);

    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, titulo: string, tipo: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const extension = tipo === 'pdf' ? '.pdf' : '.jpg';
      link.download = `${titulo.replace(/[^\w\s-]/g, '')}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Descarga iniciada");
    } catch (error) {
      toast.error("Error en la descarga");
    }
  };

  const onConfirmDelete = async () => {
    if (!comunicadoAEliminar || !residencialDocId) return;

    setEliminando(true);
    try {
      if (comunicadoAEliminar.path) {
        try {
          const storageRef = ref(storage!, comunicadoAEliminar.path);
          await deleteObject(storageRef);
        } catch (error) {
          console.warn('Storage delete fail:', error);
        }
      }

      const comunicadoRef = doc(db, 'residenciales', residencialDocId, 'documentos', comunicadoAEliminar.id);
      await deleteDoc(comunicadoRef);
      toast.success("Comunicado eliminado");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setEliminando(false);
      setShowDeleteDialog(false);
      setComunicadoAEliminar(null);
    }
  };

  // IA Handlers
  const handleGenerarComunicado = async () => {
    if (!ideaComunicado.trim()) return;
    setGenerando(true);
    setIdeaOriginal(ideaComunicado);
    try {
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ idea: ideaComunicado, accion: 'generar' })
      });
      if (!response.ok) throw new Error('Error IA');
      const data = await response.json();
      setTextoGenerado(data.texto);
      toast.success("¡Comunicado generado!");
    } catch (error: any) {
      toast.error("Error al generar con IA");
    } finally {
      setGenerando(false);
    }
  };

  const handleImproveIA = async () => {
    if (!textoGenerado) return;
    setGenerando(true);
    try {
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ textoActual: textoGenerado, accion: 'mejorar' })
      });
      const data = await response.json();
      setTextoGenerado(data.texto);
      toast.success("Redacción mejorada");
    } catch (error) {
      toast.error("Error al mejorar");
    } finally {
      setGenerando(false);
    }
  };

  const handleAdjustToneIA = async (tono: string) => {
    if (!textoGenerado) return;
    setGenerando(true);
    try {
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ textoActual: textoGenerado, accion: 'ajustar-tono', tono })
      });
      const data = await response.json();
      setTextoGenerado(data.texto);
      toast.success(`Tono ajustado a ${tono}`);
    } catch (error) {
      toast.error("Error al ajustar tono");
    } finally {
      setGenerando(false);
    }
  };

  const handleUseTextIA = () => {
    if (!textoGenerado) return;
    const lineas = textoGenerado.split('\n').filter(l => l.trim());
    let finalTitle = "Comunicado Importante";
    let descStart = 0;

    const titleMatch = lineas.findIndex(l => /^(título|titulo|asunto):\s*/i.test(l));
    if (titleMatch >= 0) {
      finalTitle = lineas[titleMatch].replace(/^(título|titulo|asunto):\s*/i, '').trim();
      descStart = titleMatch + 1;
    } else if (lineas[0]?.length <= 100) {
      finalTitle = lineas[0];
      descStart = 1;
    }

    setTitulo(finalTitle.substring(0, 100));
    setDescripcion(lineas.slice(descStart).join('\n').trim() || textoGenerado);
    setShowAIDialog(false);
    setShowCreateDialog(true);
    toast.success("Texto IA aplicado");
  };

  // Helpers
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '---';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: comunicados.length,
      esteMes: comunicados.filter(c => (c.fecha?.toDate?.() || new Date(c.fecha)) > startOfMonth).length,
      porTipo: {
        texto: comunicados.filter(c => c.tipo === 'texto').length,
        imagen: comunicados.filter(c => c.tipo === 'imagen').length,
        pdf: comunicados.filter(c => c.tipo === 'pdf').length,
      }
    };
  }, [comunicados]);

  const filteredComunicados = useMemo(() => {
    return comunicados.filter(c => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return c.titulo.toLowerCase().includes(term) || c.descripcion.toLowerCase().includes(term);
    });
  }, [comunicados, searchTerm]);

  if (isLoading && !isRefreshing) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-black text-primary tracking-widest uppercase animate-pulse">Cargando Comunicados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-4 max-w-2xl">
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            Voz del Residencial
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Canal de <span className="text-gradient-zentry">Comunicados</span>
          </h1>
          <p className="text-slate-600 font-bold text-base sm:text-lg max-w-lg">
            Emite boletines, noticias y avisos urgentes con alcance inmediato y notificaciones push.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <Button
            variant="outline"
            className="rounded-2xl h-12 sm:h-14 px-6 font-black shadow-zentry bg-white/60 border-slate-300 text-slate-800 hover:bg-slate-50 transition-all w-full sm:w-auto"
            onClick={() => { setIsRefreshing(true); window.location.reload(); }}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} /> RECARGAR
          </Button>
          <Button
            onClick={() => setShowAIDialog(true)}
            className="rounded-2xl h-12 sm:h-14 px-8 font-black shadow-zentry bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-all gap-2 w-full sm:w-auto"
          >
            <Sparkles className="h-5 w-5" /> GENERAR CON IA
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-2xl h-12 sm:h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all gap-2 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" /> ENVIAR AVISO
          </Button>
        </div>
      </motion.div>

      {/* Stats Section */}
      <ComunicadosStats
        {...stats}
        isLoading={isLoading}
      />

      {/* Grid & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 backdrop-blur-xl p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-white/20 shadow-sm">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar anuncios..."
              className="pl-12 h-12 bg-white border border-slate-200 shadow-inner rounded-xl sm:rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900 w-full"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap bg-slate-200/50 p-1.5 rounded-2xl shadow-inner gap-1.5 w-full md:w-auto justify-center">
            <Badge className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl flex gap-2 items-center text-[10px] sm:text-xs">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 w-4" /> RECIENTES
            </Badge>
            <div className="px-4 py-2 text-slate-500 font-black text-[9px] sm:text-[10px] flex items-center gap-2 uppercase tracking-tight">
              <ArrowRightLeft className="h-3 w-3" /> {filteredComunicados.length} PUBLICADOS
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[250px] rounded-[2.5rem] bg-white/40 animate-pulse border border-slate-100 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredComunicados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Canal Silencioso</h3>
              <p className="text-slate-500 font-bold">No hay comunicados que coincidan con tu búsqueda.</p>
              <Button
                variant="outline"
                className="mt-6 rounded-2xl font-black"
                onClick={() => setSearchTerm("")}
              >
                VER TODOS
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              layout
            >
              {filteredComunicados.map((comunicado) => (
                <ComunicadoCard
                  key={comunicado.id}
                  comunicado={comunicado}
                  onDelete={() => { setComunicadoAEliminar(comunicado); setShowDeleteDialog(true); }}
                  onDownload={handleDownload}
                  formatDate={formatDate}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-[700px] border-none shadow-2xl rounded-[2rem] sm:rounded-[3rem] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 sm:p-8 pb-4 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Nuevo Comunicado</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold">
                  Diseña y distribuye información oficial al recinto.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-2">Título de la Noticia</Label>
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej: Mantenimiento de Áreas Verdes"
                  className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-black text-lg focus:ring-primary/20 p-6 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Cuerpo del Mensaje</Label>
                  <Button variant="ghost" size="sm" className="text-primary h-6 text-[10px] font-black" onClick={() => setShowAIDialog(true)}>
                    <Sparkles className="h-3 w-3 mr-1" /> OPTIMIZAR CON IA
                  </Button>
                </div>
                <Textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Describe los detalles importantes para los residentes..."
                  className="min-h-[160px] rounded-[2rem] bg-slate-50 border-slate-200 font-medium p-6 focus:ring-primary/20 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-2">Archivo Adjunto (Opcional)</Label>
                <div className="relative group">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    accept="application/pdf,image/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          {file.type.includes('pdf') ? <FileText /> : <ImageIcon />}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-sm text-slate-900 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 capitalize">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors" />
                        <p className="mt-2 text-xs font-black text-slate-400 uppercase tracking-widest">Click para subir PDF o Imagen</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button
              variant="ghost"
              className="rounded-2xl h-14 font-black transition-all hover:bg-slate-200"
              onClick={() => setShowCreateDialog(false)}
            >
              CANCELAR
            </Button>
            <Button
              disabled={loading || titulo.trim() === ""}
              className="rounded-2xl h-14 px-10 font-black bg-slate-900 text-white hover:bg-slate-800 shadow-zentry-lg hover-lift gap-3"
              onClick={handleUpload}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              {loading ? "ENVIANDO..." : "PUBLICAR COMUNICADO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Dialog */}
      <AIGeneratorDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        idea={ideaComunicado}
        setIdea={setIdeaComunicado}
        textoGenerado={textoGenerado}
        setTextoGenerado={setTextoGenerado}
        generando={generando}
        onGenerate={handleGenerarComunicado}
        onImprove={handleImproveIA}
        onAdjustTone={handleAdjustToneIA}
        onRegenerate={handleGenerarComunicado}
        onUseText={handleUseTextIA}
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-[450px] border-none shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] bg-white p-6 sm:p-8">
          <div className="h-16 w-16 rounded-[1.5rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-center mb-2">Eliminar Anuncio</DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-bold mb-8">
            Estás a punto de borrar permanentemente este comunicado. Esta acción no se puede deshacer.
          </DialogDescription>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" className="rounded-2xl h-14 font-black text-slate-500 hover:bg-slate-100" onClick={() => setShowDeleteDialog(false)}>CANCELAR</Button>
            <Button variant="destructive" className="rounded-2xl h-14 font-black shadow-lg hover-lift transition-all" onClick={onConfirmDelete} disabled={eliminando}>
              {eliminando ? <Loader2 className="h-5 w-5 animate-spin" /> : "BORRAR AHORA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
