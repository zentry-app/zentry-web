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
import { Globe, Edit, Trash2, ShieldCheck, ShieldX, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AdminService } from '@/lib/services/admin-service';
import { UserModel, UserRole } from '@/types/models';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ResidentialService } from '@/lib/services/residential-service';
import { Residencial } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<UserModel[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<UserModel | null>(null);
  const [isGlobalAdminDialogOpen, setIsGlobalAdminDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignResidentialDialogOpen, setIsAssignResidentialDialogOpen] = useState(false);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');
  const { userData } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminsData, residencialesData] = await Promise.all([
          AdminService.getAllAdmins(),
          ResidentialService.getAllResidentials()
        ]);
        setAdmins(adminsData);
        setResidenciales(residencialesData);
      } catch (error: any) {
        toast.error(`Error al cargar datos: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleGlobalAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      setLoading(true);
      // Invertir el estado actual
      await AdminService.setUserAsGlobalAdmin(
        selectedAdmin.uid, 
        !selectedAdmin.isGlobalAdmin
      );
      
      // Actualizar la lista de administradores
      const updatedAdmins = await AdminService.getAllAdmins();
      setAdmins(updatedAdmins);
      setIsGlobalAdminDialogOpen(false);
      
      toast.success(
        selectedAdmin.isGlobalAdmin 
          ? 'Permisos de administrador global revocados' 
          : 'Permisos de administrador global otorgados'
      );
    } catch (error: any) {
      toast.error(`Error al cambiar permisos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignResidential = async () => {
    if (!selectedAdmin || !selectedResidencialId) return;
    
    try {
      setLoading(true);
      await AdminService.assignAdminToResidencial(
        selectedAdmin.uid,
        selectedResidencialId
      );
      
      // Actualizar la lista de administradores
      const updatedAdmins = await AdminService.getAllAdmins();
      setAdmins(updatedAdmins);
      setIsAssignResidentialDialogOpen(false);
      setSelectedResidencialId('');
      
      toast.success('Residencial asignado correctamente');
    } catch (error: any) {
      toast.error(`Error al asignar residencial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveResidential = async (adminId: string, residencialId: string) => {
    try {
      setLoading(true);
      await AdminService.removeAdminFromResidencial(adminId, residencialId);
      
      // Actualizar la lista de administradores
      const updatedAdmins = await AdminService.getAllAdmins();
      setAdmins(updatedAdmins);
      
      toast.success('Residencial removido correctamente');
    } catch (error: any) {
      toast.error(`Error al remover residencial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre del residencial por su ID
  const getResidencialName = (id: string) => {
    const res = residenciales.find(r => r.id === id);
    return res ? (res.name || res.nombre) : 'Desconocido';
  };

  return (
    <AdminLayout requireGlobalAdmin={true} title="Gestión de Administradores">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            Administra los permisos y residenciales asignados a cada administrador
          </p>
        </div>
        <Button 
          onClick={() => {}} 
          disabled={true} // Deshabilitar hasta implementar
          variant="outline"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Administrador
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableCaption>Lista de administradores</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Residenciales</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No hay administradores registrados</TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.uid}>
                    <TableCell className="font-medium">
                      {admin.fullName}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.isGlobalAdmin ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                          <Globe className="mr-1 h-3 w-3" />
                          Global
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
                          Local
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.managedResidencials && admin.managedResidencials.length > 0 ? (
                          admin.managedResidencials.map((resId) => (
                            <Badge key={resId} variant="secondary" className="cursor-pointer group">
                              {getResidencialName(resId)}
                              <button 
                                onClick={() => handleRemoveResidential(admin.uid, resId)}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ShieldX className="h-3 w-3 text-red-500" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {admin.isGlobalAdmin ? 'Todos' : 'Sin asignar'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsGlobalAdminDialogOpen(true);
                          }}
                        >
                          {admin.isGlobalAdmin ? (
                            <ShieldX className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsAssignResidentialDialogOpen(true);
                          }}
                          disabled={admin.isGlobalAdmin}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          disabled={true} // Deshabilitar hasta implementar
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

      {/* Diálogo para administrador global */}
      <Dialog open={isGlobalAdminDialogOpen} onOpenChange={setIsGlobalAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAdmin?.isGlobalAdmin 
                ? "Revocar permisos de administrador global" 
                : "Establecer como administrador global"
              }
            </DialogTitle>
            <DialogDescription>
              {selectedAdmin?.isGlobalAdmin 
                ? "Esta acción limitará el acceso del administrador solo a los residenciales asignados." 
                : "Un administrador global tiene acceso a todos los residenciales y funciones del sistema."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedAdmin?.fullName}</p>
                <p className="text-muted-foreground">{selectedAdmin?.email}</p>
              </div>
              <Switch 
                checked={selectedAdmin?.isGlobalAdmin || false} 
                onCheckedChange={() => {}} 
                disabled
              />
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-amber-600 text-sm">
              {selectedAdmin?.isGlobalAdmin 
                ? "⚠️ Al revocar los permisos globales, el administrador deberá ser asignado a residenciales específicos." 
                : "⚠️ Al otorgar permisos globales, el administrador tendrá acceso a todos los datos del sistema."
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGlobalAdminDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleToggleGlobalAdmin} 
              disabled={loading}
              variant={selectedAdmin?.isGlobalAdmin ? "destructive" : "default"}
            >
              {loading ? 'Procesando...' : (selectedAdmin?.isGlobalAdmin ? 'Revocar permisos' : 'Otorgar permisos')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para asignar residencial */}
      <Dialog open={isAssignResidentialDialogOpen} onOpenChange={setIsAssignResidentialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Residencial</DialogTitle>
            <DialogDescription>
              Selecciona un residencial para asignar a {selectedAdmin?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="residencial">Residencial</Label>
                <Select 
                  value={selectedResidencialId} 
                  onValueChange={setSelectedResidencialId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un residencial" />
                  </SelectTrigger>
                  <SelectContent>
                    {residenciales
                      .filter(r => !selectedAdmin?.managedResidencials?.includes(r.id))
                      .map(residencial => (
                        <SelectItem key={residencial.id} value={residencial.id}>
                          {residencial.name || residencial.nombre}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAdmin?.managedResidencials && selectedAdmin.managedResidencials.length > 0 && (
                <div>
                  <Label>Residenciales actuales</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedAdmin.managedResidencials.map(resId => (
                      <Badge key={resId} variant="secondary">
                        {getResidencialName(resId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssignResidentialDialogOpen(false);
              setSelectedResidencialId('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignResidential} 
              disabled={loading || !selectedResidencialId}
            >
              {loading ? 'Asignando...' : 'Asignar Residencial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 