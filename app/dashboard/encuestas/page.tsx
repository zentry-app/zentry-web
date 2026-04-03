"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Filter,
  ArrowRightLeft,
  LayoutGrid,
  AlertCircle,
  TrendingUp,
  PieChart,
  Target
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRequired } from '@/lib/hooks';
import { SurveyService } from '@/lib/services/survey-service';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { SurveyCard } from "@/components/dashboard/encuestas/SurveyCard";
import { EncuestasStats } from "@/components/dashboard/encuestas/EncuestasStats";
import { CreateSurveyDialog } from '@/components/admin/encuestas/CreateSurveyDialog';
import { SurveyResultsDialog } from '@/components/admin/encuestas/SurveyResultsDialog';

type Survey = {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaFin: string;
  status: 'pending' | 'concluida';
  totalRespuestas: number;
  preguntas: Array<{
    pregunta: string;
    tipo: string;
    opciones?: string[];
  }>;
  creadorUid: string;
  residencialId: string;
  residencialDocId: string;
};

type SurveyStats = {
  totalSurveys: number;
  activeSurveys: number;
  completedSurveys: number;
  totalResponses: number;
};

export default function DashboardSurveysPage() {
  const { user, userClaims } = useAuth();
  const { isAdmin, isUserLoading } = useAdminRequired();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);

  const esAdminGlobal = userClaims?.isGlobalAdmin === true;
  const esAdminDeResidencial = userClaims?.role === 'admin' && !esAdminGlobal;

  const [managedResidencialId, setManagedResidencialId] = useState<string | null>(null);

  // Helper to get docId
  const obtenerResidencialDocId = async (residencialID: string): Promise<string | null> => {
    try {
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('residencialID', '==', residencialID), limit(1));
      const snapshot = await getDocs(q);
      return !snapshot.empty ? snapshot.docs[0].id : null;
    } catch (error) {
      return null;
    }
  };

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (esAdminDeResidencial && managedResidencialId) {
        const fetchedSurveys = await SurveyService.getSurveysByResidencial(managedResidencialId);
        const now = new Date();
        const active = fetchedSurveys.filter(s => s.status === 'pending' && new Date(s.fechaFin) > now).length;
        const completed = fetchedSurveys.filter(s => s.status === 'concluida' || new Date(s.fechaFin) <= now).length;
        const totalRes = fetchedSurveys.reduce((sum, s) => sum + s.totalRespuestas, 0);
        data = {
          surveys: fetchedSurveys,
          stats: { totalSurveys: fetchedSurveys.length, activeSurveys: active, completedSurveys: completed, totalResponses: totalRes }
        };
      } else if (esAdminGlobal) {
        data = await SurveyService.getAllSurveys();
      } else {
        setSurveys([]);
        setStats({ totalSurveys: 0, activeSurveys: 0, completedSurveys: 0, totalResponses: 0 });
        setLoading(false);
        return;
      }

      setSurveys(data.surveys);
      setStats(data.stats);
    } catch (err: any) {
      toast.error('No se pudieron cargar las encuestas');
    } finally {
      setLoading(false);
    }
  }, [esAdminDeResidencial, managedResidencialId, esAdminGlobal]);

  useEffect(() => {
    const initialize = async () => {
      if (esAdminDeResidencial) {
        const resId = userClaims?.managedResidencials?.[0] || userClaims?.residencialId;
        if (resId === 'S9G7TL') {
          setManagedResidencialId('mCTs294LGLkGvL9TTvaQ');
        } else if (resId) {
          const docId = await obtenerResidencialDocId(resId);
          setManagedResidencialId(docId);
        }
      }
    };
    if (!isUserLoading && isAdmin) initialize();
  }, [isUserLoading, isAdmin, esAdminDeResidencial, userClaims]);

  useEffect(() => {
    if (!isUserLoading && isAdmin && (esAdminGlobal || managedResidencialId)) {
      fetchSurveys();
    }
  }, [isUserLoading, isAdmin, esAdminGlobal, managedResidencialId, fetchSurveys]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSurveys();
    setRefreshing(false);
    toast.success('Datos actualizados');
  };

  const handleCreateSurvey = async (surveyData: any) => {
    try {
      await SurveyService.createSurvey(surveyData);
      setCreateDialogOpen(false);
      await fetchSurveys();
      toast.success('Encuesta creada exitosamente');
    } catch (err: any) {
      toast.error('Error al crear la encuesta');
    }
  };

  const handleDeleteClick = (id: string) => {
    setSurveyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!surveyToDelete) return;
    try {
      await SurveyService.deleteSurvey(surveyToDelete);
      await fetchSurveys();
      toast.success('Encuesta eliminada');
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return s.titulo.toLowerCase().includes(term) || s.descripcion.toLowerCase().includes(term);
    });
  }, [surveys, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-black text-primary tracking-widest uppercase animate-pulse">Sincronizando Encuestas...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="h-20 w-20 rounded-[2rem] bg-red-50 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 font-bold max-w-sm">No tienes los privilegios necesarios para gestionar la opinión pública.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            Participación Ciudadana
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
            Gestión de <span className="text-gradient-zentry">Encuestas</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Obtén información valiosa y mide el pulso de tu comunidad mediante votaciones transparentes.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="rounded-2xl h-14 px-6 font-black shadow-zentry bg-white/60 border-slate-300 text-slate-800 hover:bg-slate-50 transition-all"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} /> REFRESH
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all gap-2"
          >
            <Plus className="h-5 w-5" /> NUEVA CONSULTA
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <EncuestasStats
        totalSurveys={stats?.totalSurveys || 0}
        activeSurveys={stats?.activeSurveys || 0}
        completedSurveys={stats?.completedSurveys || 0}
        totalResponses={stats?.totalResponses || 0}
        isLoading={loading}
      />

      {/* Filters & Grid */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20 shadow-sm">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título o tema..."
              className="pl-12 h-12 bg-white border border-slate-200 shadow-inner rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900"
            />
          </div>

          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner gap-1.5">
            <Badge className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl flex gap-2 items-center">
              <PieChart className="h-4 w-4" /> ACTIVAS
            </Badge>
            <div className="px-4 py-2 text-slate-500 font-black text-xs flex items-center gap-2">
              <Target className="h-3 w-3" /> {filteredSurveys.length} PROCESOS
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {[1, 2].map(i => (
                <div key={i} className="h-[300px] rounded-[2.5rem] bg-white/40 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : filteredSurveys.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
              <h3 className="text-2xl font-black text-slate-900 mb-2">No se encontraron encuestas</h3>
              <Button variant="outline" className="mt-6 rounded-2xl font-black" onClick={() => setSearchTerm("")}>LIMPIAR FILTROS</Button>
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8" layout>
              {filteredSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onViewResults={(s) => { setSelectedSurvey(s); setResultsDialogOpen(true); }}
                  onDelete={handleDeleteClick}
                  formatDate={formatDate}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <CreateSurveyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSurvey}
        residencialId={esAdminDeResidencial ? userClaims?.managedResidencials?.[0] || userClaims?.residencialId : undefined}
        creadorUid={user?.uid}
      />

      {selectedSurvey && (
        <SurveyResultsDialog
          open={resultsDialogOpen}
          onOpenChange={setResultsDialogOpen}
          survey={selectedSurvey}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
          <div className="h-16 w-16 rounded-[1.5rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-center mb-2">Eliminar Encuesta</DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-bold mb-8">
            ¿Deseas eliminar permanentemente esta encuesta y todos sus resultados? Esta acción no se puede deshacer.
          </DialogDescription>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" className="rounded-2xl h-14 font-black text-slate-500" onClick={() => setDeleteDialogOpen(false)}>CANCELAR</Button>
            <Button variant="destructive" className="rounded-2xl h-14 font-black shadow-lg hover-lift" onClick={onConfirmDelete}>ELIMINAR AHORA</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
