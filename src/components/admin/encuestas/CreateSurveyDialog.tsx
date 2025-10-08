'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Calendar,
  HelpCircle,
  CheckSquare,
  Square,
  Radio,
  Type,
  ThumbsUp,
  ThumbsDown,
  Star,
  Hash,
  Clock,
  Grid3X3,
  List,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AdminService } from '@/lib/services/admin-service';

interface Question {
  id: string;
  pregunta: string;
  tipo: string;
  opciones?: string[];
  matrizOpciones?: Record<string, string[]>;
  minValue?: number;
  maxValue?: number;
  escalaMax?: number;
}

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  residencialId?: string;
  creadorUid?: string;
}

const questionTypes = [
  { value: 'textoLibre', label: 'Texto libre', icon: Type, description: 'Respuesta de texto abierto' },
  { value: 'opcionUnica', label: 'Opción única', icon: Radio, description: 'Seleccionar una opción' },
  { value: 'opcionMultiple', label: 'Opción múltiple', icon: CheckSquare, description: 'Seleccionar varias opciones' },
  { value: 'siNo', label: 'Sí/No', icon: ThumbsUp, description: 'Respuesta binaria' },
  { value: 'escalaLikert', label: 'Escala Likert', icon: Star, description: 'Escala de 1-5' },
  { value: 'escalaNumero', label: 'Escala numérica', icon: Hash, description: 'Números con slider' },
  { value: 'escalaFrecuencia', label: 'Escala frecuencia', icon: Clock, description: 'Nunca-Siempre' },
  { value: 'matriz', label: 'Matriz', icon: Grid3X3, description: 'Preguntas matriciales' },
  { value: 'clasificacion', label: 'Clasificación', icon: List, description: 'Ordenar opciones' },
  { value: 'deslizante', label: 'Deslizante', icon: Sliders, description: 'Valor con slider' },
];

export function CreateSurveyDialog({ open, onOpenChange, onSubmit, residencialId, creadorUid }: CreateSurveyDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedResidencialId, setSelectedResidencialId] = useState('');
  const [residenciales, setResidenciales] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResidenciales, setLoadingResidenciales] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadResidenciales();
      // Reset form
      setTitulo('');
      setDescripcion('');
      setFechaFin('');
      setSelectedResidencialId(residencialId || '');
      setQuestions([]);
    }
  }, [open, residencialId]);

  const loadResidenciales = async () => {
    try {
      setLoadingResidenciales(true);
      const data = await AdminService.getResidenciales();
      setResidenciales(data);
    } catch (error) {
      console.error('Error loading residenciales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los residenciales',
        variant: 'destructive'
      });
    } finally {
      setLoadingResidenciales(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      pregunta: '',
      tipo: 'textoLibre',
      opciones: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...(question.opciones || []), ''];
      updateQuestion(questionId, { opciones: newOptions });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.opciones) {
      const newOptions = [...question.opciones];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { opciones: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.opciones) {
      const newOptions = question.opciones.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { opciones: newOptions });
    }
  };

  const validateForm = () => {
    if (!titulo.trim()) {
      toast({
        title: 'Error',
        description: 'El título es requerido',
        variant: 'destructive'
      });
      return false;
    }

    if (!descripcion.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        variant: 'destructive'
      });
      return false;
    }

    if (!fechaFin) {
      toast({
        title: 'Error',
        description: 'La fecha límite es requerida',
        variant: 'destructive'
      });
      return false;
    }

    if (!selectedResidencialId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un residencial',
        variant: 'destructive'
      });
      return false;
    }

    if (questions.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe agregar al menos una pregunta',
        variant: 'destructive'
      });
      return false;
    }

    // Validar preguntas
    for (const question of questions) {
      if (!question.pregunta.trim()) {
        toast({
          title: 'Error',
          description: 'Todas las preguntas deben tener texto',
          variant: 'destructive'
        });
        return false;
      }

      if (['opcionUnica', 'opcionMultiple'].includes(question.tipo)) {
        if (!question.opciones || question.opciones.length < 2) {
          toast({
            title: 'Error',
            description: 'Las preguntas de opción deben tener al menos 2 opciones',
            variant: 'destructive'
          });
          return false;
        }

        if (question.opciones.some(opt => !opt.trim())) {
          toast({
            title: 'Error',
            description: 'Todas las opciones deben tener texto',
            variant: 'destructive'
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const surveyData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaFin,
        preguntas: questions.map(q => ({
          pregunta: q.pregunta.trim(),
          tipo: q.tipo,
          opciones: q.opciones?.filter(opt => opt.trim()),
          matrizOpciones: q.matrizOpciones,
          minValue: q.minValue,
          maxValue: q.maxValue,
          escalaMax: q.escalaMax
        })),
        residencialId: selectedResidencialId,
        creadorUid: creadorUid || user?.uid || ''
      };

      await onSubmit(surveyData);
    } catch (error) {
      console.error('Error creating survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    const questionType = questionTypes.find(qt => qt.value === type);
    return questionType ? questionType.icon : HelpCircle;
  };

  const getQuestionTypeLabel = (type: string) => {
    const questionType = questionTypes.find(qt => qt.value === type);
    return questionType ? questionType.label : type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Encuesta</DialogTitle>
          <DialogDescription>
            Crea una nueva encuesta para recopilar información de los residentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Satisfacción con servicios"
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el propósito de la encuesta"
                  rows={3}
                />
              </div>

              <div className={`grid gap-4 ${residencialId ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <Label htmlFor="fechaFin">Fecha límite *</Label>
                  <Input
                    id="fechaFin"
                    type="datetime-local"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {!residencialId && (
                  <div>
                    <Label htmlFor="residencial">Residencial *</Label>
                    <Select value={selectedResidencialId} onValueChange={setSelectedResidencialId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar residencial" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingResidenciales ? (
                          <SelectItem value="" disabled>Cargando...</SelectItem>
                        ) : (
                          residenciales.map((residencial) => (
                            <SelectItem key={residencial.id} value={residencial.id}>
                              {residencial.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {residencialId && (
                  <div>
                    <Label htmlFor="residencial">Residencial</Label>
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Residencial asignado automáticamente</p>
                        <p className="text-xs text-muted-foreground">Según tu rol de administrador</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preguntas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preguntas</CardTitle>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pregunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>No hay preguntas agregadas</p>
                  <p className="text-sm">Haz clic en "Agregar Pregunta" para comenzar</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Pregunta {index + 1}</Badge>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const Icon = getQuestionTypeIcon(question.tipo);
                              return <Icon className="h-4 w-4" />;
                            })()}
                            <span className="text-sm text-muted-foreground">
                              {getQuestionTypeLabel(question.tipo)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Texto de la pregunta *</Label>
                        <Input
                          value={question.pregunta}
                          onChange={(e) => updateQuestion(question.id, { pregunta: e.target.value })}
                          placeholder="Escribe tu pregunta aquí"
                        />
                      </div>

                      <div>
                        <Label>Tipo de pregunta</Label>
                        <Select
                          value={question.tipo}
                          onValueChange={(value) => updateQuestion(question.id, { tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div>
                                      <div>{type.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {type.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Opciones para preguntas de selección */}
                      {['opcionUnica', 'opcionMultiple'].includes(question.tipo) && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Opciones de respuesta</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {question.opciones?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  {question.tipo === 'opcionUnica' ? (
                                    <Radio className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                    placeholder={`Opción ${optionIndex + 1}`}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(question.id, optionIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Configuraciones adicionales para escalas */}
                      {question.tipo === 'escalaNumero' && (
                        <div>
                          <Label htmlFor={`escalaMax-${question.id}`}>Valor máximo</Label>
                          <Input
                            id={`escalaMax-${question.id}`}
                            type="number"
                            value={question.escalaMax || 10}
                            onChange={(e) => updateQuestion(question.id, { escalaMax: parseInt(e.target.value) || 10 })}
                            min="1"
                            max="100"
                          />
                        </div>
                      )}

                      {question.tipo === 'deslizante' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`minValue-${question.id}`}>Valor mínimo</Label>
                            <Input
                              id={`minValue-${question.id}`}
                              type="number"
                              value={question.minValue || 0}
                              onChange={(e) => updateQuestion(question.id, { minValue: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`maxValue-${question.id}`}>Valor máximo</Label>
                            <Input
                              id={`maxValue-${question.id}`}
                              type="number"
                              value={question.maxValue || 100}
                              onChange={(e) => updateQuestion(question.id, { maxValue: parseFloat(e.target.value) || 100 })}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear Encuesta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
