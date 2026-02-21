"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, FileText, Image, MessageSquare, Upload, Download, Trash2, Sparkles, RefreshCw, Wand2, ArrowRight } from "lucide-react";
import React from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "@/lib/firebase/config";
import { getAuth } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Comunicado {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'texto' | 'imagen' | 'pdf';
  url?: string;
  fecha: any;
  path?: string;
}

export default function ComunicadosPage() {
  const { userClaims } = useAuth();
  const { toast } = useToast();
  const [titulo, setTitulo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [residencialDocId, setResidencialDocId] = React.useState<string | null>(null);
  const [residencialFieldId, setResidencialFieldId] = React.useState<string | null>(null);
  const [comunicados, setComunicados] = React.useState<Comunicado[]>([]);
  const [activeTab, setActiveTab] = React.useState("crear");
  const [comunicadoAEliminar, setComunicadoAEliminar] = React.useState<Comunicado | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [eliminando, setEliminando] = React.useState(false);
  
  // Estados para generación con IA
  const [ideaComunicado, setIdeaComunicado] = React.useState("");
  const [textoGenerado, setTextoGenerado] = React.useState("");
  const [generando, setGenerando] = React.useState(false);
  const [ideaOriginal, setIdeaOriginal] = React.useState("");
  const [tonoSeleccionado, setTonoSeleccionado] = React.useState<string>("");

  // Obtener el ID del residencial del usuario
  React.useEffect(() => {
    const getResidencialId = async () => {
      if (userClaims?.residencialId) {
        try {
          // Buscar el documento del residencial por el ID de campo
          const residencialesRef = collection(db, 'residenciales');
          const q = query(residencialesRef, where('residencialID', '==', userClaims.residencialId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const residencialDoc = querySnapshot.docs[0];
            setResidencialDocId(residencialDoc.id);
            setResidencialFieldId(userClaims.residencialId);
            
            // Cargar comunicados existentes
            await loadComunicados(residencialDoc.id);
          }
        } catch (error) {
          console.error('Error al obtener residencial:', error);
        }
      }
    };

    getResidencialId();
  }, [userClaims?.residencialId]);

  const loadComunicados = async (residencialId: string) => {
    try {
      const comunicadosRef = collection(db, 'residenciales', residencialId, 'documentos');
      const q = query(comunicadosRef, orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const comunicadosData: Comunicado[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comunicado));
      
      setComunicados(comunicadosData);
    } catch (error) {
      console.error('Error al cargar comunicados:', error);
    }
  };

  async function handleUpload() {
    if (!residencialDocId || !residencialFieldId || titulo.trim().length === 0) return;
    
    setLoading(true);
    try {
      let url = '';
      let path = '';
      let tipo: 'texto' | 'imagen' | 'pdf' = 'texto';

      if (file) {
        // Subir archivo
        const isPdf = file.type === 'application/pdf';
        tipo = isPdf ? 'pdf' : 'imagen';
        path = `residenciales/${residencialFieldId}/documentos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage!, path);

        toast({
          title: "Subiendo archivo...",
          description: "Por favor espera mientras se sube el documento",
        });

        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }

      // Guardar en Firestore
      await addDoc(collection(db, 'residenciales', residencialDocId, 'documentos'), {
        titulo: titulo,
        descripcion: descripcion || '',
        url: url || '',
        path: path || '',
        tipo: tipo,
        fecha: serverTimestamp(),
      });

      // Enviar notificaciones
      try {
        toast({
          title: "Enviando notificaciones...",
          description: "Notificando a todos los residentes del residencial",
        });

        const notify = httpsCallable(functions, 'sendDocumentAnnouncement');
        await notify({
          residencialId: residencialFieldId,
          titulo: titulo,
          descripcion: descripcion || '',
          url: url || '',
          tipo: tipo
        });

        toast({
          title: "¡Éxito!",
          description: "Comunicado enviado y notificaciones enviadas a todos los residentes",
          variant: "default",
        });
      } catch (e) {
        console.warn('No se pudo notificar a los residentes', e);
        toast({
          title: "Comunicado enviado",
          description: "El comunicado se envió correctamente, pero hubo un problema al enviar las notificaciones",
          variant: "destructive",
        });
      }

      // Limpiar formulario y recargar comunicados
      setTitulo("");
      setDescripcion("");
      setFile(null);
      await loadComunicados(residencialDocId);
      
    } catch (e: any) {
      toast({
        title: "Error al enviar",
        description: `No se pudo enviar el comunicado: ${e.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'imagen': return <Image className="h-5 w-5 text-blue-500" />;
      default: return <MessageSquare className="h-5 w-5 text-green-500" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'pdf': return <Badge variant="destructive">PDF</Badge>;
      case 'imagen': return <Badge variant="default">Imagen</Badge>;
      default: return <Badge variant="secondary">Texto</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (url: string, titulo: string, tipo: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Determinar extensión del archivo
      const extension = tipo === 'pdf' ? '.pdf' : '.jpg';
      const fileName = `${titulo.replace(/[^\w\s-]/g, '')}${extension}`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Descarga iniciada",
        description: `El archivo ${fileName} se está descargando`,
      });
    } catch (error) {
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleEliminarComunicado = async (comunicado: Comunicado) => {
    setComunicadoAEliminar(comunicado);
    setShowDeleteDialog(true);
  };

  const confirmarEliminacion = async () => {
    if (!comunicadoAEliminar || !residencialDocId) return;
    
    setEliminando(true);
    try {
      // Eliminar archivo de Storage si existe
      if (comunicadoAEliminar.path) {
        try {
          const storageRef = ref(storage, comunicadoAEliminar.path);
          await deleteObject(storageRef);
          console.log('Archivo eliminado de Storage:', comunicadoAEliminar.path);
        } catch (error) {
          console.warn('No se pudo eliminar el archivo de Storage:', error);
          // Continuar con la eliminación del documento aunque falle el archivo
        }
      }

      // Eliminar documento de Firestore
      const comunicadoRef = doc(db, 'residenciales', residencialDocId, 'documentos', comunicadoAEliminar.id);
      await deleteDoc(comunicadoRef);

      // Actualizar la lista de comunicados
      await loadComunicados(residencialDocId);

      toast({
        title: "Comunicado eliminado",
        description: `El comunicado "${comunicadoAEliminar.titulo}" ha sido eliminado correctamente`,
      });

    } catch (error: any) {
      console.error('Error al eliminar comunicado:', error);
      toast({
        title: "Error al eliminar",
        description: `No se pudo eliminar el comunicado: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setEliminando(false);
      setShowDeleteDialog(false);
      setComunicadoAEliminar(null);
    }
  };

  // Funciones para generación con IA
  const getAuthToken = async (): Promise<string> => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await user.getIdToken();
  };

  const handleGenerarComunicado = async () => {
    if (!ideaComunicado.trim()) return;

    setGenerando(true);
    setIdeaOriginal(ideaComunicado);
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idea: ideaComunicado,
          accion: 'generar'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el comunicado');
      }

      const data = await response.json();
      setTextoGenerado(data.texto);
      
      toast({
        title: "¡Comunicado generado!",
        description: "El texto ha sido generado exitosamente. Puedes ajustarlo o usarlo directamente.",
      });
    } catch (error: any) {
      console.error('Error generando comunicado:', error);
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar el comunicado. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleMejorarRedaccion = async () => {
    if (!textoGenerado) return;

    setGenerando(true);
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          textoActual: textoGenerado,
          accion: 'mejorar'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al mejorar la redacción');
      }

      const data = await response.json();
      setTextoGenerado(data.texto);
      
      toast({
        title: "Redacción mejorada",
        description: "El texto ha sido mejorado exitosamente.",
      });
    } catch (error: any) {
      console.error('Error mejorando redacción:', error);
      toast({
        title: "Error al mejorar",
        description: error.message || "No se pudo mejorar la redacción. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleAjustarTono = async (tono: string) => {
    if (!textoGenerado) return;

    setGenerando(true);
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          textoActual: textoGenerado,
          accion: 'ajustar-tono',
          tono: tono
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al ajustar el tono');
      }

      const data = await response.json();
      setTextoGenerado(data.texto);
      setTonoSeleccionado("");
      
      toast({
        title: "Tono ajustado",
        description: `El tono ha sido ajustado a ${tono} exitosamente.`,
      });
    } catch (error: any) {
      console.error('Error ajustando tono:', error);
      toast({
        title: "Error al ajustar",
        description: error.message || "No se pudo ajustar el tono. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleRegenerar = async () => {
    if (!ideaOriginal) return;

    setGenerando(true);
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/comunicados/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idea: ideaOriginal,
          accion: 'regenerar'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al regenerar el comunicado');
      }

      const data = await response.json();
      setTextoGenerado(data.texto);
      
      toast({
        title: "Comunicado regenerado",
        description: "Se ha generado una nueva versión del comunicado.",
      });
    } catch (error: any) {
      console.error('Error regenerando comunicado:', error);
      toast({
        title: "Error al regenerar",
        description: error.message || "No se pudo regenerar el comunicado. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleUsarTexto = () => {
    if (!textoGenerado) return;

    // Extraer título y descripción del texto generado
    const lineas = textoGenerado.split('\n').filter(linea => linea.trim());
    
    // Buscar un título (línea corta al inicio, o línea que contenga "Título:" o similar)
    let tituloFinal = '';
    let descripcionInicio = 0;
    
    // Buscar patrón "Título:" o similar
    const tituloIndex = lineas.findIndex(linea => 
      linea.toLowerCase().includes('título:') || 
      linea.toLowerCase().includes('titulo:') ||
      linea.toLowerCase().includes('asunto:')
    );
    
    if (tituloIndex >= 0) {
      // Extraer el título de la línea que contiene "Título:"
      tituloFinal = lineas[tituloIndex].replace(/^(título|titulo|asunto):\s*/i, '').trim();
      descripcionInicio = tituloIndex + 1;
    } else {
      // Si no hay patrón, usar la primera línea si es corta (probable título)
      const primeraLinea = lineas[0]?.trim() || '';
      if (primeraLinea.length > 0 && primeraLinea.length <= 100) {
        tituloFinal = primeraLinea;
        descripcionInicio = 1;
      } else {
        // Si la primera línea es muy larga, generar un título genérico
        tituloFinal = 'Comunicado Importante';
        descripcionInicio = 0;
      }
    }
    
    // Si el título es muy largo, truncarlo
    if (tituloFinal.length > 100) {
      tituloFinal = tituloFinal.substring(0, 100).trim();
      const ultimoEspacio = tituloFinal.lastIndexOf(' ');
      if (ultimoEspacio > 0) {
        tituloFinal = tituloFinal.substring(0, ultimoEspacio);
      }
    }
    
    // La descripción es el resto del texto
    const descripcionFinal = lineas.slice(descripcionInicio).join('\n').trim() || textoGenerado;

    setTitulo(tituloFinal);
    setDescripcion(descripcionFinal);
    
    // Cambiar a la pestaña de crear
    setActiveTab('crear');
    
    toast({
      title: "Texto aplicado",
      description: "El texto generado ha sido copiado al formulario. Puedes editarlo antes de enviar.",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Comunicados</h1>
        <p className="text-gray-600">
          Gestiona y envía comunicados importantes a todos los residentes del residencial.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crear">📝 Crear Comunicado</TabsTrigger>
          <TabsTrigger value="ia">🤖 Generar con IA</TabsTrigger>
          <TabsTrigger value="ver">📋 Ver Comunicados ({comunicados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="crear" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Nuevo Comunicado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej. Corte de agua programado"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Detalle del comunicado (opcional)"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="archivo">Archivo (opcional)</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Si no subes archivo, se enviará como comunicado de texto. Formatos soportados: PDF, JPG, PNG, GIF
                </p>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={loading || !residencialDocId || titulo.trim().length === 0}
                className="w-full"
              >
                {loading ? 'Enviando...' : '📢 Enviar Comunicado'}
              </Button>

              {!residencialDocId && (
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                  ⚠️ No se pudo identificar el residencial. Asegúrate de estar asociado a un residencial.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generar Comunicado con IA
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Escribe la idea del comunicado y la IA generará un texto profesional para ti
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="idea">Idea del Comunicado *</Label>
                <Textarea
                  id="idea"
                  value={ideaComunicado}
                  onChange={e => setIdeaComunicado(e.target.value)}
                  placeholder="Ej. Informar a los residentes sobre un corte de agua programado para el próximo lunes de 8am a 2pm debido a mantenimiento de tuberías"
                  rows={4}
                  disabled={generando}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Describe brevemente qué quieres comunicar a los residentes
                </p>
              </div>

              <Button
                onClick={handleGenerarComunicado}
                disabled={!ideaComunicado.trim() || generando}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Comunicado
                  </>
                )}
              </Button>

              {textoGenerado && (
                <div className="space-y-4 mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="texto-generado" className="text-base font-semibold text-gray-700">Texto Generado</Label>
                    <Badge variant="outline" className="bg-white">IA Generado - Editable</Badge>
                  </div>
                  
                  <div>
                    <Textarea
                      id="texto-generado"
                      value={textoGenerado}
                      onChange={e => setTextoGenerado(e.target.value)}
                      placeholder="El texto generado aparecerá aquí. Puedes editarlo manualmente."
                      rows={10}
                      className="bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-400 min-h-[200px] resize-y"
                      disabled={generando}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Puedes editar el texto manualmente antes de usar las opciones de mejora o aplicarlo al formulario
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMejorarRedaccion}
                      disabled={generando}
                      className="flex items-center gap-2"
                    >
                      <Wand2 className="h-4 w-4" />
                      Mejorar Redacción
                    </Button>

                    <Select value={tonoSeleccionado} onValueChange={setTonoSeleccionado}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ajustar Tono" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="amigable">Amigable</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>

                    {tonoSeleccionado && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAjustarTono(tonoSeleccionado)}
                        disabled={generando}
                        className="flex items-center gap-2"
                      >
                        Aplicar Tono
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerar}
                      disabled={generando || !ideaOriginal}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerar
                    </Button>

                    <Button
                      onClick={handleUsarTexto}
                      disabled={generando}
                      className="ml-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
                    >
                      Usar este Texto
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ver" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comunicados Enviados
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Los comunicados más recientes aparecen primero
              </p>
            </CardHeader>
            <CardContent>
              {comunicados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay comunicados enviados aún.</p>
                  <p className="text-sm">Los comunicados que envíes aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comunicados.map((comunicado) => (
                    <Card key={comunicado.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTipoIcon(comunicado.tipo)}
                              <h3 className="font-semibold text-lg">{comunicado.titulo}</h3>
                              {getTipoBadge(comunicado.tipo)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEliminarComunicado(comunicado)}
                                className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {comunicado.descripcion && (
                              <p className="text-gray-600 mb-3">{comunicado.descripcion}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(comunicado.fecha)}
                              </div>
                              
                              {comunicado.url && (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={comunicado.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Ver archivo
                                  </a>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(comunicado.url!, comunicado.titulo, comunicado.tipo)}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              ¿Estás seguro de que quieres eliminar el comunicado{" "}
              <span className="font-semibold">"{comunicadoAEliminar?.titulo}"</span>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Esta acción no se puede deshacer. Si el comunicado tiene un archivo adjunto, también será eliminado.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminacion}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


