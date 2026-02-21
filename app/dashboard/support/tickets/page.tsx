'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminRequired } from '@/lib/hooks';
import { SupportService } from '@/lib/services/support-service';
import { SupportTicket, TicketFilters } from '@/types/support';
import { TicketList } from '@/components/admin/support/TicketList';
import { TicketDetail } from '@/components/admin/support/TicketDetail';
import { TicketFilters as TicketFiltersComponent } from '@/components/admin/support/TicketFilters';
import { TicketStats } from '@/components/admin/support/TicketStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, BarChart3, RefreshCw, Headphones } from 'lucide-react';

export default function SupportTicketsPage() {
  // Proteger la ruta - solo admins globales
  const { isGlobalAdmin, isUserLoading } = useAdminRequired(true);
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    await loadStats();
    setRefreshing(false);
  };

  // Admin global ve todos los tickets de todos los residenciales (pasamos undefined)
  const residencialIdForFetch: string | undefined = undefined;

  useEffect(() => {
    if (!isUserLoading && isGlobalAdmin) {
      loadTickets();
      loadStats();
    }
  }, [filters, isUserLoading, isGlobalAdmin]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await SupportService.getTickets(residencialIdForFetch, filters);
      setTickets(ticketsData);
    } catch (error: any) {
      console.error('Error cargando tickets:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await SupportService.getTicketStats(residencialIdForFetch);
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleTicketUpdate = async (
    ticketId: string,
    estado: string,
    resolucion?: string
  ) => {
    try {
      if (!selectedTicket) return;

      await SupportService.updateTicketStatus(
        selectedTicket.residencialId,
        ticketId,
        estado as any,
        resolucion,
        userData?.uid
      );

      toast.success('Ticket actualizado exitosamente');
      await loadTickets();
      await loadStats();
      
      // Recargar ticket seleccionado
      const updatedTicket = await SupportService.getTicket(
        selectedTicket.residencialId,
        ticketId
      );
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      console.error('Error actualizando ticket:', error);
      toast.error('Error al actualizar ticket');
    }
  };

  const handleUpdateFechaResolucionPrevista = async (ticketId: string, fecha: Date | null) => {
    try {
      if (!selectedTicket) return;

      await SupportService.updateTicketFechaResolucionPrevista(
        selectedTicket.residencialId,
        ticketId,
        fecha
      );

      toast.success(fecha ? 'Fecha prevista actualizada' : 'Fecha prevista eliminada');
      await loadTickets();
      await loadStats();

      const updatedTicket = await SupportService.getTicket(
        selectedTicket.residencialId,
        ticketId
      );
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      console.error('Error actualizando fecha prevista:', error);
      toast.error('Error al actualizar fecha prevista');
    }
  };

  const handleAssignTicket = async (ticketId: string, adminId: string) => {
    try {
      if (!selectedTicket) return;

      await SupportService.assignTicket(
        selectedTicket.residencialId,
        ticketId,
        adminId
      );

      toast.success('Ticket asignado exitosamente');
      await loadTickets();
      
      const updatedTicket = await SupportService.getTicket(
        selectedTicket.residencialId,
        ticketId
      );
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      console.error('Error asignando ticket:', error);
      toast.error('Error al asignar ticket');
    }
  };

  const handleAddRespuesta = async (ticketId: string, texto: string, archivos?: File[]) => {
    if (!selectedTicket || !texto.trim()) return;
    await SupportService.addTicketRespuesta(
      selectedTicket.residencialId,
      ticketId,
      texto.trim(),
      userData?.uid || '',
      userData?.fullName || 'Administración',
      archivos
    );
    toast.success('Respuesta enviada');
  };

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[420px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive">Acceso denegado. Solo administradores globales pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Headphones className="h-3.5 w-3.5" />
            Soporte
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Gestión de <span className="text-gradient-zentry">Tickets</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Administra y resuelve reportes de soporte de todos los residenciales
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          size="lg"
          className="bg-white border-primary/20 text-primary hover:bg-white shadow-zentry hover-lift rounded-2xl h-14 px-8 font-bold shrink-0"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </motion.div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <TabsList className="bg-white/70 backdrop-blur border border-slate-200/80 shadow-sm rounded-2xl p-1.5 h-12">
            <TabsTrigger
              value="tickets"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-6"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-6"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="tickets" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <TicketFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
              />
              <TicketList
                tickets={tickets}
                loading={loading}
                onTicketSelect={setSelectedTicket}
                selectedTicketId={selectedTicket?.ticketId}
              />
            </div>
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {selectedTicket ? (
                  <motion.div
                    key={selectedTicket.ticketId}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TicketDetail
                      ticket={selectedTicket}
                      onUpdate={handleTicketUpdate}
                      onAssign={handleAssignTicket}
                      onUpdateFechaResolucionPrevista={handleUpdateFechaResolucionPrevista}
                      onAddRespuesta={handleAddRespuesta}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="p-8">
                        <CardTitle className="text-xl font-bold">Selecciona un ticket</CardTitle>
                        <CardDescription className="text-slate-500">
                          Haz clic en un ticket de la lista para ver los detalles y gestionarlo
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TicketStats stats={stats} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
