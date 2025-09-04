"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  getEventos, 
  getResidenciales, 
  crearEvento, 
  actualizarEvento, 
  eliminarEvento,
  Evento,
  Residencial
} from "@/lib/firebase/firestore";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  CalendarDays
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

interface EventoFormData {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  ubicacion: string;
  organizador: string;
  residencialId: string;
  estado: 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentEvento, setCurrentEvento] = useState<Evento | null>(null);
  const [formData, setFormData] = useState<EventoFormData>({
    titulo: "",
    descripcion: "",
    fechaInicio: "",
    horaInicio: "09:00",
    fechaFin: "",
    horaFin: "18:00",
    ubicacion: "",
    organizador: "",
    residencialId: "",
    estado: 'programado',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener todos los eventos sin filtrar por residencial
        const eventosData = await getEventos("");
        const residencialesData = await getResidenciales();
        setEventos(eventosData);
        setResidenciales(residencialesData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (evento?: Evento) => {
    if (evento) {
      setCurrentEvento(evento);
      
      // Convertir Timestamp a formato de fecha y hora para el formulario
      const fechaInicio = evento.fechaInicio.toDate();
      const fechaFin = evento.fechaFin.toDate();
      
      setFormData({
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        fechaInicio: format(fechaInicio, 'yyyy-MM-dd'),
        horaInicio: format(fechaInicio, 'HH:mm'),
        fechaFin: format(fechaFin, 'yyyy-MM-dd'),
        horaFin: format(fechaFin, 'HH:mm'),
        ubicacion: evento.ubicacion,
        organizador: evento.organizador,
        residencialId: evento.residencialId,
        estado: evento.estado,
      });
    } else {
      setCurrentEvento(null);
      
      // Fecha actual para valores por defecto
      const hoy = new Date();
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);
      
      setFormData({
        titulo: "",
        descripcion: "",
        fechaInicio: format(hoy, 'yyyy-MM-dd'),
        horaInicio: "09:00",
        fechaFin: format(manana, 'yyyy-MM-dd'),
        horaFin: "18:00",
        ubicacion: "",
        organizador: "",
        residencialId: residenciales.length > 0 ? residenciales[0].id || "" : "",
        estado: 'programado',
      });
    }
    setOpenDialog(true);
  };

  const handleDeleteConfirm = (evento: Evento) => {
    setCurrentEvento(evento);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!currentEvento) return;
    
    try {
      await eliminarEvento(currentEvento.id || "");
      setEventos(eventos.filter(evento => evento.id !== currentEvento.id));
      toast.success("Evento eliminado correctamente");
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      toast.error("Error al eliminar el evento");
    }
  };

  const handleSubmit = async () => {
    try {
      // Validar fechas
      const fechaInicioObj = new Date(`${formData.fechaInicio}T${formData.horaInicio}`);
      const fechaFinObj = new Date(`${formData.fechaFin}T${formData.horaFin}`);
      
      if (fechaFinObj < fechaInicioObj) {
        toast.error("La fecha de finalización debe ser posterior a la fecha de inicio");
        return;
      }
      
      // Convertir fechas a Timestamp para Firestore
      const eventoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fechaInicio: Timestamp.fromDate(fechaInicioObj),
        fechaFin: Timestamp.fromDate(fechaFinObj),
        ubicacion: formData.ubicacion,
        organizador: formData.organizador,
        residencialId: formData.residencialId,
        estado: formData.estado,
      };
      
      if (currentEvento) {
        // Actualizar evento existente
        const updatedEvento = await actualizarEvento(currentEvento.id || "", eventoData);
        // Convertir el resultado a tipo Evento para evitar errores de tipo
        const updatedEventoTyped = updatedEvento as unknown as Evento;
        setEventos(eventos.map(evento => 
          evento.id === currentEvento.id ? { ...evento, ...updatedEventoTyped } : evento
        ));
        toast.success("Evento actualizado correctamente");
      } else {
        // Añadir nuevo evento
        const newEvento = await crearEvento(eventoData);
        // Convertir el resultado a tipo Evento para evitar errores de tipo
        const newEventoTyped = newEvento as unknown as Evento;
        setEventos([...eventos, newEventoTyped]);
        toast.success("Evento añadido correctamente");
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error al guardar evento:", error);
      toast.error("Error al guardar el evento");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredEventos = eventos.filter(evento => {
    const matchesSearch = evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evento.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evento.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResidencial = residencialFilter === "todos" || evento.residencialId === residencialFilter;
    const matchesEstado = estadoFilter === "todos" || evento.estado === estadoFilter;
    
    return matchesSearch && matchesResidencial && matchesEstado;
  });

  const getResidencialNombre = (id: string) => {
    const residencial = residenciales.find(r => r.id === id);
    return residencial ? residencial.nombre : "Desconocido";
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'programado': return 'outline';
      case 'en_curso': return 'success';
      case 'finalizado': return 'secondary';
      case 'cancelado': return 'warning';
      default: return 'outline';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'programado': return 'Programado';
      case 'en_curso': return 'En curso';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  const formatFecha = (timestamp: Timestamp) => {
    const fecha = timestamp.toDate();
    return format(fecha, "dd MMM yyyy, HH:mm", { locale: es });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Añadir Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Eventos</CardTitle>
          <CardDescription>
            Administra los eventos programados para los residenciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar eventos..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Select
                  value={residencialFilter}
                  onValueChange={(value) => setResidencialFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Residencial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los residenciales</SelectItem>
                    {residenciales
                      .filter(residencial => residencial.id)
                      .map((residencial) => (
                      <SelectItem key={residencial.id} value={residencial.id!}>
                        {residencial.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={estadoFilter}
                  onValueChange={(value) => setEstadoFilter(value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="programado">Programados</SelectItem>
                    <SelectItem value="en_curso">En curso</SelectItem>
                    <SelectItem value="finalizado">Finalizados</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Residencial</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No se encontraron eventos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEventos.map((evento) => (
                        <TableRow key={evento.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{evento.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {evento.descripcion}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getResidencialNombre(evento.residencialId)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">Inicio: {formatFecha(evento.fechaInicio)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">Fin: {formatFecha(evento.fechaFin)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{evento.ubicacion}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadgeVariant(evento.estado)}>
                              {getEstadoLabel(evento.estado)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenDialog(evento)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteConfirm(evento)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para añadir/editar evento */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentEvento ? "Editar Evento" : "Añadir Evento"}
            </DialogTitle>
            <DialogDescription>
              {currentEvento
                ? "Modifica los detalles del evento seleccionado."
                : "Completa los detalles para añadir un nuevo evento."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titulo" className="text-right">
                Título
              </Label>
              <Input
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="residencialId" className="text-right">
                Residencial
              </Label>
              <Select
                value={formData.residencialId}
                onValueChange={(value) => handleSelectChange("residencialId", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar residencial" />
                </SelectTrigger>
                <SelectContent>
                  {residenciales
                    .filter(residencial => residencial.id)
                    .map((residencial) => (
                    <SelectItem key={residencial.id} value={residencial.id!}>
                      {residencial.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaInicio" className="text-right">
                Fecha Inicio
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <Input
                  id="horaInicio"
                  name="horaInicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={handleInputChange}
                  className="w-[120px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaFin" className="text-right">
                Fecha Fin
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="fechaFin"
                  name="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <Input
                  id="horaFin"
                  name="horaFin"
                  type="time"
                  value={formData.horaFin}
                  onChange={handleInputChange}
                  className="w-[120px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ubicacion" className="text-right">
                Ubicación
              </Label>
              <Input
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Ej: Salón de eventos, Área de alberca, etc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organizador" className="text-right">
                Organizador
              </Label>
              <Input
                id="organizador"
                name="organizador"
                value={formData.organizador}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Nombre del organizador o responsable"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">
                Estado
              </Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleSelectChange("estado", value as 'programado' | 'en_curso' | 'finalizado' | 'cancelado')}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el evento "{currentEvento?.titulo}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 