'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings, Users, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '../../../src/lib/firebase/config';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

interface AreaComun {
  id: string;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  esDePago: boolean;
  precio?: number;
  activa: boolean;
  reglamento?: Reglamento;
}

interface Reglamento {
  maxHorasPorReserva: number;
  maxReservasPorDia: number;
  maxReservasPorSemana: number;
  maxReservasPorMes: number;
  antelacionMinima: number; // horas
  antelacionMaxima: number; // días
  cancelacionMinima: number; // horas antes
  permiteInvitados: boolean;
  maxInvitados: number;
  requiereAprobacion: boolean;
  horarios: {
    apertura: string;
    cierre: string;
    diasDisponibles: string[];
  };
}

export default function AreasComunesPage() {
  console.log('🚀 [AreasComunesPage] Componente iniciado');
  
  const { userData } = useAuth();
  const router = useRouter();
  const [areas, setAreas] = useState<AreaComun[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaComun | null>(null);
  const [formData, setFormData] = useState<Partial<AreaComun>>({
    nombre: '',
    descripcion: '',
    capacidad: 50,
    esDePago: false,
    precio: 0,
    activa: true,
    reglamento: {
      maxHorasPorReserva: 4,
      maxReservasPorDia: 1,
      maxReservasPorSemana: 3,
      maxReservasPorMes: 10,
      antelacionMinima: 1, // 1 día por defecto
      antelacionMaxima: 30,
      cancelacionMinima: 2,
      permiteInvitados: true,
      maxInvitados: 10,
      requiereAprobacion: false,
      horarios: {
        apertura: '08:00',
        cierre: '22:00',
        diasDisponibles: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      }
    }
  });

  useEffect(() => {
    console.log('🔄 [useEffect] Ejecutándose - userData:', !!userData);
    
    if (!userData) {
      console.log('❌ [useEffect] No hay userData, redirigiendo a login');
      router.push('/login');
      return;
    }
    
    console.log('✅ [useEffect] Cargando áreas');
    loadAreas();
  }, [userData]);

  const loadAreas = async () => {
    console.log('📥 [loadAreas] Iniciando carga de áreas');
    try {
      setLoading(true);
      
      if (!userData?.residencialId) {
        toast.error('No se encontró el ID del residencial');
        return;
      }

      // Cargar áreas comunes desde Firebase
      const areasRef = collection(db, 'areas_comunes');
      const areasQuery = query(areasRef, where('residencialId', '==', userData.residencialId));
      const areasSnapshot = await getDocs(areasQuery);
      
      const areasData: AreaComun[] = [];
      areasSnapshot.forEach((doc) => {
        const data = doc.data();
        areasData.push({
          id: doc.id,
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          capacidad: data.capacidad || 50,
          esDePago: data.esDePago || false,
          precio: data.precio || 0,
          activa: data.activa !== false,
          reglamento: data.reglamento || {
            maxHorasPorReserva: 4,
            maxReservasPorDia: 1,
            maxReservasPorSemana: 3,
            maxReservasPorMes: 10,
            antelacionMinima: 1, // 1 día por defecto
            antelacionMaxima: 30,
            cancelacionMinima: 2,
            permiteInvitados: true,
            maxInvitados: 10,
            requiereAprobacion: false,
            horarios: {
              apertura: '08:00',
              cierre: '22:00',
              diasDisponibles: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            }
          }
        });
      });
      
      setAreas(areasData);
      console.log('Áreas cargadas:', areasData);
    } catch (error) {
      console.error('Error cargando áreas:', error);
      toast.error('Error al cargar las áreas comunes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 [handleSubmit] INICIO - saving:', saving);
    
    if (!userData?.residencialId) {
      console.log('❌ [handleSubmit] No hay residencialId');
      toast.error('No se encontró el ID del residencial');
      return;
    }
    
    console.log('⏳ [handleSubmit] Antes de setSaving(true)');
    setSaving(true);
    console.log('✅ [handleSubmit] Después de setSaving(true)');
    
    try {
      const areaData = {
        ...formData,
        residencialId: userData.residencialId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingArea) {
        console.log('📝 [handleSubmit] Actualizando área existente:', editingArea.id);
        // Actualizar área existente en Firebase
        const areaRef = doc(db, 'areas_comunes', editingArea.id);
        console.log('🔥 [handleSubmit] Antes de updateDoc');
        await updateDoc(areaRef, {
          ...areaData,
          updatedAt: new Date()
        });
        console.log('✅ [handleSubmit] updateDoc completado');
        
        // Actualizar estado local
        const updatedAreas = areas.map(area => 
          area.id === editingArea.id 
            ? { ...area, ...formData }
            : area
        );
        setAreas(updatedAreas);
        toast.success('Área actualizada exitosamente');
      } else {
        console.log('🆕 [handleSubmit] Creando nueva área');
        // Crear nueva área en Firebase
        const areasRef = collection(db, 'areas_comunes');
        console.log('🔥 [handleSubmit] Antes de addDoc área');
        const docRef = await addDoc(areasRef, areaData);
        console.log('✅ [handleSubmit] addDoc área completado, ID:', docRef.id);
        
        // Crear reglamento en Firebase
        const reglamentoData = {
          residencialId: userData.residencialId,
          areaId: docRef.id,
          nombreArea: formData.nombre,
          ...formData.reglamento,
          activa: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('🔥 [handleSubmit] Antes de addDoc reglamento');
        const reglamentosRef = collection(db, 'area_reglamentos');
        await addDoc(reglamentosRef, reglamentoData);
        console.log('✅ [handleSubmit] addDoc reglamento completado');
        
        // Actualizar estado local
        const { id, ...formDataWithoutId } = formData as AreaComun;
        const newArea: AreaComun = {
          id: docRef.id,
          ...formDataWithoutId
        };
        setAreas([...areas, newArea]);
        toast.success('Área creada exitosamente');
      }
      
      setShowForm(false);
      setEditingArea(null);
      setFormData({
        nombre: '',
        descripcion: '',
        capacidad: 50,
        esDePago: false,
        precio: 0,
        activa: true,
        reglamento: {
          maxHorasPorReserva: 4,
          maxReservasPorDia: 1,
          maxReservasPorSemana: 3,
          maxReservasPorMes: 10,
          antelacionMinima: 24,
          antelacionMaxima: 30,
          cancelacionMinima: 2,
          permiteInvitados: true,
          maxInvitados: 10,
          requiereAprobacion: false,
          horarios: {
            apertura: '08:00',
            cierre: '22:00',
            diasDisponibles: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
          }
        }
      });
    } catch (error) {
      console.error('❌ [handleSubmit] Error guardando área:', error);
      toast.error('Error guardando área');
    } finally {
      console.log('🔄 [handleSubmit] FINALLY - Antes de setSaving(false)');
      setSaving(false);
      console.log('✅ [handleSubmit] FINALLY - Después de setSaving(false)');
    }
  };

  const handleEdit = (area: AreaComun) => {
    setEditingArea(area);
    setFormData(area);
    setShowForm(true);
  };

  const handleDelete = async (areaId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta área?')) {
      try {
        // Eliminar área de Firebase
        const areaRef = doc(db, 'areas_comunes', areaId);
        await deleteDoc(areaRef);
        
        // Eliminar reglamento asociado
        const reglamentosRef = collection(db, 'area_reglamentos');
        const reglamentoQuery = query(reglamentosRef, where('areaId', '==', areaId));
        const reglamentoSnapshot = await getDocs(reglamentoQuery);
        
        for (const reglamentoDoc of reglamentoSnapshot.docs) {
          await deleteDoc(doc(db, 'area_reglamentos', reglamentoDoc.id));
        }
        
        // Actualizar estado local
        setAreas(areas.filter(area => area.id !== areaId));
        toast.success('Área eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando área:', error);
        toast.error('Error eliminando área');
      }
    }
  };

  const toggleAreaStatus = async (areaId: string) => {
    try {
      const area = areas.find(a => a.id === areaId);
      if (!area) return;
      
      const newStatus = !area.activa;
      
      // Actualizar estado en Firebase
      const areaRef = doc(db, 'areas_comunes', areaId);
      await updateDoc(areaRef, {
        activa: newStatus,
        updatedAt: new Date()
      });
      
      // Actualizar reglamento asociado
      const reglamentosRef = collection(db, 'area_reglamentos');
      const reglamentoQuery = query(reglamentosRef, where('areaId', '==', areaId));
      const reglamentoSnapshot = await getDocs(reglamentoQuery);
      
      for (const reglamentoDoc of reglamentoSnapshot.docs) {
        await updateDoc(doc(db, 'area_reglamentos', reglamentoDoc.id), {
          activa: newStatus,
          updatedAt: new Date()
        });
      }
      
      // Actualizar estado local
      const updatedAreas = areas.map(area =>
        area.id === areaId ? { ...area, activa: newStatus } : area
      );
      setAreas(updatedAreas);
      toast.success('Estado del área actualizado');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error actualizando estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Áreas Comunes</h1>
          <p className="text-gray-600 mt-2">
            Configura las áreas comunes y sus reglamentos de reserva
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingArea ? 'Editar Área Común' : 'Nueva Área Común'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Área</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Sala de Eventos"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacidad">Capacidad</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del área..."
                />
              </div>

              {/* Configuración de pago */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="esDePago"
                  checked={formData.esDePago}
                  onCheckedChange={(checked) => setFormData({...formData, esDePago: checked})}
                />
                <Label htmlFor="esDePago">Es de pago</Label>
              </div>

              {formData.esDePago && (
                <div>
                  <Label htmlFor="precio">Precio (MXN)</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value)})}
                    placeholder="500"
                  />
                </div>
              )}

              {/* Reglamentos */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Reglamentos de Reserva</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxHoras">Máx. Horas por Reserva</Label>
                    <Input
                      id="maxHoras"
                      type="number"
                      value={formData.reglamento?.maxHorasPorReserva}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, maxHorasPorReserva: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDia">Máx. Reservas por Día (por Casa)</Label>
                    <Input
                      id="maxDia"
                      type="number"
                      value={formData.reglamento?.maxReservasPorDia}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, maxReservasPorDia: parseInt(e.target.value)}
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Límite compartido por todos los residentes de la misma casa</p>
                  </div>
                  <div>
                    <Label htmlFor="maxSemana">Máx. Reservas por Semana (por Casa)</Label>
                    <Input
                      id="maxSemana"
                      type="number"
                      value={formData.reglamento?.maxReservasPorSemana}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, maxReservasPorSemana: parseInt(e.target.value)}
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Límite compartido por todos los residentes de la misma casa</p>
                  </div>
                </div>

                {/* Información de ayuda */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Configuración de reservas</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Límites por Casa:</strong> Los límites de reservas (diario, semanal, mensual) se aplican por domicilio/casa, no por usuario individual. Todos los residentes de la misma casa comparten estos límites.</p>
                    <p><strong>Antelación mínima:</strong> Los residentes solo pueden reservar X días antes de la fecha (no pueden reservar el día de hoy).</p>
                    <p><strong>Ventana de reservas:</strong> Cuántos días futuros mostrar en el calendario para reservar.</p>
                    <p><strong>Cancelación hasta:</strong> Los residentes pueden cancelar hasta X horas antes de la reserva.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="antelacionMinima">Antelación mínima (días)</Label>
                    <Input
                      id="antelacionMinima"
                      type="number"
                      placeholder="Ej: 5"
                      value={formData.reglamento?.antelacionMinima || 1}
                      onChange={(e) => {
                        const dias = parseInt(e.target.value);
                        // Guardar directamente en días, no en horas
                        setFormData({
                          ...formData, 
                          reglamento: {...formData.reglamento!, antelacionMinima: dias}
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej: 5 = reservar solo 5 días antes</p>
                  </div>
                  <div>
                    <Label htmlFor="ventanaReservas">Ventana de reservas (días)</Label>
                    <Input
                      id="ventanaReservas"
                      type="number"
                      placeholder="Ej: 30"
                      value={formData.reglamento?.antelacionMaxima}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, antelacionMaxima: parseInt(e.target.value)}
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej: 30 = mostrar 30 días en el calendario</p>
                  </div>
                  <div>
                    <Label htmlFor="cancelacion">Cancelación hasta (horas antes)</Label>
                    <Input
                      id="cancelacion"
                      type="number"
                      placeholder="Ej: 2"
                      value={formData.reglamento?.cancelacionMinima}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, cancelacionMinima: parseInt(e.target.value)}
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej: 2 = cancelar hasta 2 horas antes</p>
                  </div>
                </div>

                {/* Configuraciones adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="permiteInvitados"
                      checked={formData.reglamento?.permiteInvitados}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, permiteInvitados: checked}
                      })}
                    />
                    <Label htmlFor="permiteInvitados">Permite invitados</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiereAprobacion"
                      checked={formData.reglamento?.requiereAprobacion}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, requiereAprobacion: checked}
                      })}
                    />
                    <Label htmlFor="requiereAprobacion">Requiere aprobación</Label>
                  </div>
                </div>

                {formData.reglamento?.permiteInvitados && (
                  <div>
                    <Label htmlFor="maxInvitados">Máximo de invitados</Label>
                    <Input
                      id="maxInvitados"
                      type="number"
                      value={formData.reglamento?.maxInvitados}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {...formData.reglamento!, maxInvitados: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                )}
              </div>

              {/* Horarios */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Horarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apertura">Hora de Apertura</Label>
                    <Input
                      id="apertura"
                      type="time"
                      value={formData.reglamento?.horarios.apertura}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {
                          ...formData.reglamento!, 
                          horarios: {...formData.reglamento!.horarios, apertura: e.target.value}
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cierre">Hora de Cierre</Label>
                    <Input
                      id="cierre"
                      type="time"
                      value={formData.reglamento?.horarios.cierre}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reglamento: {
                          ...formData.reglamento!, 
                          horarios: {...formData.reglamento!.horarios, cierre: e.target.value}
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingArea(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : (editingArea ? 'Actualizar' : 'Crear') + ' Área'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <Card key={area.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {area.nombre}
                    <Badge variant={area.activa ? "default" : "secondary"}>
                      {area.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardTitle>
                  {area.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{area.descripcion}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAreaStatus(area.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(area.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Capacidad: {area.capacidad} personas</span>
                </div>
                
                {area.esDePago ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Precio: ${area.precio} MXN</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">Gratuito</span>
                  </div>
                )}

                {area.reglamento && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Máx. {area.reglamento.maxHorasPorReserva}h por reserva
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {area.reglamento.maxReservasPorDia} por día (por casa), {area.reglamento.maxReservasPorSemana} por semana (por casa)
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Horario: {area.reglamento.horarios.apertura} - {area.reglamento.horarios.cierre}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 