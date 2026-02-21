'use client';

import { useState, useEffect, useMemo } from 'react';
import { KnowledgeBaseItem, AssistantType, ASSISTANT_TYPES } from '@/types/support';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Check,
  Loader2,
  HelpCircle,
  Tag,
  FileText,
  Sparkles,
  Info,
  Users
} from 'lucide-react';
import { SupportService } from '@/lib/services/support-service';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KnowledgeBaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: KnowledgeBaseItem;
  onSave: (item: Partial<KnowledgeBaseItem>, itemId?: string) => void;
}

export function KnowledgeBaseForm({ open, onOpenChange, item, onSave }: KnowledgeBaseFormProps) {
  const [pregunta, setPregunta] = useState(item?.pregunta || '');
  const [variantesPregunta, setVariantesPregunta] = useState<string[]>(item?.variantesPregunta || []);
  const [varianteInput, setVarianteInput] = useState('');
  const [respuesta, setRespuesta] = useState(item?.respuesta || '');
  const [categoria, setCategoria] = useState(item?.categoria || 'general');
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [roles, setRoles] = useState<AssistantType[]>(item?.roles?.length ? item.roles : ['residente']);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Resetear formulario cuando se abre/cierra o cambia el item
  useEffect(() => {
    if (open) {
      setPregunta(item?.pregunta || '');
      setVariantesPregunta(item?.variantesPregunta || []);
      setVarianteInput('');
      setRespuesta(item?.respuesta || '');
      setCategoria(item?.categoria || 'general');
      setTags(item?.tags || []);
      setRoles(item?.roles?.length ? item.roles : ['residente']);
      setTagInput('');
      setShowPreview(false);
    }
  }, [open, item]);

  // Cargar tags disponibles para sugerencias
  useEffect(() => {
    if (open) {
      const loadTags = async () => {
        try {
          setLoadingTags(true);
          const allTags = await SupportService.getAllTags();
          setAvailableTags(allTags);
        } catch (error) {
          console.error('Error cargando tags:', error);
        } finally {
          setLoadingTags(false);
        }
      };
      loadTags();
    }
  }, [open]);

  // Calcular el texto que se usará para el embedding
  const embeddingText = useMemo(() => {
    const variantesText = variantesPregunta.length > 0 
      ? ` ${variantesPregunta.join(" ")}` 
      : "";
    return `${pregunta}${variantesText} ${respuesta} ${tags.join(" ")}`.trim();
  }, [pregunta, variantesPregunta, respuesta, tags]);

  // Filtrar tags disponibles (excluir los ya agregados)
  const filteredTags = useMemo(() => {
    return availableTags.filter(
      (tag) => !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())
    );
  }, [availableTags, tags, tagInput]);

  const handleAddVariante = () => {
    if (varianteInput.trim() && !variantesPregunta.includes(varianteInput.trim())) {
      setVariantesPregunta([...variantesPregunta, varianteInput.trim()]);
      setVarianteInput('');
    }
  };

  const handleRemoveVariante = (varianteToRemove: string) => {
    setVariantesPregunta(variantesPregunta.filter((v) => v !== varianteToRemove));
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
      setTagPopoverOpen(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleRegenerateEmbedding = async () => {
    if (!item?.knowledgeId) {
      toast.error('Solo se puede regenerar el embedding para preguntas existentes');
      return;
    }

    if (!pregunta.trim() || !respuesta.trim()) {
      toast.error('Se requiere pregunta y respuesta para generar el embedding');
      return;
    }

    try {
      setIsRegenerating(true);
      await SupportService.regenerateEmbedding(item.knowledgeId, {
        pregunta: pregunta.trim(),
        variantesPregunta,
        respuesta: respuesta.trim(),
        tags,
        categoria,
      });
      toast.success('Embedding regenerado exitosamente');
    } catch (error: any) {
      console.error('Error regenerando embedding:', error);
      toast.error(error.message || 'Error al regenerar embedding');
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleRole = (role: AssistantType) => {
    setRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length <= 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleSubmit = async () => {
    if (!pregunta.trim() || !respuesta.trim()) {
      toast.error('Pregunta y respuesta son requeridos');
      return;
    }

    if (roles.length === 0) {
      toast.error('Debes seleccionar al menos un rol');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          pregunta: pregunta.trim(),
          variantesPregunta: variantesPregunta.length > 0 ? variantesPregunta : undefined,
          respuesta: respuesta.trim(),
          categoria,
          tags,
          roles,
          activo: item?.activo ?? true,
        },
        item?.knowledgeId
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-white/20 shadow-zentry-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            {item ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {item
              ? 'Actualiza la información de la pregunta frecuente para mejorar las respuestas del chatbot'
              : 'Crea una nueva pregunta frecuente que el chatbot podrá usar para responder consultas de los usuarios'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pregunta Principal */}
          <div className="space-y-2">
            <Label htmlFor="pregunta" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pregunta Principal *
            </Label>
            <Input
              id="pregunta"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="¿Cómo puedo...?"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Esta es la pregunta principal que aparecerá en la base de conocimiento
            </p>
          </div>

          <Separator />

          {/* Variantes de Pregunta */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Variantes de Pregunta
            </Label>
            <div className="flex gap-2">
              <Input
                value={varianteInput}
                onChange={(e) => setVarianteInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariante();
                  }
                }}
                placeholder="Agregar variante (ej: ¿Dónde puedo...?)"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddVariante} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {variantesPregunta.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {variantesPregunta.map((variante) => (
                  <Badge key={variante} variant="outline" className="flex items-center gap-1">
                    {variante}
                    <button
                      onClick={() => handleRemoveVariante(variante)}
                      className="ml-1 hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Agrega variantes de la pregunta para mejorar la búsqueda semántica del chatbot
            </p>
          </div>

          <Separator />

          {/* Roles (multi-select) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Roles de Asistente *
            </Label>
            <div className="flex flex-wrap gap-2">
              {ASSISTANT_TYPES.map((type) => {
                const isSelected = roles.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleRole(type.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-muted-foreground/20 hover:bg-muted hover:border-muted-foreground/40"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {type.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona en qué asistentes aplica esta pregunta. Puedes elegir varios.
            </p>
          </div>

          <Separator />

          {/* Respuesta */}
          <div className="space-y-2">
            <Label htmlFor="respuesta" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Respuesta *
            </Label>
            <Textarea
              id="respuesta"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder="La respuesta que dará el chatbot..."
              rows={6}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Esta respuesta será proporcionada por el chatbot cuando se haga una pregunta similar
            </p>
          </div>

          <Separator />

          {/* Categoría y Tags en fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categoría
              </Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="facturacion">Facturación</SelectItem>
                  <SelectItem value="acceso">Acceso</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex-1">
                      <Input
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          if (e.target.value && !tagPopoverOpen) {
                            setTagPopoverOpen(true);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (tagInput.trim()) {
                              handleAddTag();
                            }
                          }
                        }}
                        placeholder="Escribe o selecciona un tag..."
                        className="w-full"
                      />
                    </div>
                  </PopoverTrigger>
                  {filteredTags.length > 0 && (
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar tag..." />
                        <CommandList>
                          <CommandEmpty>
                            {loadingTags ? 'Cargando tags...' : 'No se encontraron tags'}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredTags.slice(0, 10).map((tag) => (
                              <CommandItem
                                key={tag}
                                value={tag}
                                onSelect={() => handleAddTag(tag)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    tags.includes(tag) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tag}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>
                <Button 
                  type="button" 
                  onClick={() => handleAddTag()} 
                  variant="outline"
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive transition-colors"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Los tags ayudan a categorizar y mejorar la búsqueda semántica
              </p>
            </div>
          </div>

          <Separator />

          {/* Preview del texto usado para embeddings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview: Texto usado para Embedding
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Preview
                  </>
                )}
              </Button>
            </div>
            {showPreview && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Texto que se usará para generar el embedding:</p>
                    <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground font-mono whitespace-pre-wrap break-words border">
                      {embeddingText || '(Vacío - completa los campos para ver el preview)'}
                    </div>
                    <p className="text-xs mt-2">
                      Este texto incluye: pregunta principal, variantes, respuesta y tags. 
                      Se usa para generar el vector embedding que permite búsqueda semántica.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botón de regenerar embedding (solo para items existentes) */}
          {item?.knowledgeId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Regenerar Embedding
                </Label>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Regenera el embedding vectorial con los datos actuales
                    </p>
                    {item.embedding && (
                      <p className="text-xs text-muted-foreground">
                        Embedding actual: {item.embedding.length} dimensiones
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRegenerateEmbedding}
                    disabled={isRegenerating || !pregunta.trim() || !respuesta.trim()}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!pregunta.trim() || !respuesta.trim() || isSaving}
            className="rounded-xl shadow-zentry hover-lift font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                {item ? 'Actualizar' : 'Crear'} Pregunta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
