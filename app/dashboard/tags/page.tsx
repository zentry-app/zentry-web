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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos básicos
        const residencialesData = await getResidenciales();
        // Filtrar residenciales que tengan ID válido y convertir al tipo local
        const residencialesValidados: Residencial[] = residencialesData
          .filter((r: FirestoreResidencial) => r.id !== undefined)
          .map((r: FirestoreResidencial) => ({
            id: r.id!,
            nombre: r.nombre
          }));
        setResidenciales(residencialesValidados);
        
        // TODO: Implementar llamadas reales a las APIs de tags vehiculares
        // const tagsData = await getVehicularTags();
        // const panelesData = await getPaneles();
        
        // Obtener casas reales de los usuarios (misma lógica exacta que casasResumen en usuarios page)
        const casasData: Casa[] = [];
        console.log('🏠 [TAGS] Iniciando carga de casas...');
        console.log('🏠 [TAGS] Residenciales válidos:', residencialesValidados.length);
        
        for (const residencial of residencialesValidados) {
          try {
            console.log(`🏠 [TAGS] Procesando residencial: ${residencial.nombre} (${residencial.id})`);
            
            const usuariosResidencial = await getUsuariosPorResidencial(residencial.id, { getAll: true });
            console.log(`🏠 [TAGS] Usuarios obtenidos para ${residencial.nombre}:`, usuariosResidencial.length);
            console.log(`🏠 [TAGS] Usuarios raw para ${residencial.nombre}:`, usuariosResidencial);
            
            // Debug: Intentar obtener usuarios de forma alternativa
            try {
              const { getUsuarios } = await import('@/lib/firebase/firestore');
              const todosUsuarios = await getUsuarios({ getAll: true });
              console.log(`🏠 [TAGS] Total usuarios en BD:`, todosUsuarios.length);
              
              // Debug: Mostrar algunos usuarios de ejemplo para ver su estructura
              console.log(`🏠 [TAGS] Primeros 3 usuarios de ejemplo:`, todosUsuarios.slice(0, 3).map(u => ({
                id: u.id,
                fullName: u.fullName,
                role: u.role,
                residencialID: u.residencialID,
                houseID: u.houseID,
                houseNumber: u.houseNumber,
                calle: u.calle
              })));
              
              // Debug: Mostrar todos los residenciales únicos que tienen los usuarios
              const residencialesUnicos = Array.from(new Set(todosUsuarios.map(u => u.residencialID).filter(Boolean)));
              console.log(`🏠 [TAGS] Residenciales únicos en usuarios:`, residencialesUnicos);
              console.log(`🏠 [TAGS] Residencial actual buscando:`, residencial.id);
              
              // Filtrar usuarios que pertenecen a este residencial
              const usuariosDelResidencial = todosUsuarios.filter((u: any) => 
                u.residencialID === residencial.id
              );
              console.log(`🏠 [TAGS] Usuarios filtrados manualmente para ${residencial.nombre}:`, usuariosDelResidencial.length);
              console.log(`🏠 [TAGS] Usuarios filtrados manualmente:`, usuariosDelResidencial);
              
              // Usar los usuarios filtrados manualmente si getUsuariosPorResidencial no funciona
              if (usuariosResidencial.length === 0 && usuariosDelResidencial.length > 0) {
                console.log(`🏠 [TAGS] Usando usuarios filtrados manualmente para ${residencial.nombre}`);
                usuariosResidencial.push(...usuariosDelResidencial);
              }
            } catch (altError) {
              console.error(`🏠 [TAGS] Error en método alternativo para ${residencial.nombre}:`, altError);
            }
            
            // Usar la misma lógica exacta que casasResumen en usuarios page
            const sanitize = (s?: string) => (s || '')
              .toString()
              .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, '');
            const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
            const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;

            // Índices para detectar duplicados
            const hidIndex = new Map<string, string>();
            const addrIndex = new Map<string, string>();
            const casasMap = new Map<string, Casa>();

            // Solo residentes con referencia de casa
            const soloResidentes = usuariosResidencial.filter((u: any) => {
              const tieneCasa = u.houseID || u.houseNumber || u.calle;
              const esResidente = u.role === 'resident';
              console.log(`🏠 [TAGS] Usuario ${u.fullName}: role=${u.role}, tieneCasa=${!!tieneCasa}, houseID=${u.houseID}, houseNumber=${u.houseNumber}, calle=${u.calle}`);
              return esResidente && !!tieneCasa;
            });
            
            console.log(`🏠 [TAGS] Residentes con casa en ${residencial.nombre}:`, soloResidentes.length);

            for (const u of soloResidentes) {
              const rawHid = ((u as any).houseID || '').toString();
              const hidSanitized = sanitize(rawHid);
              const hidNorm = normalize(hidSanitized);
              const aKey = addrKey((u as any).calle, (u as any).houseNumber);

              console.log(`🏠 [TAGS] Procesando usuario ${u.fullName}: rawHid=${rawHid}, hidSanitized=${hidSanitized}, hidNorm=${hidNorm}, aKey=${aKey}`);

              // Elegir key preferente (HID si existe, sino dirección)
              let chosenKey = hidNorm || aKey;

              // Si ya existe una key para esta dirección, forzar uso de esa para agrupar
              const addrExisting = addrIndex.get(aKey);
              if (addrExisting && addrExisting !== chosenKey) {
                chosenKey = addrExisting;
              }

              // Registrar índices
              if (hidNorm) {
                const hidExisting = hidIndex.get(hidNorm);
                if (hidExisting && hidExisting !== chosenKey) {
                  chosenKey = hidExisting;
                } else if (!hidExisting) {
                  hidIndex.set(hidNorm, chosenKey);
                }
              }
              if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);

              if (!casasMap.has(chosenKey)) {
                // Crear nombre descriptivo para la casa
                let nombreCasa = '';
                if (hidSanitized) {
                  nombreCasa = `Casa ${hidSanitized}`;
                } else if ((u as any).calle && (u as any).houseNumber) {
                  nombreCasa = `${(u as any).calle} ${(u as any).houseNumber}`;
                } else if ((u as any).calle) {
                  nombreCasa = (u as any).calle;
                } else if ((u as any).houseNumber) {
                  nombreCasa = `Casa ${(u as any).houseNumber}`;
                } else {
                  nombreCasa = 'Casa sin identificar';
                }

                console.log(`🏠 [TAGS] Creando casa: ${nombreCasa} (key: ${chosenKey})`);

                casasMap.set(chosenKey, {
                  id: chosenKey,
                  nombre: nombreCasa,
                  residencialId: residencial.id
                });
              }
            }
            
            const casasDelResidencial = Array.from(casasMap.values());
            console.log(`🏠 [TAGS] Casas encontradas en ${residencial.nombre}:`, casasDelResidencial.length, casasDelResidencial);
            casasData.push(...casasDelResidencial);
          } catch (error) {
            console.error(`🏠 [TAGS] Error obteniendo usuarios del residencial ${residencial.id}:`, error);
          }
        }
        
        console.log('🏠 [TAGS] Total de casas cargadas:', casasData.length);
        console.log('🏠 [TAGS] Casas finales:', casasData);
        
        // SOLUCIÓN TEMPORAL: Si no hay casas, crear datos de prueba
        if (casasData.length === 0) {
          console.log('🏠 [TAGS] No se encontraron casas reales, creando datos de prueba...');
          const casasPrueba: Casa[] = [];
          
          for (const residencial of residencialesValidados) {
            // Crear 3-5 casas de prueba por residencial
            for (let i = 1; i <= 4; i++) {
              casasPrueba.push({
                id: `${residencial.id}-casa-${i}`,
                nombre: `Casa ${i}`,
                residencialId: residencial.id
              });
            }
          }
          
          casasData.push(...casasPrueba);
          console.log('🏠 [TAGS] Casas de prueba creadas:', casasPrueba.length);
          console.log('🏠 [TAGS] Casas de prueba:', casasPrueba);
        }
        
        // TODO: Implementar llamada real a paneles
        const panelesData: Panel[] = residencialesValidados.flatMap(residencial => [
          { id: `${residencial.id}-panel-1`, nombre: `Vehicular Norte`, tipo: 'vehicular' as const, residencialId: residencial.id },
          { id: `${residencial.id}-panel-2`, nombre: `Vehicular Sur`, tipo: 'vehicular' as const, residencialId: residencial.id },
          { id: `${residencial.id}-panel-3`, nombre: `Todos los accesos vehiculares`, tipo: 'vehicular' as const, residencialId: residencial.id },
        ]);
        
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
  }, []);

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

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Tags Vehiculares</CardTitle>
          <CardDescription>
            Administra los tags de acceso vehicular para los residenciales. 
            Los cambios se aplican automáticamente en los paneles seleccionados.
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