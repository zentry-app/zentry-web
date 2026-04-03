"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Home, Eye, Car, User, Users, Mail, ChevronDown, ChevronRight } from "lucide-react";
import { Ingreso, Timestamp as IngresoTimestamp } from "@/types/ingresos";
import { CasaResumenIngresos } from "./VistaPorCasa";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Usuario } from "@/lib/firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IngresosPorCasaDialogProps {
  casa: CasaResumenIngresos | null;
  isOpen: boolean;
  onClose: () => void;
  onVerDetalles: (ingreso: Ingreso) => void;
  formatDateToRelative: (timestamp: IngresoTimestamp | Date | string) => string;
  formatDateToFull: (timestamp: IngresoTimestamp | Date | string) => string;
  getResidencialNombre: (docId: string | undefined) => string;
}

// Función para convertir timestamp de Firestore a Date
const convertFirestoreTimestampToDate = (timestamp: IngresoTimestamp | Date | string): Date => {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const IngresosPorCasaDialog: React.FC<IngresosPorCasaDialogProps> = ({
  casa,
  isOpen,
  onClose,
  onVerDetalles,
  formatDateToRelative,
  formatDateToFull,
  getResidencialNombre,
}) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'activos' | 'completados' | 'usuarios'>('todos');
  const [usuariosCasa, setUsuariosCasa] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState<boolean>(false);
  const [usuariosExpandidos, setUsuariosExpandidos] = useState<Set<string>>(new Set());

  // Obtener usuarios de la casa
  useEffect(() => {
    const obtenerUsuariosCasa = async () => {
      if (!casa || !isOpen) return;

      setLoadingUsuarios(true);
      try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(
          usuariosRef,
          where('residencialID', '==', casa.residencialID),
          where('calle', '==', casa.calle),
          where('houseNumber', '==', casa.houseNumber),
          where('status', 'in', ['pending', 'approved'])
        );

        const querySnapshot = await getDocs(q);
        const usuarios: Usuario[] = [];
        
        querySnapshot.forEach((doc) => {
          usuarios.push({
            id: doc.id,
            uid: doc.id,
            ...doc.data()
          } as Usuario);
        });

        setUsuariosCasa(usuarios);
      } catch (error) {
        console.error('Error al obtener usuarios de la casa:', error);
        setUsuariosCasa([]);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    obtenerUsuariosCasa();
  }, [casa, isOpen]);

  // Agrupar ingresos por usuario (userId)
  const ingresosPorUsuario = useMemo(() => {
    if (!casa) return new Map<string, { usuario: Usuario | null; ingresos: Ingreso[] }>();

    const map = new Map<string, { usuario: Usuario | null; ingresos: Ingreso[] }>();

    // Primero, inicializar todos los usuarios de la casa (incluso si no tienen ingresos)
    usuariosCasa.forEach(usuario => {
      const uid = usuario.uid || usuario.id || '';
      if (uid && !map.has(uid)) {
        map.set(uid, { usuario, ingresos: [] });
      }
    });

    // Luego, agregar los ingresos agrupados por userId
    casa.ingresos.forEach(ingreso => {
      const userId = ingreso.userId;
      if (!userId) return;

      // Buscar el usuario que coincide con el userId del ingreso
      const usuarioEncontrado = usuariosCasa.find(u => {
        const uid = u.uid || u.id || '';
        return uid === userId || uid === userId;
      });

      if (usuarioEncontrado) {
        const uid = usuarioEncontrado.uid || usuarioEncontrado.id || '';
        if (!map.has(uid)) {
          map.set(uid, { usuario: usuarioEncontrado, ingresos: [] });
        }
        map.get(uid)!.ingresos.push(ingreso);
      } else {
        // Si no encontramos el usuario pero hay un userId, crear una entrada
        if (!map.has(userId)) {
          map.set(userId, { usuario: null, ingresos: [] });
        }
        map.get(userId)!.ingresos.push(ingreso);
      }
    });

    // Ordenar ingresos por fecha (más recientes primero)
    map.forEach((value) => {
      value.ingresos.sort((a, b) => {
        const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
        const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
        return dateB - dateA;
      });
    });

    return map;
  }, [casa, usuariosCasa]);

  // Ingresos filtrados y ordenados para las pestañas de lista
  const ingresosFiltradosTodos = useMemo(() => {
    if (!casa) return [];
    return [...casa.ingresos].sort((a, b) => {
      const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
      const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [casa]);

  const ingresosFiltradosActivos = useMemo(() => {
    if (!casa) return [];
    return casa.ingresos
      .filter(i => i.status === 'active')
      .sort((a, b) => {
        const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
        const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
        return dateB - dateA;
      });
  }, [casa]);

  const ingresosFiltradosCompletados = useMemo(() => {
    if (!casa) return [];
    return casa.ingresos
      .filter(i => i.status === 'completed')
      .sort((a, b) => {
        const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
        const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
        return dateB - dateA;
      });
  }, [casa]);

  if (!casa) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Ingresos de la Casa: {capitalizeName(casa.calle || 'Calle s/d')} #{casa.houseNumber || ''}
          </DialogTitle>
          <DialogDescription>
            {casa.total} {casa.total === 1 ? 'ingreso registrado' : 'ingresos registrados'} para esta casa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{casa.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{casa.activos}</div>
              <div className="text-xs text-muted-foreground">Activos</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{casa.completados}</div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{casa.conVehiculo}</div>
              <div className="text-xs text-muted-foreground">Con Vehículo</div>
            </div>
          </div>

          {/* Pestañas de filtrado */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="todos">Todos ({casa.ingresos.length})</TabsTrigger>
              <TabsTrigger value="activos">Activos ({casa.activos})</TabsTrigger>
              <TabsTrigger value="completados">Completados ({casa.completados})</TabsTrigger>
              <TabsTrigger value="usuarios">
                <Users className="h-4 w-4 mr-1" />
                Usuarios ({usuariosCasa.length})
              </TabsTrigger>
            </TabsList>

            {/* Pestaña: Todos */}
            <TabsContent value="todos" className="mt-4">
              {ingresosFiltradosTodos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No hay ingresos para mostrar
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingresosFiltradosTodos.map((ingreso) => (
                        <TableRow key={ingreso.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {capitalizeName(ingreso.visitData?.name || 'Sin nombre')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDateToRelative(ingreso.timestamp)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateToFull(ingreso.timestamp)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ingreso.status === 'active' ? (
                              <Badge variant="default" className="bg-green-500">Activo</Badge>
                            ) : ingreso.status === 'completed' ? (
                              <Badge variant="default" className="bg-blue-500">Completado</Badge>
                            ) : (
                              <Badge variant="secondary">{ingreso.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Car className="h-3 w-3" />
                                Vehicular
                              </Badge>
                            ) : (
                              <Badge variant="outline">Peatonal</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <div className="text-sm">
                                <div className="font-medium">{ingreso.vehicleInfo.placa?.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {capitalizeName(ingreso.vehicleInfo.marca || '')} {capitalizeName(ingreso.vehicleInfo.modelo || '')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onVerDetalles(ingreso);
                                onClose();
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Pestaña: Activos */}
            <TabsContent value="activos" className="mt-4">
              {ingresosFiltradosActivos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No hay ingresos activos para mostrar
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingresosFiltradosTodos.map((ingreso) => (
                        <TableRow key={ingreso.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {capitalizeName(ingreso.visitData?.name || 'Sin nombre')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDateToRelative(ingreso.timestamp)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateToFull(ingreso.timestamp)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ingreso.status === 'active' ? (
                              <Badge variant="default" className="bg-green-500">Activo</Badge>
                            ) : ingreso.status === 'completed' ? (
                              <Badge variant="default" className="bg-blue-500">Completado</Badge>
                            ) : (
                              <Badge variant="secondary">{ingreso.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Car className="h-3 w-3" />
                                Vehicular
                              </Badge>
                            ) : (
                              <Badge variant="outline">Peatonal</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <div className="text-sm">
                                <div className="font-medium">{ingreso.vehicleInfo.placa?.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {capitalizeName(ingreso.vehicleInfo.marca || '')} {capitalizeName(ingreso.vehicleInfo.modelo || '')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onVerDetalles(ingreso);
                                onClose();
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Pestaña: Completados */}
            <TabsContent value="completados" className="mt-4">
              {ingresosFiltradosCompletados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No hay ingresos completados para mostrar
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingresosFiltradosCompletados.map((ingreso) => (
                        <TableRow key={ingreso.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {capitalizeName(ingreso.visitData?.name || 'Sin nombre')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDateToRelative(ingreso.timestamp)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateToFull(ingreso.timestamp)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ingreso.status === 'active' ? (
                              <Badge variant="default" className="bg-green-500">Activo</Badge>
                            ) : ingreso.status === 'completed' ? (
                              <Badge variant="default" className="bg-blue-500">Completado</Badge>
                            ) : (
                              <Badge variant="secondary">{ingreso.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Car className="h-3 w-3" />
                                Vehicular
                              </Badge>
                            ) : (
                              <Badge variant="outline">Peatonal</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ingreso.vehicleInfo ? (
                              <div className="text-sm">
                                <div className="font-medium">{ingreso.vehicleInfo.placa?.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {capitalizeName(ingreso.vehicleInfo.marca || '')} {capitalizeName(ingreso.vehicleInfo.modelo || '')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onVerDetalles(ingreso);
                                onClose();
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Pestaña de Usuarios */}
            <TabsContent value="usuarios" className="mt-4">
              {loadingUsuarios ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : usuariosCasa.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No hay usuarios registrados en esta casa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(ingresosPorUsuario.values())
                    .filter(item => item.usuario !== null) // Solo mostrar usuarios encontrados
                    .sort((a, b) => {
                      // Ordenar por cantidad de ingresos (más ingresos primero)
                      if (b.ingresos.length !== a.ingresos.length) {
                        return b.ingresos.length - a.ingresos.length;
                      }
                      // Si tienen la misma cantidad, ordenar por nombre
                      const nombreA = `${a.usuario?.fullName || ''} ${a.usuario?.paternalLastName || ''}`.trim();
                      const nombreB = `${b.usuario?.fullName || ''} ${b.usuario?.paternalLastName || ''}`.trim();
                      return nombreA.localeCompare(nombreB);
                    })
                    .map((item) => {
                    const usuario = item.usuario!;
                    const ingresosUsuario = item.ingresos;
                    const isExpanded = usuariosExpandidos.has(usuario.uid || usuario.id || '');
                    
                    return (
                      <Card key={usuario.uid || usuario.id}>
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={(open) => {
                            const uid = usuario.uid || usuario.id || '';
                            if (open) {
                              setUsuariosExpandidos(prev => new Set(prev).add(uid));
                            } else {
                              setUsuariosExpandidos(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(uid);
                                return newSet;
                              });
                            }
                          }}
                        >
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <CardTitle className="text-base">
                                      {capitalizeName(usuario.fullName || '')}
                                      {usuario.paternalLastName && ` ${capitalizeName(usuario.paternalLastName)}`}
                                      {usuario.maternalLastName && ` ${capitalizeName(usuario.maternalLastName)}`}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">{usuario.email}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium">{ingresosUsuario.length}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {ingresosUsuario.length === 1 ? 'ingreso' : 'ingresos'}
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              {ingresosUsuario.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  Este usuario no ha generado ingresos aún
                                </p>
                              ) : (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Visitante</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Acciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {ingresosUsuario.map((ingreso) => (
                                        <TableRow key={ingreso.id}>
                                          <TableCell>
                                            <span className="font-medium">
                                              {capitalizeName(ingreso.visitData?.name || 'Sin nombre')}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm">
                                              <div>{formatDateToRelative(ingreso.timestamp)}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {formatDateToFull(ingreso.timestamp)}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {ingreso.status === 'active' ? (
                                              <Badge variant="default" className="bg-green-500">Activo</Badge>
                                            ) : ingreso.status === 'completed' ? (
                                              <Badge variant="default" className="bg-blue-500">Completado</Badge>
                                            ) : (
                                              <Badge variant="secondary">{ingreso.status}</Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {ingreso.vehicleInfo ? (
                                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                <Car className="h-3 w-3" />
                                                Vehicular
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline">Peatonal</Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                onVerDetalles(ingreso);
                                                onClose();
                                              }}
                                            >
                                              <Eye className="h-4 w-4 mr-1" />
                                              Ver
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IngresosPorCasaDialog;
