'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, BarChart3, Users, Clock, 
  CheckCircle, AlertCircle, Calendar,
  Eye, Edit, Trash2, RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateSurveyDialog } from '@/components/admin/encuestas/CreateSurveyDialog';
import { SurveyResultsDialog } from '@/components/admin/encuestas/SurveyResultsDialog';
import { SurveyService } from '@/lib/services/survey-service';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRequired } from '@/lib/hooks';

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
  const { toast } = useToast();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const esAdminGlobal = userClaims?.isGlobalAdmin === true;
  const esAdminDeResidencial = userClaims?.role === 'admin' && !esAdminGlobal;
  const residencialIdDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial) return null;
    return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
  }, [esAdminDeResidencial, userClaims]);

  // Función helper para obtener residencialDocId desde residencialID
  const obtenerResidencialDocId = async (residencialID: string): Promise<string | null> => {
    try {
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const residencialesRef = collection(db, 'residenciales');
      const q = query(
        residencialesRef,
        where('residencialID', '==', residencialID),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      
      console.log(`🏠 [ENCUESTAS] No se encontró residencialDocId para residencialID: ${residencialID}`);
      return null;
    } catch (error) {
      console.error('🏠 [ENCUESTAS] Error obteniendo residencialDocId:', error);
      return null;
    }
  };

  const [managedResidencialId, setManagedResidencialId] = useState<string | null>(null);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Obteniendo encuestas...');
      let data;
      if (esAdminDeResidencial && managedResidencialId) {
        const fetchedSurveys = await SurveyService.getSurveysByResidencial(managedResidencialId);
        // Calcular stats básicos para un solo residencial
        const now = new Date();
        const active = fetchedSurveys.filter(s => s.status === 'pending' && new Date(s.fechaFin) > now).length;
        const completed = fetchedSurveys.filter(s => s.status === 'concluida' || new Date(s.fechaFin) <= now).length;
        const totalRes = fetchedSurveys.reduce((sum, s) => sum + s.totalRespuestas, 0);
        
        data = {
          surveys: fetchedSurveys,
          stats: {
            totalSurveys: fetchedSurveys.length,
            activeSurveys: active,
            completedSurveys: completed,
            totalResponses: totalRes
          }
        };
      } else if (esAdminGlobal) {
        data = await SurveyService.getAllSurveys();
      } else {
        // No es admin o no tiene residencial asignado
        setSurveys([]);
        setStats({ totalSurveys: 0, activeSurveys: 0, completedSurveys: 0, totalResponses: 0 });
        setLoading(false);
        return;
      }
      
      setSurveys(data.surveys);
      setStats(data.stats);
      console.log('Encuestas recibidas:', data);
    } catch (err: any) {
      console.error('Error al obtener encuestas:', err);
      setError(err.message || 'Error al cargar las encuestas');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las encuestas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener el residencialDocId correcto
  useEffect(() => {
    const obtenerResidencialDocIdCorrecto = async () => {
      if (esAdminDeResidencial && residencialIdDelAdmin) {
        // Caso especial para S9G7TL (conocido)
        if (residencialIdDelAdmin === 'S9G7TL') {
          setManagedResidencialId('mCTs294LGLkGvL9TTvaQ');
          return;
        }
        
        // Para otros residenciales, buscar el docId
        const docId = await obtenerResidencialDocId(residencialIdDelAdmin);
        setManagedResidencialId(docId);
      } else if (esAdminGlobal) {
        // Para admin global, no necesitamos residencial específico
        setManagedResidencialId(null);
      } else {
        setManagedResidencialId(null);
      }
    };

    if (!isUserLoading && isAdmin) {
      obtenerResidencialDocIdCorrecto();
    }
  }, [isUserLoading, isAdmin, esAdminDeResidencial, esAdminGlobal, residencialIdDelAdmin]);

  useEffect(() => {
    if (!isUserLoading && isAdmin && (esAdminGlobal || managedResidencialId !== null)) {
      fetchSurveys();
    }
  }, [isUserLoading, isAdmin, esAdminGlobal, managedResidencialId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSurveys();
      toast({
        title: 'Datos actualizados',
        description: 'Las encuestas se han actualizado correctamente'
      });
    } catch (err) {
      // Error ya manejado en fetchSurveys
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSurvey = async (surveyData: any) => {
    try {
      await SurveyService.createSurvey(surveyData);
      setCreateDialogOpen(false);
      await fetchSurveys();
      toast({
        title: 'Encuesta creada',
        description: 'La encuesta se ha creado exitosamente'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al crear la encuesta',
        variant: 'destructive'
      });
    }
  };

  const handleViewResults = (survey: Survey) => {
    setSelectedSurvey(survey);
    setResultsDialogOpen(true);
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
      return;
    }

    try {
      await SurveyService.deleteSurvey(surveyId);
      await fetchSurveys();
      toast({
        title: 'Encuesta eliminada',
        description: 'La encuesta se ha eliminado exitosamente'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar la encuesta',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string, fechaFin: string) => {
    const now = new Date();
    const endDate = new Date(fechaFin);
    const isExpired = now > endDate;

    if (status === 'concluida' || isExpired) {
      return <Badge variant="secondary">Concluida</Badge>;
    }
    return <Badge variant="default">Activa</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (isUserLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--navbar-height,4rem))] p-8">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta sección.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Encuestas</h2>
          <div className="flex gap-2">
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
                  Actualizar
                </>
              )}
            </Button>
            {(esAdminGlobal || esAdminDeResidencial) && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Encuesta
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="surveys">Encuestas</TabsTrigger>
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
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {renderStat(stats?.totalSurveys, 'Total Encuestas', <BarChart3 className="h-4 w-4 text-muted-foreground" />)}
              {renderStat(stats?.activeSurveys, 'Encuestas Activas', <Clock className="h-4 w-4 text-muted-foreground" />)}
              {renderStat(stats?.completedSurveys, 'Encuestas Concluidas', <CheckCircle className="h-4 w-4 text-muted-foreground" />)}
              {renderStat(stats?.totalResponses, 'Total Respuestas', <Users className="h-4 w-4 text-muted-foreground" />)}
            </div>
          </TabsContent>
          
          <TabsContent value="surveys" className="space-y-4">
            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : surveys.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay encuestas</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crea tu primera encuesta para comenzar a recopilar información de los residentes.
                  </p>
                  {(esAdminGlobal || esAdminDeResidencial) && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Encuesta
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {surveys.map((survey) => (
                  <Card key={survey.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{survey.titulo}</CardTitle>
                          <CardDescription>{survey.descripcion}</CardDescription>
                        </div>
                        {getStatusBadge(survey.status, survey.fechaFin)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Creada: {formatDate(survey.fechaCreacion)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Vence: {formatDate(survey.fechaFin)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{survey.totalRespuestas} respuestas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span>{survey.preguntas.length} preguntas</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResults(survey)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Resultados
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSurvey(survey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateSurveyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateSurvey}
          residencialId={esAdminDeResidencial ? residencialIdDelAdmin || undefined : undefined}
          creadorUid={user?.uid}
        />

        {selectedSurvey && (
          <SurveyResultsDialog
            open={resultsDialogOpen}
            onOpenChange={setResultsDialogOpen}
            survey={selectedSurvey}
          />
        )}
      </div>
  );
}
