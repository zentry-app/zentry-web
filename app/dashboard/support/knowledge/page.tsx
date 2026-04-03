'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminRequired } from '@/lib/hooks';
import { SupportService } from '@/lib/services/support-service';
import { KnowledgeBaseItem } from '@/types/support';
import { KnowledgeBaseList } from '@/components/admin/support/KnowledgeBaseList';
import { KnowledgeBaseForm } from '@/components/admin/support/KnowledgeBaseForm';
import { KnowledgeBaseStats } from '@/components/admin/support/KnowledgeBaseStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookOpen, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function KnowledgeBasePage() {
  // Proteger la ruta - solo admins globales
  const { isGlobalAdmin, isUserLoading } = useAdminRequired(true);
  const { userData } = useAuth();
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && isGlobalAdmin) {
      loadItems();
      loadStats();
    }
  }, [isUserLoading, isGlobalAdmin]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const itemsData = await SupportService.getKnowledgeBase();
      setItems(itemsData);
    } catch (error: any) {
      console.error('Error cargando base de conocimiento:', error);
      toast.error('Error al cargar base de conocimiento');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await SupportService.getKnowledgeBaseStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleSave = async (item: Partial<KnowledgeBaseItem>, itemId?: string) => {
    try {
      await SupportService.saveKnowledgeBaseItem(
        {
          ...item,
          creadoPor: userData?.uid || '',
        },
        itemId
      );
      toast.success(itemId ? 'Pregunta actualizada exitosamente' : 'Pregunta creada exitosamente');
      setIsFormOpen(false);
      setSelectedItem(null);
      await loadItems();
      await loadStats();
    } catch (error: any) {
      console.error('Error guardando pregunta:', error);
      toast.error('Error al guardar pregunta');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await SupportService.deleteKnowledgeBaseItem(itemId);
      toast.success('Pregunta desactivada');
      await loadItems();
      await loadStats();
    } catch (error: any) {
      console.error('Error eliminando pregunta:', error);
      toast.error('Error al eliminar pregunta');
    }
  };

  const handleNewQuestion = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEditQuestion = (item: KnowledgeBaseItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-premium">
        <div className="text-center">
          <div className="relative h-12 w-12 mx-auto mb-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-premium px-4">
        <div className="text-center max-w-md p-6 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/20 shadow-zentry-lg">
          <p className="text-destructive font-semibold">Acceso denegado. Solo administradores globales pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium px-4 lg:px-10 py-8 relative">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Soporte
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Base de <span className="text-gradient-zentry">Conocimiento</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Gestiona las preguntas frecuentes para el chatbot de soporte
          </p>
        </div>

        <Button
          onClick={handleNewQuestion}
          size="lg"
          className="gap-2 bg-white border-primary/20 text-primary hover:bg-white shadow-zentry hover-lift rounded-2xl h-14 px-8 font-bold"
        >
          <Plus className="h-5 w-5" />
          Nueva Pregunta
        </Button>
      </motion.div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="bg-white/60 backdrop-blur-sm border border-white/20 p-1 rounded-2xl shadow-zentry h-14">
          <TabsTrigger
            value="items"
            className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-semibold px-6 h-12"
          >
            <BookOpen className="h-4 w-4" />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-semibold px-6 h-12"
          >
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 mt-0">
          <KnowledgeBaseList
            items={items}
            loading={loading}
            onItemSelect={setSelectedItem}
            onEdit={handleEditQuestion}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <KnowledgeBaseStats stats={stats} />
        </TabsContent>
      </Tabs>

      <KnowledgeBaseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={selectedItem || undefined}
        onSave={handleSave}
      />
    </div>
  );
}
