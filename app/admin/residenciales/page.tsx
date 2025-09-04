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
import { PlusCircle, Edit, Trash2, UsersRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui';
import { ResidentialService } from '@/lib/services';
import { AdminService } from '@/lib/services';
import { Residencial } from '@/types/models';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function ResidencialesPage() {
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageAdminsDialogOpen, setIsManageAdminsDialogOpen] = useState(false);
  const [selectedResidencial, setSelectedResidencial] = useState<Residencial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'México',
    totalHouses: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        const data = await ResidentialService.getAllResidentials();
        setResidenciales(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Error al cargar residenciales: ${error.message}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResidenciales();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    
    // Convertir a número si es totalHouses
    if (name === 'totalHouses') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleAddResidencial = async () => {
    try {
      setLoading(true);
      await ResidentialService.createResidential(formData);
      const updatedResidenciales = await ResidentialService.getAllResidentials();
      setResidenciales(updatedResidenciales);
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Éxito',
        description: 'Residencial creado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al crear residencial: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditResidencial = async () => {
    if (!selectedResidencial) return;
    
    try {
      setLoading(true);
      await ResidentialService.updateResidential(selectedResidencial.id, formData);
      const updatedResidenciales = await ResidentialService.getAllResidentials();
      setResidenciales(updatedResidenciales);
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: 'Éxito',
        description: 'Residencial actualizado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al actualizar residencial: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResidencial = async () => {
    if (!selectedResidencial) return;
    
    try {
      setLoading(true);
      await ResidentialService.deleteResidential(selectedResidencial.id);
      const updatedResidenciales = await ResidentialService.getAllResidentials();
      setResidenciales(updatedResidenciales);
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Éxito',
        description: 'Residencial eliminado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al eliminar residencial: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (residencial: Residencial) => {
    setSelectedResidencial(residencial);
    setFormData({
      name: residencial.name || '',
      address: residencial.address || '',
      city: residencial.city || '',
      state: residencial.state || '',
      postalCode: residencial.postalCode || '',
      country: residencial.country || 'México',
      totalHouses: residencial.totalHouses || 0
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (residencial: Residencial) => {
    setSelectedResidencial(residencial);
    setIsDeleteDialogOpen(true);
  };

  const openManageAdminsDialog = (residencial: Residencial) => {
    setSelectedResidencial(residencial);
    setIsManageAdminsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México',
      totalHouses: 0
    });
    setSelectedResidencial(null);
  };

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Residenciales</h1>
          <p className="text-muted-foreground">
            Administra los residenciales registrados en el sistema
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Residencial
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Residenciales</CardTitle>
          <CardDescription>
            Lista de todos los residenciales registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de residenciales</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Total Casas</TableHead>
                <TableHead>Administradores</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : residenciales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No hay residenciales registrados</TableCell>
                </TableRow>
              ) : (
                residenciales.map((residencial) => (
                  <TableRow key={residencial.id}>
                    <TableCell className="font-medium">{residencial.name}</TableCell>
                    <TableCell>{residencial.address}</TableCell>
                    <TableCell>{residencial.city}</TableCell>
                    <TableCell>{residencial.totalHouses || 'N/A'}</TableCell>
                    <TableCell>
                      {residencial.adminIds?.length ? (
                        <Badge variant="outline">{residencial.adminIds.length}</Badge>
                      ) : 'Sin admins'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openManageAdminsDialog(residencial)}
                        >
                          <UsersRound className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openEditDialog(residencial)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openDeleteDialog(residencial)}
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
        </CardContent>
      </Card>

      {/* Diálogo para añadir residencial */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Residencial</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del nuevo residencial
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Ciudad
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                Estado
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postalCode" className="text-right">
                Código Postal
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                País
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalHouses" className="text-right">
                Total Casas
              </Label>
              <Input
                id="totalHouses"
                name="totalHouses"
                type="number"
                value={formData.totalHouses}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsAddDialogOpen(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddResidencial} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar residencial */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Residencial</DialogTitle>
            <DialogDescription>
              Modifica los detalles del residencial
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Ciudad
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                Estado
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postalCode" className="text-right">
                Código Postal
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                País
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalHouses" className="text-right">
                Total Casas
              </Label>
              <Input
                id="totalHouses"
                name="totalHouses"
                type="number"
                value={formData.totalHouses}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsEditDialogOpen(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEditResidencial} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar residencial */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Residencial</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este residencial? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">Nombre: {selectedResidencial?.name}</p>
            <p className="text-muted-foreground">Dirección: {selectedResidencial?.address}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteResidencial} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para gestionar administradores */}
      <Dialog open={isManageAdminsDialogOpen} onOpenChange={setIsManageAdminsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Administradores del Residencial</DialogTitle>
            <DialogDescription>
              Asigna o elimina administradores para {selectedResidencial?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Esta funcionalidad estará disponible próximamente
            </p>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <p>Administradores actuales: {selectedResidencial?.adminIds?.length || 0}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageAdminsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 