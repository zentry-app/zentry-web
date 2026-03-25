'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { SupportService } from '@/lib/services/support-service';
import { SupportTicket, TicketFilters } from '@/types/support';
import { TicketList } from '@/components/admin/support/TicketList';
import { TicketDetail } from '@/components/admin/support/TicketDetail';
import { TicketFilters as TicketFiltersComponent } from '@/components/admin/support/TicketFilters';
import { TicketStats } from '@/components/admin/support/TicketStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, BarChart3 } from 'lucide-react';

export default function SupportTicketsPage() {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const residencialId = userData?.residencialID;

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const ticketsData = await SupportService.getTickets(residencialId, filters);
      setTickets(ticketsData);
    } catch (error: any) {
      console.error('Error cargando tickets:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, residencialId]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await SupportService.getTicketStats(residencialId);
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, [residencialId]);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [loadStats, loadTickets]);

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

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Tickets</h2>
            <p className="text-muted-foreground">
              Administra y resuelve tickets de soporte
            </p>
          </div>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
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
                {selectedTicket ? (
                  <TicketDetail
                    ticket={selectedTicket}
                    onUpdate={handleTicketUpdate}
                    onAssign={handleAssignTicket}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selecciona un ticket</CardTitle>
                      <CardDescription>
                        Haz clic en un ticket de la lista para ver los detalles
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <TicketStats stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
