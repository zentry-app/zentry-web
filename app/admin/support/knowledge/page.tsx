'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { SupportService } from '@/lib/services/support-service';
import { KnowledgeBaseItem } from '@/types/support';
import { KnowledgeBaseList } from '@/components/admin/support/KnowledgeBaseList';
import { KnowledgeBaseForm } from '@/components/admin/support/KnowledgeBaseForm';
import { KnowledgeBaseStats } from '@/components/admin/support/KnowledgeBaseStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookOpen, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function KnowledgeBasePage() {
  const { userData } = useAuth();
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadItems();
    loadStats();
  }, []);

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
      toast.success(itemId ? 'Pregunta actualizada' : 'Pregunta creada');
      setShowForm(false);
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

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Base de Conocimiento</h2>
            <p className="text-muted-foreground">
              Gestiona las preguntas frecuentes para el chatbot
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Pregunta
          </Button>
        </div>

        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">
              <BookOpen className="h-4 w-4 mr-2" />
              Preguntas Frecuentes
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {showForm && (
              <KnowledgeBaseForm
                item={selectedItem || undefined}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedItem(null);
                }}
              />
            )}
            <KnowledgeBaseList
              items={items}
              loading={loading}
              onItemSelect={setSelectedItem}
              onEdit={(item) => {
                setSelectedItem(item);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="stats">
            <KnowledgeBaseStats stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
