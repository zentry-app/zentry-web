'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, UserRound, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGuardia, NewGuardiaData } from '@/lib/services/guardiaService';

interface Guardia {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  residencialId: string;
  residencialNombre: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function GuardiasPage() {
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGuardia, setSelectedGuardia] = useState<Guardia | null>(null);
  const [residenciales, setResidenciales] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState<NewGuardiaData>({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    residencialId: '',
    residencialNombre: '',
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      // Datos ficticios para demostración
      const mockResidenciales = [
        { id: 'res1', name: 'Los Pinos' },
        { id: 'res2', name: 'Valle Verde' },
        { id: 'res3', name: 'Bosques del Valle' }
      ];
      
      const mockGuardias = [
        { 
          id: 'g1', 
          nombre: 'Juan Pérez', 
          email: 'juan@ejemplo.com', 
          telefono: '555-1234', 
          residencialId: 'res1',
          residencialNombre: 'Los Pinos',
          status: 'active' as const
        },
        { 
          id: 'g2', 
          nombre: 'María López', 
          email: 'maria@ejemplo.com', 
          telefono: '555-5678', 
          residencialId: 'res2',
          residencialNombre: 'Valle Verde',
          status: 'active' as const
        },
        { 
          id: 'g3', 
          nombre: 'Roberto García', 
          email: 'roberto@ejemplo.com', 
          telefono: '555-9012', 
          residencialId: 'res3',
          residencialNombre: 'Bosques del Valle',
          status: 'inactive' as const
        }
      ];
      
      setResidenciales(mockResidenciales);
      setGuardias(mockGuardias);
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddGuardia = async () => {
    if (!formData.residencialId) {
      toast({
        title: 'Error de validación',
        description: 'Por favor, selecciona un residencial.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const residencialNombre = residenciales.find(r => r.id === formData.residencialId)?.name || '';
      
      await createGuardia({ ...formData, residencialNombre });

      toast({
        title: 'Éxito',
        description: 'Guardia creado correctamente. El usuario ya tiene los permisos asignados.',
      });

      setIsAddDialogOpen(false);
      resetForm();
      // Aquí deberías volver a cargar la lista de guardias desde Firebase
      // fetchGuardias(); 
    } catch (error: any) {
      console.error("Error al crear guardia:", error);
      toast({
        title: 'Error al crear guardia',
        description: error.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGuardia = () => {
    if (!selectedGuardia) return;
    
    const updatedGuardias = guardias.map(guardia => {
      if (guardia.id === selectedGuardia.id) {
        return {
          ...guardia,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          residencialId: formData.residencialId,
          residencialNombre: residenciales.find(r => r.id === formData.residencialId)?.name || '',
          status: formData.status as 'active' | 'inactive' | 'pending'
        };
      }
      return guardia;
    });
    
    setGuardias(updatedGuardias);
    setIsEditDialogOpen(false);
    resetForm();
    toast({
      title: 'Éxito',
      description: 'Guardia actualizado correctamente',
    });
  };

  const handleDeleteGuardia = () => {
    if (!selectedGuardia) return;
    
    const filteredGuardias = guardias.filter(guardia => guardia.id !== selectedGuardia.id);
    setGuardias(filteredGuardias);
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Éxito',
      description: 'Guardia eliminado correctamente',
    });
  };

  const openEditDialog = (guardia: Guardia) => {
    setSelectedGuardia(guardia);
    setFormData({
      nombre: guardia.nombre,
      email: guardia.email,
      telefono: guardia.telefono,
      residencialId: guardia.residencialId,
      status: guardia.status
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (guardia: Guardia) => {
    setSelectedGuardia(guardia);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      telefono: '',
      residencialId: '',
      residencialNombre: '',
    });
    setSelectedGuardia(null);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Guardias</h1>
          <p className="text-muted-foreground">
            Administra los guardias de seguridad de los residenciales
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Guardia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5" />
            <CardTitle>Guardias de Seguridad</CardTitle>
          </div>
          <CardDescription>Lista de todos los guardias registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableCaption>Total de guardias: {guardias.length}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Residencial</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardias.map((guardia) => (
                  <TableRow key={guardia.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserRound className="mr-2 h-4 w-4" />
                        {guardia.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{guardia.email}</TableCell>
                    <TableCell>{guardia.telefono}</TableCell>
                    <TableCell>{guardia.residencialNombre}</TableCell>
                    <TableCell>{getStatusBadge(guardia.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(guardia)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(guardia)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {guardias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay guardias registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para Añadir Guardia */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Guardia</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo miembro de seguridad. La contraseña debe tener al menos 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Contraseña</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="residencial" className="text-right">
                Residencial
              </Label>
              <Select 
                value={formData.residencialId} 
                onValueChange={(value) => handleSelectChange('residencialId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar residencial" />
                </SelectTrigger>
                <SelectContent>
                  {residenciales.map((res) => (
                    <SelectItem key={res.id} value={res.id}>
                      {res.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddGuardia} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Guardia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Guardia */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Guardia</DialogTitle>
            <DialogDescription>
              Actualiza la información del guardia de seguridad
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">
                Teléfono
              </Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="residencial" className="text-right">
                Residencial
              </Label>
              <Select 
                value={formData.residencialId} 
                onValueChange={(value) => handleSelectChange('residencialId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar residencial" />
                </SelectTrigger>
                <SelectContent>
                  {residenciales.map((res) => (
                    <SelectItem key={res.id} value={res.id}>
                      {res.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditGuardia}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Eliminar Guardia */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al guardia {selectedGuardia?.nombre}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteGuardia}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 