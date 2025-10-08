'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  Hash,
  Type,
  Radio,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Grid3X3,
  List,
  Sliders,
  Download,
  Eye,
  RefreshCw,
  Pause,
  Play,
  Filter,
  X,
} from 'lucide-react';
import { SurveyService, SurveyResults } from '@/lib/services/survey-service';
import { useToast } from '@/components/ui/use-toast';
import { SurveyCharts } from './SurveyCharts';

interface SurveyResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: {
    id: string;
    titulo: string;
    descripcion: string;
    fechaFin: string;
    totalRespuestas: number;
    preguntas: Array<{
      pregunta: string;
      tipo: string;
      opciones?: string[];
    }>;
    residencialDocId: string;
  };
}

export function SurveyResultsDialog({ open, onOpenChange, survey }: SurveyResultsDialogProps) {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (open && survey) {
      loadResults();
    }
  }, [open, survey]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!open || !autoRefresh) return;

    const interval = setInterval(() => {
      loadResults();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [open, autoRefresh, survey]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveyService.getSurveyResults(survey.id, survey.residencialDocId);
      setResults(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error loading survey results:', err);
      setError(err.message || 'Error al cargar los resultados');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los resultados de la encuesta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      textoLibre: Type,
      opcionUnica: Radio,
      opcionMultiple: CheckSquare,
      siNo: ThumbsUp,
      escalaLikert: Star,
      escalaNumero: Hash,
      escalaFrecuencia: Clock,
      matriz: Grid3X3,
      clasificacion: List,
      deslizante: Sliders,
    };
    return icons[type] || BarChart3;
  };

  const renderQuestionResults = (questionResult: any, index: number) => {
    const { question, type, results } = questionResult;
    const Icon = getQuestionTypeIcon(type);

    return (
      <Card key={index} className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
          </div>
          <p className="text-muted-foreground">{question}</p>
        </CardHeader>
        <CardContent>
          {renderResultsByType(type, results)}
        </CardContent>
      </Card>
    );
  };

  const renderResultsByType = (type: string, results: any) => {
    switch (type) {
      case 'textoLibre':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de respuestas: {results.total}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.responses.map((response: any, index: number) => {
                // Manejar diferentes formatos de respuesta
                let responseText = '';
                if (typeof response === 'string') {
                  responseText = response;
                } else if (response && typeof response === 'object') {
                  // Si es un objeto con 'value', extraer el valor
                  responseText = response.value || response.text || JSON.stringify(response);
                } else {
                  responseText = String(response || '');
                }
                
                return (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{responseText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'siNo':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de respuestas: {results.total}</span>
            </div>
            <div className="space-y-3">
              {Object.entries(results.counts).map(([option, count]) => {
                const percentage = results.total > 0 ? ((count as number) / results.total) * 100 : 0;
                const isYes = option === 'sí';
                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isYes ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium capitalize">{option}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'opcionUnica':
      case 'opcionMultiple':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de respuestas: {results.total}</span>
            </div>
            <div className="space-y-3">
              {results.options?.map((option: string) => {
                const count = results.counts[option] || 0;
                const percentage = results.total > 0 ? (count / results.total) * 100 : 0;
                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      <div className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'escalaLikert':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de respuestas: {results.total}</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Promedio: {results.average.toFixed(1)}
              </Badge>
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = results.distribution[value] || 0;
                const percentage = results.total > 0 ? (count / results.total) * 100 : 0;
                const emoji = ['😡', '🙁', '😐', '🙂', '😄'][5 - value];
                const label = ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'][5 - value];
                
                return (
                  <div key={value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{emoji}</span>
                        <span className="font-medium">{label}</span>
                        <Badge variant="outline">{value}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4" />
            <p>Tipo de pregunta no soportado: {type}</p>
          </div>
        );
    }
  };

  const getFilteredResponses = () => {
    if (!results || !results.responses) return [];
    
    return results.responses.filter(response => {
      // Filtro por rol
      if (roleFilter !== 'all' && response.userRole !== roleFilter) {
        return false;
      }
      
      // Filtro por fecha
      if (dateFilter.from || dateFilter.to) {
        const responseDate = response.submittedAt ? new Date(response.submittedAt) : null;
        if (!responseDate) return false;
        
        if (dateFilter.from) {
          const fromDate = new Date(dateFilter.from);
          if (responseDate < fromDate) return false;
        }
        
        if (dateFilter.to) {
          const toDate = new Date(dateFilter.to);
          toDate.setHours(23, 59, 59, 999); // Incluir todo el día
          if (responseDate > toDate) return false;
        }
      }
      
      return true;
    });
  };

  const clearFilters = () => {
    setDateFilter({ from: '', to: '' });
    setRoleFilter('all');
  };

  const exportResults = () => {
    if (!results || !results.responses) return;

    // Crear CSV con respuestas individuales de usuarios (usando filtros)
    const filteredResponses = getFilteredResponses();
    const csvContent = [
      ['Usuario', 'Email', 'Rol', 'Fecha Respuesta', 'Pregunta', 'Tipo', 'Respuesta'],
      ...filteredResponses.flatMap((response) => {
        const rows: string[][] = [];
        const responseDate = response.submittedAt 
          ? new Date(response.submittedAt).toLocaleString('es-ES')
          : 'N/A';
        
        response.answers.forEach((answer: any, index: number) => {
          const question = results.survey.preguntas[index];
          if (!question) return;
          
          let answerText = '';
          if (typeof answer === 'string') {
            answerText = answer;
          } else if (typeof answer === 'object' && answer.value !== undefined) {
            answerText = answer.value.toString();
          } else if (Array.isArray(answer)) {
            answerText = answer.join('; ');
          } else {
            answerText = String(answer);
          }
          
          rows.push([
            response.userName,
            response.userEmail,
            response.userRole,
            responseDate,
            question.pregunta,
            question.tipo,
            answerText
          ]);
        });
        
        return rows;
      })
    ];

    const csv = csvContent.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `encuesta_${results.survey.titulo}_respuestas_detalladas.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Resultados de la Encuesta
          </DialogTitle>
          <DialogDescription>
            Análisis detallado de las respuestas recibidas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-destructive mb-4">
              <BarChart3 className="mx-auto h-12 w-12 mb-2" />
              <p>Error al cargar los resultados</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadResults} variant="outline">
              Reintentar
            </Button>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{results?.survey?.titulo || survey.titulo}</CardTitle>
                    <p className="text-muted-foreground mt-1">{results?.survey?.descripcion || survey.descripcion}</p>
                    {lastUpdate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setAutoRefresh(!autoRefresh)} 
                      variant="outline" 
                      size="sm"
                    >
                      {autoRefresh ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Auto-actualizar
                        </>
                      )}
                    </Button>
                    <Button onClick={loadResults} variant="outline" size="sm" disabled={loading}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                    <Button onClick={exportResults} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getFilteredResponses().length}</div>
                    <div className="text-sm text-muted-foreground">Respuestas filtradas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results?.responses?.length ? ((getFilteredResponses().length / results.responses.length) * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-sm text-muted-foreground">% de respuestas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results?.survey?.preguntas?.length || survey.preguntas.length}</div>
                    <div className="text-sm text-muted-foreground">Preguntas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatDate(results?.survey?.fechaFin || survey.fechaFin)}
                    </div>
                    <div className="text-sm text-muted-foreground">Fecha límite</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">Fecha desde</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">Fecha hasta</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateFilter.to}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleFilter">Filtrar por rol</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="residente">Residentes</SelectItem>
                        <SelectItem value="admin">Administradores</SelectItem>
                        <SelectItem value="superadmin">Super Administradores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {getFilteredResponses().length} de {results?.responses?.length || 0} respuestas
                  </div>
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gráficas de datos */}
            {results?.stats?.questionResults && (
              <SurveyCharts questionResults={results.stats.questionResults} />
            )}

            {/* Resultados por pregunta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados Detallados por Pregunta</h3>
                <Badge variant="outline">
                  {results?.stats?.questionResults?.length || 0} preguntas
                </Badge>
              </div>
              
              {results?.stats?.questionResults?.map((questionResult, index) => 
                renderQuestionResults(questionResult, index)
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
