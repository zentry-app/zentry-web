'use client';

import { useEffect, useState } from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Building2, Briefcase, 
  Clock, Activity, RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminService from '@/lib/services/admin-service';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type SystemStats = {
  totalUsers: number;
  totalResidenciales: number;
  totalAdmins: number;
  pendingUsers: number;
  activeUsers: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Obteniendo estadísticas del sistema...');
      const data = await AdminService.getSystemStats();
      setStats(data);
      console.log('Estadísticas recibidas:', data);
    } catch (err: any) {
      console.error('Error al obtener estadísticas:', err);
      setError(err.message || 'Error al cargar los datos');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas del sistema',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Suscribirse a actualizaciones en tiempo real
    const unsubscribe = AdminService.subscribeToSystemStats((updatedStats) => {
      console.log('Actualización de estadísticas en tiempo real:', updatedStats);
      setStats(updatedStats);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
      toast({
        title: 'Datos actualizados',
        description: 'Las estadísticas se han actualizado correctamente'
      });
    } catch (err) {
      // Error ya manejado en fetchStats
    } finally {
      setRefreshing(false);
    }
  };

  // Función para renderizar un stat con estado de carga o error
  const renderStat = (value: number | undefined, label: string, icon: React.ReactNode) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : error ? (
            <div className="text-destructive text-sm">Error al cargar</div>
          ) : (
            <div className="text-2xl font-bold">{value || 0}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Panel de administración global</h2>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing || loading}
          >
            {refreshing || loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar datos
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
                Error al cargar datos: {error}. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-destructive underline ml-1"
                  onClick={handleRefresh}
                >
                  Reintentar
                </Button>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {renderStat(stats?.totalUsers, 'Usuarios totales', <Users className="h-4 w-4 text-muted-foreground" />)}
              
              {renderStat(stats?.totalResidenciales, 'Residenciales', <Building2 className="h-4 w-4 text-muted-foreground" />)}
              
              {renderStat(stats?.totalAdmins, 'Administradores', <Briefcase className="h-4 w-4 text-muted-foreground" />)}
              
              {renderStat(stats?.pendingUsers, 'Usuarios pendientes', <Clock className="h-4 w-4 text-muted-foreground" />)}
              
              {renderStat(stats?.activeUsers, 'Usuarios activos', <Activity className="h-4 w-4 text-muted-foreground" />)}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de uso</CardTitle>
                <CardDescription>
                  Información más detallada sobre el uso de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Las gráficas de análisis estarán disponibles próximamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 