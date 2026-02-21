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
  Type,
  Radio,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
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
  const [userSearch, setUserSearch] = useState<string>('');
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

  const formatDate = (dateInput: any) => {
    try {
      let date: Date;
      
      // Si es un objeto Timestamp de Firestore
      if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
        date = dateInput.toDate();
      }
      // Si es un string
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      }
      // Si es un objeto Date
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      // Si es un número (timestamp)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      else {
        return 'Fecha inválida';
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Fecha inválida';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      textoLibre: Type,
      opcionUnica: Radio,
      opcionMultiple: CheckSquare,
      siNo: ThumbsUp,
      escalaLikert: Star,
      escalaFrecuencia: Clock,
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

      case 'escalaFrecuencia':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de respuestas: {results.total}</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Promedio: {results.average.toFixed(1)}
              </Badge>
            </div>
            <div className="space-y-3">
              {[4, 3, 2, 1, 0].map((value) => {
                const count = results.distribution[value] || 0;
                const percentage = results.total > 0 ? (count / results.total) * 100 : 0;
                const emoji = ['😄', '🙂', '😐', '🙁', '😡'][4 - value];
                const label = ['Muy frecuente', 'Frecuente', 'Moderado', 'Poco frecuente', 'Nunca'][4 - value];
                
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
                const emoji = ['😄', '🙂', '😐', '🙁', '😡'][5 - value];
                const label = ['Muy de acuerdo', 'De acuerdo', 'Neutral', 'En desacuerdo', 'Muy en desacuerdo'][5 - value];
                
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

      case 'escalaFrecuencia':
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
                const emoji = ['🔄', '📅', '⏰', '📆', '❌'][5 - value];
                const label = ['Siempre', 'Frecuentemente', 'A veces', 'Raramente', 'Nunca'][5 - value];
                
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
      // Filtro por búsqueda de usuario
      if (userSearch) {
        const searchTerm = userSearch.toLowerCase();
        const userName = (response.userName || '').toLowerCase();
        const userEmail = (response.userEmail || '').toLowerCase();
        if (!userName.includes(searchTerm) && !userEmail.includes(searchTerm)) {
          return false;
        }
      }
      
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
    setUserSearch('');
  };

  const renderIndividualAnswer = (answer: any, questionType: string): string => {
    if (!answer) return 'Sin respuesta';
    
    try {
      switch (questionType) {
        case 'textoLibre':
          if (typeof answer === 'object' && answer !== null && answer.value !== undefined) {
            return String(answer.value);
          }
          return String(answer);
          
        case 'opcionUnica':
          if (typeof answer === 'object' && answer !== null && answer.value !== undefined) {
            return String(answer.value);
          }
          return String(answer);
          
        case 'opcionMultiple':
          if (Array.isArray(answer)) {
            return answer.map(item => String(item)).join(', ');
          }
          if (typeof answer === 'object' && answer !== null && answer.selectedOptions) {
            return answer.selectedOptions.map((item: any) => String(item)).join(', ');
          }
          return String(answer);
          
        case 'siNo':
          if (typeof answer === 'boolean') {
            return answer ? 'Sí' : 'No';
          }
          return String(answer);
          
        case 'escalaLikert':
          const likertLabels = ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'];
          const likertValue = parseInt(String(answer)) || 0;
          const likertLabel = likertLabels[likertValue - 1] || 'Inválido';
          return `${likertValue} - ${likertLabel}`;
          
        case 'escalaFrecuencia':
          const frecuenciaLabels = ['Nunca', 'Poco frecuente', 'Moderado', 'Frecuente', 'Muy frecuente'];
          const frecuenciaValue = parseInt(String(answer)) || 0;
          const frecuenciaLabel = frecuenciaLabels[frecuenciaValue] || 'Inválido';
          return `${frecuenciaValue} - ${frecuenciaLabel}`;
          
        default:
          return String(answer);
      }
    } catch (error) {
      console.error('Error rendering individual answer:', error, { answer, questionType });
      return 'Error al mostrar respuesta';
    }
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="individual">Respuestas Individuales</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">
                  <BarChart3 className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Error al cargar resultados</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={loadResults} variant="outline">
                  Reintentar
                </Button>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Header principal mejorado */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 rounded-xl p-6 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {(results?.survey?.titulo || survey.titulo).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {results?.survey?.titulo || survey.titulo}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {results?.survey?.descripcion || survey.descripcion}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Vence: {formatDate(results?.survey?.fechaFin || survey.fechaFin)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            <span>{(results?.survey?.preguntas?.length || survey.preguntas.length)} preguntas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {getFilteredResponses().length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">respuestas totales</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        de {results?.responses?.length || 0} usuarios
                      </div>
                    </div>
                  </div>
                  
                  {/* Controles de acción */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-ES')}` : 'Sin actualizar'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setAutoRefresh(!autoRefresh)} 
                        variant="outline" 
                        size="sm"
                        className="bg-white/60 dark:bg-gray-800/60"
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
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {getFilteredResponses().length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Respuestas</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {results?.responses?.length ? ((getFilteredResponses().length / results.responses.length) * 100).toFixed(1) : '0.0'}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Participación</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {results?.survey?.preguntas?.length || survey.preguntas.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Preguntas</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {new Date(results?.survey?.fechaFin || survey.fechaFin).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fecha límite</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros compactos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="h-5 w-5" />
                      Filtros de Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Fecha desde</Label>
                        <Input
                          type="date"
                          value={dateFilter.from}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Fecha hasta</Label>
                        <Input
                          type="date"
                          value={dateFilter.to}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filtrar por rol</Label>
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
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
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
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Visualización de Datos</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Análisis por pregunta</p>
                      </div>
                    </div>
                    <SurveyCharts questionResults={results.stats.questionResults} />
                  </div>
                )}

                {/* Resultados por pregunta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Resultados Detallados</h3>
                    <Badge variant="outline" className="text-sm">
                      {results?.stats?.questionResults?.length || 0} preguntas analizadas
                    </Badge>
                  </div>
                  
                  {results?.stats?.questionResults?.map((questionResult, index) => 
                    renderQuestionResults(questionResult, index)
                  )}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">
                  <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Error al cargar respuestas</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : results?.responses ? (
              <div className="space-y-6">
                {/* Header con estadísticas rápidas */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">Respuestas Individuales</h2>
                        <p className="text-blue-700 dark:text-blue-300">Análisis detallado por usuario</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {getFilteredResponses().length}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        de {results?.responses?.length || 0} respuestas
                      </div>
                    </div>
                  </div>
                  
                  {/* Filtros compactos */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Buscar usuario</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                        <Input
                          placeholder="Nombre o email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10 bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Desde</Label>
                      <Input
                        type="date"
                        value={dateFilter.from}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                        className="bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Hasta</Label>
                      <Input
                        type="date"
                        value={dateFilter.to}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                        className="bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Rol</Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-700">
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
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Mostrando {getFilteredResponses().length} respuestas filtradas</span>
                    </div>
                    <Button 
                      onClick={clearFilters} 
                      variant="outline" 
                      size="sm"
                      className="bg-white/60 dark:bg-gray-800/60 border-blue-200 dark:border-blue-700 hover:bg-white dark:hover:bg-gray-800"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar filtros
                    </Button>
                  </div>
                </div>

                {/* Lista de respuestas mejorada */}
                <div className="space-y-4">
                  {getFilteredResponses().map((response, index) => (
                    <Card key={response.userId || index} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {(response.userName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {response.userName || 'Usuario Anónimo'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{response.userEmail}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                📍 {response.userDomicilio || 'Sin domicilio registrado'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    response.userRole === 'superadmin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                    response.userRole === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}
                                >
                                  {response.userRole}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(response.submittedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {response.answers?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">respuestas</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {response.answers?.map((answer: any, answerIndex: number) => {
                            const question = survey.preguntas[answerIndex];
                            if (!question) return null;
                            
                            return (
                              <div key={answerIndex} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    {(() => {
                                      const Icon = getQuestionTypeIcon(question.tipo);
                                      return <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
                                    })()}
                                  </div>
                                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                                    Pregunta {answerIndex + 1}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {question.pregunta}
                                </p>
                                <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {renderIndividualAnswer(answer, question.tipo)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {getFilteredResponses().length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No se encontraron respuestas
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Intenta ajustar los filtros para ver más resultados
                      </p>
                      <Button onClick={clearFilters} variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No hay respuestas disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Las respuestas aparecerán aquí una vez que los usuarios respondan la encuesta
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">
                  <TrendingUp className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Error al cargar análisis</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : results?.stats ? (
              <div className="space-y-6">
                {/* Header con resumen ejecutivo */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Análisis de Participación</h2>
                      <p className="text-emerald-700 dark:text-emerald-300">Métricas clave y tendencias</p>
                    </div>
                  </div>
                  
                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {results.stats.totalResponses}
                      </div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Respuestas</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        de {results.stats.totalUsers || 0} usuarios
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {results.stats.responseRate?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">Tasa de Respuesta</div>
                      <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                        participación activa
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {results.stats.averageCompletionTime?.toFixed(0) || '0'}
                      </div>
                      <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Min Promedio</div>
                      <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                        tiempo de completado
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {survey.preguntas.length}
                      </div>
                      <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Preguntas</div>
                      <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                        en la encuesta
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráficas mejoradas */}
                {results.stats.questionResults && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Visualización de Datos</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Análisis por pregunta</p>
                      </div>
                    </div>
                    <SurveyCharts questionResults={results.stats.questionResults} />
                  </div>
                )}

                {/* Resumen de preguntas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.stats.questionResults?.map((questionResult: any, index: number) => {
                    const { question, type, results: questionStats } = questionResult;
                    const Icon = getQuestionTypeIcon(type);
                    
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                Pregunta {index + 1}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {question}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Respuestas</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {questionStats.total}
                              </span>
                            </div>
                            
                            {type === 'escalaLikert' || type === 'escalaFrecuencia' ? (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Promedio</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {questionStats.average?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                            ) : type === 'opcionUnica' || type === 'opcionMultiple' ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Opciones</span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {questionStats.options?.length || 0}
                                  </span>
                                </div>
                                {questionStats.options?.slice(0, 3).map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 dark:text-gray-400 truncate">
                                      {option}
                                    </span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {questionStats.counts?.[option] || 0}
                                    </span>
                                  </div>
                                ))}
                                {questionStats.options?.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    +{questionStats.options.length - 3} más
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No hay datos de análisis
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Los análisis aparecerán aquí una vez que haya respuestas suficientes
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
