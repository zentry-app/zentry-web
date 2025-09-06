"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getTags, 
  getResidenciales, 
  getUsuariosPorResidencial,
  crearTag, 
  actualizarTag, 
  cambiarEstadoTag,
  Tag,
  Residencial as FirestoreResidencial,
  Usuario
} from "@/lib/firebase/firestore";
import { updateTagStatus, getTags as getTagsSync } from "@/lib/firebase/tags-sync";
import { AddTagModal } from "@/components/tags/AddTagModal";
import { EditTagModal } from "@/components/tags/EditTagModal";
import { TagsTable } from "@/components/tags/TagsTable";
import { 
  Plus, 
  Car
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VehicularTag {
  id: string;
  cardNumberDec: string;
  residencialId: string;
  casaId: string;
  panels: string[];
  status: 'active' | 'disabled';
  plate?: string;
  notes?: string;
  validFrom?: string;
  validTo?: string;
  lastChangedBy: string;
  lastChangedAt: string;
  source: string;
}

interface Residencial {
  id: string;
  nombre: string;
}

interface Casa {
  id: string;
  nombre: string;
  residencialId: string;
  calle?: string;
  houseNumber?: string;
  houseID?: string;
  searchText?: string;
}

interface Panel {
  id: string;
  nombre: string;
  tipo: 'vehicular' | 'peatonal';
  residencialId: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<VehicularTag[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [paneles, setPaneles] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTag, setCurrentTag] = useState<VehicularTag | null>(null);
  const [currentUserId] = useState("current-user-id"); // TODO: Obtener del contexto de auth
  const [residencialSeleccionado, setResidencialSeleccionado] = useState<string>("todos");

  // Obtener contexto de autenticación
  const { user, userClaims, loading: authLoading } = useAuth();

  // Determinar si el admin es solo de residencial o global
  const esAdminDeResidencial = useMemo(() =>
    !!userClaims && userClaims.role === 'admin' && !userClaims.isGlobalAdmin,
    [userClaims]
  );
  
  const residencialIdDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial) return null;
    return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
  }, [esAdminDeResidencial, userClaims]);

  // Función helper para obtener casas reales de la colección casas
  const obtenerCasasReales = async (residencialDocId: string): Promise<Casa[]> => {
    try {
      const { collection, getDocs, doc, getDoc, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      console.log(`🏠 [TAGS] Obteniendo casas reales para residencial: ${residencialDocId}`);
      
      // PRIMERO: Verificar que el residencial existe y obtener su residencialID
      const residencialRef = doc(db, 'residenciales', residencialDocId);
      const residencialDoc = await getDoc(residencialRef);
      console.log(`🏠 [TAGS] Residencial existe:`, residencialDoc.exists());
      
      let residencialID = null;
      if (residencialDoc.exists()) {
        const residencialData = residencialDoc.data();
        residencialID = residencialData?.residencialID;
        console.log(`🏠 [TAGS] Datos del residencial:`, residencialData);
        console.log(`🏠 [TAGS] ResidencialID encontrado:`, residencialID);
      }
      
      // SEGUNDO: Buscar casas en múltiples ubicaciones
      let casas: Casa[] = [];
      
      // 1. Buscar en residenciales/{docId}/casas (estructura esperada)
      try {
      const casasRef = collection(db, 'residenciales', residencialDocId, 'casas');
      console.log(`🏠 [TAGS] Consultando colección: residenciales/${residencialDocId}/casas`);
      
      const casasSnapshot = await getDocs(casasRef);
        console.log(`🏠 [TAGS] Documentos encontrados en subcolección: ${casasSnapshot.docs.length}`);
      
        if (casasSnapshot.docs.length > 0) {
          casas = casasSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`🏠 [TAGS] Procesando casa ${doc.id}:`, data);
        return {
          id: doc.id,
          nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
          residencialId: residencialDocId,
          ...data
        };
      });
        }
      } catch (error) {
        console.log(`🏠 [TAGS] Error en subcolección casas:`, error);
      }
      
      // 2. Si no hay casas y tenemos residencialID, buscar en colección principal de casas
      if (casas.length === 0 && residencialID) {
        try {
          console.log(`🏠 [TAGS] Buscando en colección principal 'casas' con residencialID: ${residencialID}`);
          const casasMainRef = collection(db, 'casas');
          const q = query(casasMainRef, where('residencialID', '==', residencialID));
          const casasMainSnapshot = await getDocs(q);
          console.log(`🏠 [TAGS] Documentos en colección 'casas' con residencialID ${residencialID}: ${casasMainSnapshot.docs.length}`);
          
          if (casasMainSnapshot.docs.length > 0) {
            casas = casasMainSnapshot.docs.map(doc => {
              const data = doc.data();
              console.log(`🏠 [TAGS] Procesando casa principal ${doc.id}:`, data);
              return {
                id: doc.id,
                nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
                residencialId: residencialDocId,
                ...data
              };
            });
          }
        } catch (error) {
          console.log(`🏠 [TAGS] Error en colección principal casas:`, error);
        }
      }
      
      // 3. Si aún no hay casas, buscar en usuarios que pertenezcan a este residencial
      if (casas.length === 0 && residencialID) {
        try {
          console.log(`🏠 [TAGS] Buscando casas únicas en usuarios con residencialID: ${residencialID}`);
          const usuariosRef = collection(db, 'usuarios');
          const q = query(usuariosRef, where('residencialID', '==', residencialID));
          const usuariosSnapshot = await getDocs(q);
          console.log(`🏠 [TAGS] Usuarios encontrados: ${usuariosSnapshot.docs.length}`);
          
          // Usar la misma lógica que la página de usuarios para obtener TODAS las casas únicas
          const sanitize = (s?: string) => (s || '')
            .toString()
            .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, '');
          const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
          const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;
          
          // Índices para detectar duplicados y unificar casas
          const hidIndex = new Map<string, string>();
          const addrIndex = new Map<string, string>();
          const casasUnicas = new Map<string, Casa>();
          
          // Solo residentes con referencia de casa (igual que en usuarios)
          const soloResidentes = usuariosSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((u: any) => {
              const tieneCasa = u.houseID || u.houseId || u.houseNumber || u.calle;
              return u.role === 'resident' && !!tieneCasa;
            });
          
          console.log(`🏠 [TAGS] Residentes con casa encontrados: ${soloResidentes.length}`);
          
          for (const usuario of soloResidentes) {
            const rawHid = ((usuario as any).houseID || (usuario as any).houseId || '').toString();
            const hidSanitized = sanitize(rawHid);
            const hidNorm = normalize(hidSanitized);
            const aKey = addrKey((usuario as any).calle, (usuario as any).houseNumber);
            
            // Elegir key preferente (igual que en usuarios)
            let chosenKey = hidNorm || aKey;
            
            // Verificar consistencia con índices existentes
            if (hidNorm) {
              const hidExisting = hidIndex.get(hidNorm);
              if (hidExisting && hidExisting !== chosenKey) {
                chosenKey = hidExisting;
              } else if (!hidExisting) {
                hidIndex.set(hidNorm, chosenKey);
              }
            }
            if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);
            
            // Solo agregar si no existe ya
            if (!casasUnicas.has(chosenKey)) {
              const calle = (usuario as any).calle || '';
              const houseNumber = (usuario as any).houseNumber || '';
              const houseID = hidSanitized || '';
              
              // Crear nombre descriptivo
              const nombreDescriptivo = calle && houseNumber 
                ? `${calle} ${houseNumber}` 
                : houseID || `${calle} ${houseNumber}`.trim();
              
              casasUnicas.set(chosenKey, {
                id: chosenKey,
                nombre: nombreDescriptivo,
                residencialId: residencialDocId,
                calle: calle,
                houseNumber: houseNumber,
                houseID: houseID,
                searchText: `${calle} ${houseNumber} ${houseID}`.toLowerCase().trim()
              });
            }
          }
          
          if (casasUnicas.size > 0) {
            casas = Array.from(casasUnicas.values());
            console.log(`🏠 [TAGS] Casas únicas extraídas de residentes: ${casas.length}`);
            console.log(`🏠 [TAGS] Primeras 3 casas:`, casas.slice(0, 3).map(c => ({ 
              id: c.id, 
              nombre: c.nombre, 
              calle: c.calle, 
              houseNumber: c.houseNumber 
            })));
          }
        } catch (error) {
          console.log(`🏠 [TAGS] Error extrayendo casas de usuarios:`, error);
        }
      }
      
      // 4. Último fallback: buscar todas las casas sin filtro
      if (casas.length === 0) {
        try {
          console.log(`🏠 [TAGS] Último fallback: buscando todas las casas`);
          const casasMainRef = collection(db, 'casas');
          const casasMainSnapshot = await getDocs(casasMainRef);
          console.log(`🏠 [TAGS] Total de casas en colección principal: ${casasMainSnapshot.docs.length}`);
          
          if (casasMainSnapshot.docs.length > 0) {
            console.log(`🏠 [TAGS] Primeras 5 casas encontradas:`, 
              casasMainSnapshot.docs.slice(0, 5).map(doc => ({ 
                id: doc.id, 
                data: doc.data(),
                residencialID: doc.data().residencialID 
              }))
            );
            
            // Filtrar por residencialID si está disponible
            casas = casasMainSnapshot.docs
              .filter(doc => !residencialID || doc.data().residencialID === residencialID)
              .map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
                  residencialId: residencialDocId,
                  ...data
                };
              });
          }
        } catch (error) {
          console.log(`🏠 [TAGS] Error en último fallback:`, error);
        }
      }
      
      console.log(`🏠 [TAGS] Casas finales encontradas: ${casas.length}`, casas);
      return casas;
    } catch (error) {
      console.error('🏠 [TAGS] Error obteniendo casas reales:', error);
      return [];
    }
  };

  // Función helper para obtener residencialDocId desde residencialID
  const obtenerResidencialDocId = async (residencialID: string): Promise<string | null> => {
    try {
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('residencialID', '==', residencialID), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      
      console.log(`🏠 [TAGS] No se encontró residencialDocId para residencialID: ${residencialID}`);
      return null;
    } catch (error) {
      console.error('🏠 [TAGS] Error obteniendo residencialDocId:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Solo cargar datos si el usuario está autenticado
        if (authLoading || !userClaims) {
          console.log('🏠 [TAGS] Esperando autenticación...');
          return;
        }
        
        console.log('🏠 [TAGS] Usuario autenticado:', { 
          role: userClaims.role, 
          isGlobalAdmin: userClaims.isGlobalAdmin,
          residencialIdDelAdmin 
        });
        
        // Obtener datos básicos
        const residencialesData = await getResidenciales();
        // Filtrar residenciales que tengan ID válido y convertir al tipo local
        const residencialesValidados: Residencial[] = residencialesData
          .filter((r: FirestoreResidencial) => r.id !== undefined)
          .map((r: FirestoreResidencial) => ({
            id: r.id!,
            nombre: r.nombre
          }));
        
        // Filtrar residenciales según el rol del usuario
        let residencialesAProcesar = residencialesValidados;
        
        if (esAdminDeResidencial && residencialIdDelAdmin) {
          // Admin de residencial: usar directamente el residencialDocId conocido
          if (residencialIdDelAdmin === 'S9G7TL') {
            // Para S9G7TL, crear un objeto residencial temporal con el residencialDocId conocido
            residencialesAProcesar = [{
              id: 'mCTs294LGLkGvL9TTvaQ', // residencialDocId conocido
              nombre: 'Residencial S9G7TL'
            }];
          } else {
            // Para otros residenciales, buscar en la lista
            residencialesAProcesar = residencialesValidados.filter(r => (r as any).residencialID === residencialIdDelAdmin);
          }
          console.log(`🏠 [TAGS] Admin de residencial - procesando solo: ${residencialIdDelAdmin}`);
        } else if (userClaims?.isGlobalAdmin) {
          // Admin global: usar todos los residenciales disponibles
          console.log('🏠 [TAGS] Admin global - procesando todos los residenciales');
          console.log(`🏠 [TAGS] Residenciales disponibles para admin global: ${residencialesValidados.length}`);
        } else {
          console.log('🏠 [TAGS] Usuario sin permisos de admin - no procesando residenciales');
          residencialesAProcesar = [];
        }
        
        setResidenciales(residencialesAProcesar);
        
        // Obtener casas reales de la colección casas
        const casasData: Casa[] = [];
        console.log('🏠 [TAGS] Iniciando carga de casas reales...');
        console.log('🏠 [TAGS] Residenciales a procesar:', residencialesAProcesar.length);
        
        for (const residencial of residencialesAProcesar) {
          try {
            console.log(`🏠 [TAGS] Procesando residencial: ${residencial.nombre} (${residencial.id})`);
            
            // El residencial.id ya es el residencialDocId, no necesitamos convertirlo
            const residencialDocId = residencial.id;
            console.log(`🏠 [TAGS] Usando residencialDocId: ${residencialDocId}`);
            
            // Obtener casas reales de la colección casas
            const casasDelResidencial = await obtenerCasasReales(residencialDocId);
            casasData.push(...casasDelResidencial);
          } catch (error) {
            console.error(`🏠 [TAGS] Error obteniendo casas del residencial ${residencial.id}:`, error);
          }
        }
        
        console.log('🏠 [TAGS] Total de casas cargadas:', casasData.length);
        console.log('🏠 [TAGS] Casas finales:', casasData);
        
        // Plumas de acceso para residentes - entrada y salida automáticas
        const panelesData: Panel[] = residencialesValidados.map(residencial => [
          { id: `${residencial.id}-entrada-residente`, nombre: `🚗 Entrada Residente`, tipo: 'vehicular' as const, residencialId: residencial.id },
          { id: `${residencial.id}-salida-residente`, nombre: `🚗 Salida Residente`, tipo: 'vehicular' as const, residencialId: residencial.id },
        ]).flat();
        
        console.log('🏠 [TAGS] Plumas generadas:', panelesData);
        
        const tagsData: VehicularTag[] = [];
        
        setTags(tagsData);
        setCasas(casasData);
        setPaneles(panelesData);
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, userClaims, esAdminDeResidencial, residencialIdDelAdmin]);

  const handleAddTag = (newTag: VehicularTag) => {
    setTags(prev => [...prev, newTag]);
    setShowAddModal(false);
  };

  const handleEditTag = (updatedTag: VehicularTag) => {
    setTags(prev => prev.map(tag => 
      tag.id === updatedTag.id ? updatedTag : tag
    ));
    setShowEditModal(false);
    setCurrentTag(null);
  };

  const handleStatusChange = async (tagId: string, newStatus: string) => {
    try {
      await updateTagStatus(tagId, newStatus, currentUserId);
      
      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, status: newStatus as 'active' | 'disabled' } : tag
      ));
      
    } catch (error) {
      console.error("Error al cambiar estado del tag:", error);
      throw error;
    }
  };

  const handleOpenEditModal = (tag: VehicularTag) => {
    setCurrentTag(tag);
    setShowEditModal(true);
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-8 w-8 text-blue-500" />
          Tags Vehiculares
        </h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Añadir Tag
        </Button>
      </div>

      {/* Selector de residencial - Solo para admin global */}
      {!authLoading && userClaims && userClaims.isGlobalAdmin && (
        <div className="flex flex-col w-[250px]">
          <Select
            value={residencialSeleccionado}
            onValueChange={(value) => {
                setResidencialSeleccionado(value);
                // TODO: Recargar datos para el nuevo residencial
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar residencial" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="todos">Todos los residenciales</SelectItem>
              {residenciales
                .filter(residencial => !!residencial.id)
                .map((residencial) => (
                  <SelectItem key={residencial.id} value={residencial.id!.toString()}>
                    {residencial.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Tags Vehiculares</CardTitle>
          <CardDescription>
            Administra los tags de acceso vehicular para los residenciales. 
            Los tags se aplican automáticamente en las plumas de acceso de residentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagsTable
            tags={tags}
            residenciales={residenciales}
            casas={casas}
            paneles={paneles}
            loading={loading}
            onEditTag={handleOpenEditModal}
            onStatusChange={handleStatusChange}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>

      {/* Modal para añadir tag */}
      <AddTagModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onTagCreated={handleAddTag}
        residenciales={residenciales}
        casas={casas}
        paneles={paneles}
        currentUserId={currentUserId}
        esAdminDeResidencial={esAdminDeResidencial}
        residencialIdDelAdmin={residencialIdDelAdmin}
      />

      {/* Modal para editar tag */}
      <EditTagModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onTagUpdated={handleEditTag}
        tag={currentTag}
        casas={casas}
        paneles={paneles}
        currentUserId={currentUserId}
      />
    </div>
  );
} 