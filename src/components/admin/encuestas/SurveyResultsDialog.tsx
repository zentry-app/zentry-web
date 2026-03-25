"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  Target,
  DownloadCloud
} from "lucide-react";
import { SurveyService, SurveyResults } from "@/lib/services/survey-service";
import { useToast } from "@/components/ui/use-toast";
import { SurveyCharts } from "./SurveyCharts";
import { motion, AnimatePresence } from "framer-motion";

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
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const { toast } = useToast();

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SurveyService.getSurveyResults(survey.id, survey.residencialDocId);
      setResults(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || "Error al cargar los resultados");
    } finally {
      setLoading(false);
    }
  }, [survey.id, survey.residencialDocId]);

  useEffect(() => {
    if (open && survey) {
      loadResults();
    }
  }, [loadResults, open, survey]);

  useEffect(() => {
    if (!open || !autoRefresh) return;
    const interval = setInterval(() => {
      loadResults();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadResults, open]);

  const formatDate = (dateInput: any) => {
    try {
      let date: Date;
      if (dateInput?.toDate) date = dateInput.toDate();
      else if (typeof dateInput === "string") date = new Date(dateInput);
      else if (dateInput instanceof Date) date = dateInput;
      else if (typeof dateInput === "number") date = new Date(dateInput);
      else return "---";

      if (isNaN(date.getTime())) return "---";
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "---";
    }
  };

  const getFilteredResponses = () => {
    if (!results || !results.responses) return [];
    return results.responses.filter((response) => {
      if (userSearch) {
        const term = userSearch.toLowerCase();
        if (!response.userName?.toLowerCase().includes(term) && !response.userEmail?.toLowerCase().includes(term)) return false;
      }
      if (roleFilter !== "all" && response.userRole !== roleFilter) return false;
      return true;
    });
  };

  const renderResultsByType = (type: string, results: any) => {
    switch (type) {
      case "textoLibre":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                {results.total} COMENTARIOS
              </Badge>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-premium">
              {results.responses.map((response: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                    "{typeof response === 'string' ? response : (response.value || response.text || "...")}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "siNo":
      case "opcionUnica":
      case "opcionMultiple":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                {results.total} RESPUESTAS
              </Badge>
            </div>
            <div className="space-y-4">
              {(results.options || Object.keys(results.counts)).map((option: string) => {
                const count = results.counts[option] || 0;
                const percentage = results.total > 0 ? (count / results.total) * 100 : 0;
                return (
                  <div key={option} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{option}</span>
                      <span className="text-xs font-black text-primary">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3 rounded-full bg-slate-100" />
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return <p className="text-center py-8 text-slate-400 font-bold italic">Visualización no disponible para este tipo.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden border-none shadow-2xl rounded-[3rem] bg-slate-50 p-0 flex flex-col">
        <DialogHeader className="p-8 bg-slate-900 text-white shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black">{results?.survey?.titulo || survey.titulo}</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold line-clamp-1 max-w-xl">
                  {results?.survey?.descripcion || survey.descripcion}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadResults} variant="outline" className="bg-white/10 border-white/10 hover:bg-white/20 rounded-xl h-12 font-black">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> ACTUALIZAR
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/10 hover:bg-white/20 rounded-xl h-12 font-black">
                <DownloadCloud className="h-4 w-4 mr-2" /> EXPORTAR
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-8 pt-6 space-y-8 scrollbar-premium">
          {loading && !results ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-[2rem]" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-[300px] rounded-[2rem]" />
                <Skeleton className="h-[300px] rounded-[2rem]" />
              </div>
            </div>
          ) : results ? (
            <div className="space-y-10">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'RESPUESTAS', value: getFilteredResponses().length, icon: <Users />, color: 'blue' },
                  { label: 'PARTICIPACIÓN', value: `${results.responses.length ? Math.round((getFilteredResponses().length / results.responses.length) * 100) : 0}%`, icon: <TrendingUp />, color: 'emerald' },
                  { label: 'PREGUNTAS', value: results.survey.preguntas.length, icon: <BarChart3 />, color: 'purple' },
                  { label: 'STATUS', value: 'FINALIZADO', icon: <CheckCircle />, color: 'amber' }
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                          stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                            stat.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                              'bg-amber-50 text-amber-600'
                        }`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl w-fit">
                  <TabsTrigger value="overview" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-8">Resumen</TabsTrigger>
                  <TabsTrigger value="individual" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-8">Participantes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                  <Card className="border-none shadow-sm rounded-[3rem] bg-white overflow-hidden p-8">
                    <CardHeader className="p-0 mb-8 border-b border-slate-100 pb-8">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Análisis Visual por Pregunta</h3>
                      </div>
                    </CardHeader>
                    <SurveyCharts questionResults={results.stats.questionResults} />
                  </Card>

                  <div className="grid grid-cols-1 gap-8">
                    {results.stats.questionResults.map((qr, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                          <CardHeader className="p-8 pb-4 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">PREGUNTA {idx + 1}</p>
                                <CardTitle className="text-xl font-black text-slate-800 leading-snug">{qr.question}</CardTitle>
                              </div>
                              <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-xl">
                                {qr.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8">
                            {renderResultsByType(qr.type, qr.results)}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="individual" className="space-y-6">
                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden p-8">
                    <div className="flex gap-4 mb-8">
                      <div className="relative flex-grow">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          placeholder="Filtrar participantes por nombre o email..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="pl-12 h-12 rounded-[1.2rem] bg-slate-50 border-slate-100 font-bold focus:ring-primary/20"
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[200px] h-12 rounded-[1.2rem] bg-slate-50 border-slate-100 font-bold">
                          <SelectValue placeholder="STATUS" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="all">TODOS</SelectItem>
                          <SelectItem value="residente">RESIDENTES</SelectItem>
                          <SelectItem value="admin">ADMINS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      {getFilteredResponses().map((resp, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-[1.8rem] bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 uppercase">
                              {resp.userName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 tracking-tight">{resp.userName || 'Usuario Anónimo'}</p>
                              <p className="text-xs font-bold text-slate-400">{resp.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ENVIADO EL</p>
                            <p className="text-xs font-black text-slate-700">{formatDate(resp.submittedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <BarChart3 className="h-16 w-16 text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">Sin datos para analizar</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
