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
import { updateTagStatus, getTagsSync } from "@/lib/firebase/tags-sync";
import {
  sendTagCommand,
  watchZentryLinkStatus,
  isZentryLinkOnline,
  ZentryLinkStatus,
} from '@/lib/firebase/zentrylink';
import { ZentryLinkStatusBar } from '@/components/zentrylink/StatusBar';
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
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
  const [zentryLinkStatus, setZentryLinkStatus] = useState<ZentryLinkStatus | null>(null);
  const [processingTagId, setProcessingTagId] = useState<string | null>(null);

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

      // PRIMERO: Verificar que el residencial existe y obtener su residencialID
      const residencialRef = doc(db, 'residenciales', residencialDocId);
      const residencialDoc = await getDoc(residencialRef);

      let residencialID = null;
      if (residencialDoc.exists()) {
        const residencialData = residencialDoc.data();
        residencialID = residencialData?.residencialID;
      }

      // SEGUNDO: Buscar casas en múltiples ubicaciones
      let casas: Casa[] = [];

      // 1. Buscar en residenciales/{docId}/casas (estructura esperada)
      try {
        const casasRef = collection(db, 'residenciales', residencialDocId, 'casas');

        const casasSnapshot = await getDocs(casasRef);

        if (casasSnapshot.docs.length > 0) {
          casas = casasSnapshot.docs.map(doc => {
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
        console.error(`Error en subcolección casas:`, error);
      }

      // 2. Si no hay casas y tenemos residencialID, buscar en colección principal de casas
      if (casas.length === 0 && residencialID) {
        try {
          const casasMainRef = collection(db, 'casas');
          const q = query(casasMainRef, where('residencialID', '==', residencialID));
          const casasMainSnapshot = await getDocs(q);

          if (casasMainSnapshot.docs.length > 0) {
            casas = casasMainSnapshot.docs.map(doc => {
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
          console.error(`Error en colección principal casas:`, error);
        }
      }

      // 3. Si aún no hay casas, buscar en usuarios que pertenezcan a este residencial
      if (casas.length === 0 && residencialID) {
        try {
          const usuariosRef = collection(db, 'usuarios');
          const q = query(usuariosRef, where('residencialID', '==', residencialID));
          const usuariosSnapshot = await getDocs(q);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Solo cargar datos si el usuario está autenticado
        if (authLoading || !userClaims) {
          return;
        }

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
          if (residencialIdDelAdmin === 'S9G7TL') {
            residencialesAProcesar = [{
              id: 'mCTs294LGLkGvL9TTvaQ',
              nombre: 'Residencial S9G7TL'
            }];
          } else {
            residencialesAProcesar = residencialesValidados.filter(r => (r as any).residencialID === residencialIdDelAdmin);
          }
        } else if (!userClaims?.isGlobalAdmin) {
          residencialesAProcesar = [];
        }

        setResidenciales(residencialesAProcesar);

        // Obtener casas reales de la colección casas
        const casasData: Casa[] = [];

        for (const residencial of residencialesAProcesar) {
          try {
            const residencialDocId = residencial.id;
            const casasDelResidencial = await obtenerCasasReales(residencialDocId);
            casasData.push(...casasDelResidencial);
          } catch (error) {
            console.error(`🏠 [TAGS] Error obteniendo casas del residencial ${residencial.id}:`, error);
          }
        }

        // Plumas de acceso para residentes - entrada y salida automáticas
        const panelesData: Panel[] = residencialesValidados.map(residencial => [
          { id: `${residencial.id}-entrada-residente`, nombre: `🚗 Entrada Residente`, tipo: 'vehicular' as const, residencialId: residencial.id },
          { id: `${residencial.id}-salida-residente`, nombre: `🚗 Salida Residente`, tipo: 'vehicular' as const, residencialId: residencial.id },
        ]).flat();

        // Cargar tags reales de Firestore
        const tagsData: VehicularTag[] = [];

        for (const residencial of residencialesAProcesar) {
          try {
            const tagsDelResidencial = await getTagsSync(residencial.id);

            const vehicularTags = tagsDelResidencial.map(tag => ({
              id: tag.id || '',
              cardNumberDec: tag.cardNumberDec,
              residencialId: residencial.id,
              casaId: tag.ownerRef || tag.residentId || '',
              panels: tag.panels || [],
              status: tag.status as 'active' | 'disabled',
              plate: tag.plate || '',
              notes: tag.notes || '',
              validFrom: tag.validFrom || '',
              validTo: tag.validTo || '',
              lastChangedBy: tag.lastChangedBy || 'unknown',
              lastChangedAt: tag.lastChangedAt || tag.createdAt || new Date().toISOString(),
              source: tag.source || 'firestore'
            }));

            tagsData.push(...vehicularTags);
          } catch (error) {
            console.error(`🏠 [TAGS] Error cargando tags del residencial ${residencial.id}:`, error);
          }
        }

        // Ordenar tags por cardNumberDec en orden ascendente
        tagsData.sort((a, b) => {
          const cardA = parseInt(a.cardNumberDec) || 0;
          const cardB = parseInt(b.cardNumberDec) || 0;
          return cardA - cardB;
        });

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

  useEffect(() => {
    // Only subscribe for residencial admins
    if (!esAdminDeResidencial) return;
    // For v1: use known docId for S9G7TL
    const docId = residencialIdDelAdmin === 'S9G7TL'
      ? 'mCTs294LGLkGvL9TTvaQ'
      : null;
    if (!docId) return;
    return watchZentryLinkStatus(docId, setZentryLinkStatus);
  }, [esAdminDeResidencial, residencialIdDelAdmin]);

  const handleAddTag = async (newTag: VehicularTag) => {
    try {
      // Recargar la lista completa de tags para asegurar que esté actualizada
      await loadTags();
      setShowAddModal(false);
      toast.success('Tag creado exitosamente');
    } catch (error) {
      console.error('Error recargando tags después de crear:', error);
      // Fallback: agregar el tag localmente
      setTags(prev => [...prev, newTag]);
      setShowAddModal(false);
    }
  };

  const handleEditTag = async (updatedTag: VehicularTag) => {
    try {
      // Recargar la lista completa de tags para asegurar que esté actualizada
      await loadTags();
      setShowEditModal(false);
      setCurrentTag(null);
      toast.success('Tag actualizado exitosamente');
    } catch (error) {
      console.error('Error recargando tags después de editar:', error);
      // Fallback: actualizar el tag localmente
      setTags(prev => prev.map(tag =>
        tag.id === updatedTag.id ? updatedTag : tag
      ));
      setShowEditModal(false);
      setCurrentTag(null);
    }
  };

  const handleStatusChange = async (tagId: string, newStatus: string) => {
    const online = isZentryLinkOnline(zentryLinkStatus);
    if (!online) {
      toast.error('ZentryLink sin conexión — no es posible cambiar el estado del tag');
      return;
    }

    const op = newStatus === 'active' ? 'activate' : 'deactivate';
    const userId = user?.uid || 'unknown';

    // Find the tag to get its residencialId
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    const residencialDocId = tag.residencialId;

    setProcessingTagId(tagId);
    try {
      await sendTagCommand(residencialDocId, op, tagId, userId);

      // Optimistic local update — ZentryLink already wrote the real status to Firestore
      setTags(prev =>
        prev.map(t =>
          t.id === tagId
            ? { ...t, status: newStatus as 'active' | 'disabled' }
            : t
        )
      );

      toast.success(op === 'activate' ? 'Tag activado ✓' : 'Tag desactivado ✓');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el comando');
    } finally {
      setProcessingTagId(null);
    }
  };

  // Función para recargar tags
  const loadTags = async () => {
    try {
      // Solo cargar si el usuario está autenticado
      if (authLoading || !userClaims) {
        return;
      }

      // Determinar residenciales a procesar
      let residencialesAProcesar = residenciales;

      if (esAdminDeResidencial && residencialIdDelAdmin) {
        if (residencialIdDelAdmin === 'S9G7TL') {
          residencialesAProcesar = [{
            id: 'mCTs294LGLkGvL9TTvaQ',
            nombre: 'Residencial S9G7TL'
          }];
        } else {
          residencialesAProcesar = residenciales.filter(r => (r as any).residencialID === residencialIdDelAdmin);
        }
      }

      // Cargar tags de todos los residenciales
      const tagsData: VehicularTag[] = [];

      for (const residencial of residencialesAProcesar) {
        try {
          const tagsDelResidencial = await getTagsSync(residencial.id);

          const vehicularTags = tagsDelResidencial.map(tag => ({
            id: tag.id || '',
            cardNumberDec: tag.cardNumberDec,
            residencialId: residencial.id,
            casaId: tag.ownerRef || tag.residentId || '',
            panels: tag.panels || [],
            status: tag.status as 'active' | 'disabled',
            plate: tag.plate || '',
            notes: tag.notes || '',
            validFrom: tag.validFrom || '',
            validTo: tag.validTo || '',
            lastChangedBy: tag.lastChangedBy || 'unknown',
            lastChangedAt: tag.lastChangedAt || tag.createdAt || new Date().toISOString(),
            source: tag.source || 'firestore'
          }));

          tagsData.push(...vehicularTags);
        } catch (error) {
          console.error(`🔄 [TAGS] Error recargando tags del residencial ${residencial.id}:`, error);
        }
      }

      setTags(tagsData);

    } catch (error) {
      console.error('🔄 [TAGS] Error recargando tags:', error);
      toast.error('Error recargando la lista de tags');
    }
  };

  const handleTagDeleted = async (tagId: string) => {
    try {
      await loadTags();
    } catch (error) {
      console.error('❌ [TAGS] Error recargando tags después de eliminación:', error);
      toast.error('Error recargando la lista de tags');
    }
  };

  const handleOpenEditModal = (tag: VehicularTag) => {
    setCurrentTag(tag);
    setShowEditModal(true);
  };



  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-2">
          <Badge className="bg-blue-100 text-blue-700 border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Control de Acceso
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900 flex items-center gap-3">
            <Car className="h-12 w-12 text-blue-500" />
            <span className="text-gradient-zentry">Tags Vehiculares</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Administra los tags de acceso vehicular para los residenciales
          </p>
        </div>

        {/* Botón de añadir tag */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-blue-600 text-white hover:bg-blue-700 hover-lift transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Añadir Tag
          </Button>
        </motion.div>
      </motion.div>

      {/* Card principal con diseño premium */}
      <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-white/10">
          <CardTitle className="text-2xl font-black text-slate-900">Gestión de Tags Vehiculares</CardTitle>
          <CardDescription className="text-base text-slate-600 font-medium">
            Los tags se aplican automáticamente en las plumas de acceso de residentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {/* ZentryLink status bar */}
          {esAdminDeResidencial && residencialIdDelAdmin === 'S9G7TL' && (
            <div className="mb-4">
              <ZentryLinkStatusBar
                residencialDocId="mCTs294LGLkGvL9TTvaQ"
                onRefresh={loadTags}
              />
            </div>
          )}
          <TagsTable
            tags={tags}
            residenciales={residenciales}
            casas={casas}
            loading={loading}
            onEditTag={handleOpenEditModal}
            onStatusChange={handleStatusChange}
            onTagDeleted={handleTagDeleted}
            currentUserId={user?.uid || ''}
            processingTagId={processingTagId}
            zentryLinkOnline={isZentryLinkOnline(zentryLinkStatus)}
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
        currentUserId={user?.uid || ''}
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
        currentUserId={user?.uid || ''}
      />
    </div>
  );
} 