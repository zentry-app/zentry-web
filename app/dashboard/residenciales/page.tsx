"use client";

import React from 'react';
import { useGlobalAdminRequired } from '@/lib/hooks/useGlobalAdminRequired';
import { Loader2 } from 'lucide-react'; // O tu componente de carga preferido
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Building, 
  RefreshCw, 
  Edit, 
  Trash, 
  Eye, 
  MapPin, 
  Users, 
  Home, 
  CreditCard, 
  DollarSign,
  Save,
  BriefcaseIcon,
  Landmark
} from "lucide-react";
import { getResidenciales, eliminarResidencial, crearResidencial, actualizarResidencial, Residencial } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";

// Esquema de validación para el formulario de residencial
const residencialSchema = z.object({
  id: z.string().optional(),
  residencialID: z.string()
    .length(6, "El código debe tener exactamente 6 caracteres")
    .regex(/^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$/, "El código debe contener al menos una letra y un número"),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(3, "La ciudad debe tener al menos 3 caracteres"),
  estado: z.string().min(3, "El estado debe tener al menos 3 caracteres"),
  codigoPostal: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
  cuotaMantenimiento: z.coerce.number().min(0, "La cuota debe ser un número positivo"),
  calles: z.array(z.string()).optional(),
  cuentaPago: z.object({
    banco: z.string().min(3, "El banco debe tener al menos 3 caracteres").optional().or(z.literal("")),
    numeroCuenta: z.string().min(10, "El número de cuenta debe tener al menos 10 caracteres").optional().or(z.literal("")),
    clabe: z.string().min(18, "La CLABE debe tener al menos 18 caracteres").optional().or(z.literal("")),
    titular: z.string().min(5, "El titular debe tener al menos 5 caracteres").optional().or(z.literal("")),
  }).optional(),
});

type ResidencialFormValues = z.infer<typeof residencialSchema>;

export default function ResidencialesPage() {
  const router = useRouter();
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [residencialAEliminar, setResidencialAEliminar] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState<"crear" | "editar">("crear");
  const [residencialSeleccionado, setResidencialSeleccionado] = useState<Residencial | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const { isGlobalAdminAllowed, isGlobalAdminLoading } = useGlobalAdminRequired();

  // Configuración del formulario
  const form = useForm<ResidencialFormValues>({
    resolver: zodResolver(residencialSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      ciudad: "",
      estado: "",
      codigoPostal: "",
      cuotaMantenimiento: 0,
      calles: [],
      cuentaPago: {
        banco: "",
        numeroCuenta: "",
        clabe: "",
        titular: "",
      },
    },
  });

  // Generar un ID aleatorio de 6 caracteres (letras mayúsculas y números) que contenga al menos un número y una letra
  const generarResidencialID = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    
    // Asegurar al menos una letra
    resultado += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    
    // Asegurar al menos un número
    resultado += '0123456789'[Math.floor(Math.random() * 10)];
    
    // Generar el resto de caracteres aleatorios para completar 6 caracteres
    for (let i = 0; i < 4; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Mezclar los caracteres para que la posición de la letra y el número sea aleatoria
    const idMezclado = resultado.split('').sort(() => 0.5 - Math.random()).join('');
    
    console.log(`ID Residencial generado: ${idMezclado}, longitud: ${idMezclado.length}`);
    
    return idMezclado;
  };

  useEffect(() => {
    const cargarResidenciales = async () => {
      setIsLoading(true);
      try {
        const data = await getResidenciales();
        setResidenciales(data);
      } catch (error) {
        console.error("Error al cargar residenciales:", error);
        toast.error("Error al cargar la lista de residenciales");
      } finally {
        setIsLoading(false);
      }
    };

    cargarResidenciales();
  }, []);

  useEffect(() => {
    // Resetear formulario cuando cambia el modo o residencial seleccionado
    if (formMode === "crear") {
      // Mantener el ID residencial si ya fue establecido, o generar uno nuevo
      const residencialIDActual = form.getValues("residencialID");
      const idAUsar = residencialIDActual || generarResidencialID();
      
      form.reset({
        residencialID: idAUsar,
        nombre: "",
        direccion: "",
        ciudad: "",
        estado: "",
        codigoPostal: "",
        cuotaMantenimiento: 0,
        calles: [],
        cuentaPago: {
          banco: "",
          numeroCuenta: "",
          clabe: "",
          titular: "",
        },
      });
    } else if (formMode === "editar" && residencialSeleccionado) {
      form.reset({
        id: residencialSeleccionado.id,
        residencialID: residencialSeleccionado.residencialID || generarResidencialID(),
        nombre: residencialSeleccionado.nombre,
        direccion: residencialSeleccionado.direccion,
        ciudad: residencialSeleccionado.ciudad,
        estado: residencialSeleccionado.estado,
        codigoPostal: residencialSeleccionado.codigoPostal,
        cuotaMantenimiento: residencialSeleccionado.cuotaMantenimiento,
        calles: residencialSeleccionado.calles || [],
        cuentaPago: residencialSeleccionado.cuentaPago || {
          banco: "",
          numeroCuenta: "",
          clabe: "",
          titular: "",
        },
      });
    }
  }, [formMode, residencialSeleccionado, form]);

  const handleEliminarResidencial = async () => {
    if (!residencialAEliminar) return;
    
    try {
      await eliminarResidencial(residencialAEliminar);
      setResidenciales(prev => prev.filter(r => r.id !== residencialAEliminar));
      toast.success("Residencial eliminado correctamente");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error al eliminar residencial:", error);
      toast.error("Error al eliminar el residencial");
    }
  };

  const confirmarEliminar = (id: string) => {
    setResidencialAEliminar(id);
    setShowDeleteDialog(true);
  };

  const abrirFormularioCrear = () => {
    setFormMode("crear");
    setResidencialSeleccionado(null);
    setShowFormDialog(true);
    
    // Generar un nuevo ID al abrir el formulario
    const nuevoID = generarResidencialID();
    form.setValue("residencialID", nuevoID);
  };

  const abrirFormularioEditar = (residencial: Residencial) => {
    setFormMode("editar");
    setResidencialSeleccionado(residencial);
    setShowFormDialog(true);
  };

  const onSubmit = async (values: ResidencialFormValues) => {
    setFormSubmitting(true);
    try {
      // Verificar si todos los campos de cuentaPago están vacíos
      const cuentaPagoVacia = !values.cuentaPago || 
        ((!values.cuentaPago.banco || values.cuentaPago.banco === "") && 
         (!values.cuentaPago.numeroCuenta || values.cuentaPago.numeroCuenta === "") && 
         (!values.cuentaPago.clabe || values.cuentaPago.clabe === "") && 
         (!values.cuentaPago.titular || values.cuentaPago.titular === ""));
  
      // Datos a enviar, excluyendo cuentaPago si está vacía
      const datosResidencial: any = {
        residencialID: values.residencialID,
        nombre: values.nombre,
        direccion: values.direccion,
        ciudad: values.ciudad,
        estado: values.estado,
        codigoPostal: values.codigoPostal,
        cuotaMantenimiento: values.cuotaMantenimiento,
        calles: values.calles || [],
      };
  
      // Solo incluir cuentaPago si no está vacía
      if (!cuentaPagoVacia && values.cuentaPago) {
        datosResidencial.cuentaPago = {
          banco: values.cuentaPago.banco || "",
          numeroCuenta: values.cuentaPago.numeroCuenta || "",
          clabe: values.cuentaPago.clabe || "",
          titular: values.cuentaPago.titular || "",
        };
      }
  
      if (formMode === "crear") {
        // Crear nuevo residencial
        const nuevoResidencial = await crearResidencial(datosResidencial);
        
        // Convertir el objeto devuelto por Firebase a un objeto de tipo Residencial
        const residencialCreado: Residencial = {
          id: nuevoResidencial.id,
          residencialID: values.residencialID,
          nombre: values.nombre,
          direccion: values.direccion,
          ciudad: values.ciudad,
          estado: values.estado,
          codigoPostal: values.codigoPostal,
          cuotaMantenimiento: values.cuotaMantenimiento,
          calles: values.calles || [],
          fechaRegistro: null,
          fechaActualizacion: null,
        };
  
        // Solo incluir cuentaPago si no está vacía
        if (!cuentaPagoVacia && values.cuentaPago) {
          residencialCreado.cuentaPago = {
            banco: values.cuentaPago.banco || "",
            numeroCuenta: values.cuentaPago.numeroCuenta || "",
            clabe: values.cuentaPago.clabe || "",
            titular: values.cuentaPago.titular || "",
          };
        }
        
        setResidenciales(prev => [...prev, residencialCreado]);
        toast.success("Residencial creado correctamente");
      } else if (formMode === "editar" && values.id) {
        // Actualizar residencial existente
        await actualizarResidencial(values.id, datosResidencial);
        
        // Actualizar la lista de residenciales
        setResidenciales(prev => prev.map(r => {
          if (r.id === values.id) {
            const residencialActualizado = { 
              ...r, 
              residencialID: values.residencialID,
              nombre: values.nombre,
              direccion: values.direccion,
              ciudad: values.ciudad,
              estado: values.estado,
              codigoPostal: values.codigoPostal,
              cuotaMantenimiento: values.cuotaMantenimiento,
              calles: values.calles || [],
            };
            
            // Solo incluir cuentaPago si no está vacía
            if (!cuentaPagoVacia && values.cuentaPago) {
              residencialActualizado.cuentaPago = {
                banco: values.cuentaPago.banco || "",
                numeroCuenta: values.cuentaPago.numeroCuenta || "",
                clabe: values.cuentaPago.clabe || "",
                titular: values.cuentaPago.titular || "",
              };
            } else {
              // Eliminar cuentaPago si está vacía
              delete residencialActualizado.cuentaPago;
            }
            
            return residencialActualizado;
          }
          return r;
        }));
        
        toast.success("Residencial actualizado correctamente");
      }
      setShowFormDialog(false);
    } catch (error) {
      console.error("Error al guardar residencial:", error);
      toast.error(`Error al ${formMode === "crear" ? "crear" : "actualizar"} el residencial`);
    } finally {
      setFormSubmitting(false);
    }
  };

  const residencialesFiltrados = residenciales.filter(residencial => {
    if (!searchTerm) return true;
    
    const termino = searchTerm.toLowerCase();
    return (
      residencial.nombre.toLowerCase().includes(termino) ||
      residencial.direccion.toLowerCase().includes(termino) ||
      residencial.ciudad.toLowerCase().includes(termino) ||
      residencial.estado.toLowerCase().includes(termino) ||
      (residencial.residencialID && residencial.residencialID.toLowerCase().includes(termino))
    );
  });

  const verDetallesResidencial = (id: string) => {
    const residencial = residenciales.find(r => r.id === id);
    if (residencial) {
      setResidencialSeleccionado(residencial);
      // Mostrar detalles en un diálogo
      setFormMode("editar");
      setShowFormDialog(true);
    }
  };

  if (isGlobalAdminLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Verificando permisos de acceso...</p>
      </div>
    );
  }

  if (!isGlobalAdminAllowed) {
    // El hook useGlobalAdminRequired ya maneja la redirección.
    // Mostrar null aquí evita cualquier renderizado momentáneo de contenido no autorizado.
    return null;
  }

  // Si el código llega aquí, el usuario es un Administrador Global.
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Gestión de Residenciales
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra todos los residenciales del sistema. Solo visible para Administradores Globales.
        </p>
      </header>
      
      <main className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Residenciales</h2>
            <p className="text-muted-foreground">
              Administra los residenciales de la plataforma
            </p>
          </div>
          <Button onClick={abrirFormularioCrear}>
            <Building className="mr-2 h-4 w-4" />
            Nuevo Residencial
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar residenciales..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Listado de Residenciales</CardTitle>
            <CardDescription>
              {residencialesFiltrados.length} residenciales encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : residencialesFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <Building className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No se encontraron residenciales</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {residencialesFiltrados.map((residencial) => (
                  <Card key={residencial.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 bg-gradient-to-r from-primary-50 to-accent-50">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{residencial.nombre}</CardTitle>
                        <Badge variant="outline" className="font-mono">
                          {residencial.residencialID || "------"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {residencial.ciudad}, {residencial.estado}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">{residencial.direccion}</p>
                        <p className="text-muted-foreground">CP: {residencial.codigoPostal}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Cuota: ${typeof residencial.cuotaMantenimiento === 'number' ? residencial.cuotaMantenimiento.toFixed(2) : '0.00'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {residencial.cuentaPago?.banco || 'Sin datos bancarios'}
                        </Badge>
                        {residencial.calles && residencial.calles.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {residencial.calles.length} {residencial.calles.length === 1 ? 'calle' : 'calles'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => verDetallesResidencial(residencial.id!)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => abrirFormularioEditar(residencial)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => confirmarEliminar(residencial.id!)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo de eliminación */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este residencial? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEliminarResidencial}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de formulario para crear/editar residencial */}
        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {formMode === "crear" ? "Crear nuevo residencial" : "Editar residencial"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "crear" 
                  ? "Completa el formulario para crear un nuevo residencial" 
                  : "Modifica la información del residencial"}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Información básica</TabsTrigger>
                    <TabsTrigger value="calles">Calles</TabsTrigger>
                    <TabsTrigger value="banco">Datos bancarios</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="residencialID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de residencial</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} maxLength={6} className="font-mono" />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => {
                                  const nuevoID = generarResidencialID();
                                  form.setValue("residencialID", nuevoID);
                                }}
                                title="Generar nuevo código"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription>
                              Código único de 6 caracteres (debe contener letras y números)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ciudad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="codigoPostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Postal</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="cuotaMantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuota de Mantenimiento</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="number" step="0.01" min="0" className="pl-8" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="calles" className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Calles del residencial</h3>
                      <div className="ml-auto text-xs text-muted-foreground">(Opcional)</div>
                    </div>
                    
                    <div className="space-y-4">
                      {form.watch("calles")?.map((calle, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            value={calle}
                            onChange={(e) => {
                              const nuevasCalles = [...(form.getValues("calles") || [])];
                              nuevasCalles[index] = e.target.value;
                              form.setValue("calles", nuevasCalles);
                            }}
                            placeholder="Nombre de la calle"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const nuevasCalles = [...(form.getValues("calles") || [])];
                              nuevasCalles.splice(index, 1);
                              form.setValue("calles", nuevasCalles);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const callesActuales = form.getValues("calles") || [];
                          form.setValue("calles", [...callesActuales, ""]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar calle
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="banco" className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Landmark className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Información bancaria</h3>
                      <div className="ml-auto text-xs text-muted-foreground">(Opcional)</div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="cuentaPago.banco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cuentaPago.titular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titular de la cuenta</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cuentaPago.numeroCuenta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de cuenta</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cuentaPago.clabe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CLABE interbancaria</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowFormDialog(false)}
                    disabled={formSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="gap-2"
                  >
                    {formSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {formMode === "crear" ? "Crear residencial" : "Guardar cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
} 