import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  startAfter,
  QueryDocumentSnapshot,
  deleteField,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, functions, storage } from '../firebase/config';
import {
  SupportTicket,
  SupportConversation,
  KnowledgeBaseItem,
  TicketFilters,
  TicketStats,
  TicketRespuesta,
  KnowledgeBaseStats,
  TicketEstado,
  TicketCategoria,
  TicketPrioridad,
} from '../../types/support';

/**
 * Servicio para operaciones de soporte
 */
export const SupportService = {
  /**
   * Obtener todos los tickets con filtros opcionales
   */
  getTickets: async (
    residencialId?: string,
    filters?: TicketFilters
  ): Promise<SupportTicket[]> => {
    try {
      const tickets: SupportTicket[] = [];

      if (residencialId) {
        // Obtener tickets de un residencial específico
        const residencialQuery = await getDocs(
          query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
        );

        if (residencialQuery.empty) {
          return [];
        }

        const residencialDoc = residencialQuery.docs[0];
        const supportTicketsRef = collection(db, 'residenciales', residencialDoc.id, 'supportTickets');
        let ticketsQuery = query(
          supportTicketsRef,
          orderBy('fechaCreacion', 'desc')
        );

        // Aplicar filtros
        if (filters?.estado && filters.estado.length > 0) {
          ticketsQuery = query(ticketsQuery, where('estado', 'in', filters.estado));
        }
        if (filters?.categoria && filters.categoria.length > 0) {
          ticketsQuery = query(ticketsQuery, where('categoria', 'in', filters.categoria));
        }
        if (filters?.prioridad && filters.prioridad.length > 0) {
          ticketsQuery = query(ticketsQuery, where('prioridad', 'in', filters.prioridad));
        }

        const ticketsSnapshot = await getDocs(ticketsQuery);
        ticketsSnapshot.forEach((doc) => {
          tickets.push({ ticketId: doc.id, ...doc.data() } as SupportTicket);
        });
      } else {
        // Obtener todos los tickets de todos los residenciales (solo admin global)
        const residencialesSnapshot = await getDocs(collection(db, 'residenciales'));

        for (const residencialDoc of residencialesSnapshot.docs) {
          const supportTicketsRef = collection(db, 'residenciales', residencialDoc.id, 'supportTickets');
          let ticketsQuery = query(
            supportTicketsRef,
            orderBy('fechaCreacion', 'desc')
          );

          // Aplicar filtros
          if (filters?.estado && filters.estado.length > 0) {
            ticketsQuery = query(ticketsQuery, where('estado', 'in', filters.estado));
          }
          if (filters?.categoria && filters.categoria.length > 0) {
            ticketsQuery = query(ticketsQuery, where('categoria', 'in', filters.categoria));
          }
          if (filters?.prioridad && filters.prioridad.length > 0) {
            ticketsQuery = query(ticketsQuery, where('prioridad', 'in', filters.prioridad));
          }

          const residencialData = residencialDoc.data() as { residencialID?: string } | undefined;
          const residencialCode = residencialData?.residencialID ?? residencialDoc.id;
          const ticketsSnapshot = await getDocs(ticketsQuery);
          ticketsSnapshot.forEach((doc) => {
            const data = doc.data();
            tickets.push({
              ticketId: doc.id,
              ...data,
              residencialId: (data?.residencialId as string) || residencialCode,
            } as SupportTicket);
          });
        }
      }

      let filteredTickets = tickets;

      // Filtrar por búsqueda de texto si existe
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(
          (ticket) =>
            ticket.titulo.toLowerCase().includes(searchLower) ||
            ticket.descripcion.toLowerCase().includes(searchLower) ||
            ticket.userName.toLowerCase().includes(searchLower) ||
            ticket.userEmail.toLowerCase().includes(searchLower) ||
            ticket.ticketId.toLowerCase().includes(searchLower)
        );
      }

      // Filtrar por fecha si existe
      if (filters?.fechaDesde || filters?.fechaHasta) {
        filteredTickets = filteredTickets.filter((ticket) => {
          const fechaCreacion = ticket.fechaCreacion instanceof Timestamp
            ? ticket.fechaCreacion.toDate()
            : new Date(ticket.fechaCreacion as string);
          
          if (filters.fechaDesde && fechaCreacion < filters.fechaDesde) {
            return false;
          }
          if (filters.fechaHasta && fechaCreacion > filters.fechaHasta) {
            return false;
          }
          return true;
        });
      }

      // Filtrar solo vencidos
      if (filters?.soloVencidos) {
        const now = new Date();
        filteredTickets = filteredTickets.filter((ticket) => {
          if (!ticket.fechaResolucionPrevista) return false;
          if (ticket.estado === 'resuelto' || ticket.estado === 'cerrado') return false;
          const fecha = ticket.fechaResolucionPrevista instanceof Timestamp
            ? ticket.fechaResolucionPrevista.toDate()
            : new Date(ticket.fechaResolucionPrevista as string);
          return fecha < now;
        });
      }

      return filteredTickets;
    } catch (error) {
      console.error('Error obteniendo tickets:', error);
      throw error;
    }
  },

  /**
   * Obtener un ticket específico
   */
  getTicket: async (residencialId: string, ticketId: string): Promise<SupportTicket | null> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );

      if (residencialQuery.empty) {
        return null;
      }

      const residencialDoc = residencialQuery.docs[0];
      const ticketRef = doc(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);

      if (!ticketDoc.exists()) {
        return null;
      }

      return { ticketId: ticketDoc.id, ...ticketDoc.data() } as SupportTicket;
    } catch (error) {
      console.error('Error obteniendo ticket:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado de un ticket
   */
  updateTicketStatus: async (
    residencialId: string,
    ticketId: string,
    estado: TicketEstado,
    resolucion?: string,
    resueltoPor?: string
  ): Promise<void> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );

      if (residencialQuery.empty) {
        throw new Error('Residencial no encontrado');
      }

      const residencialDoc = residencialQuery.docs[0];
      const ticketRef = doc(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId);

      const updateData: any = {
        estado,
        fechaActualizacion: serverTimestamp(),
        actualizadoPor: resueltoPor || null,
      };

      if (estado === 'resuelto') {
        updateData.fechaResolucion = serverTimestamp();
        if (resolucion) {
          updateData.resolucion = resolucion;
        }
        if (resueltoPor) {
          updateData.resueltoPor = resueltoPor;
        }
      }

      await updateDoc(ticketRef, updateData);
    } catch (error) {
      console.error('Error actualizando ticket:', error);
      throw error;
    }
  },

  /**
   * Asignar ticket a un admin
   */
  assignTicket: async (
    residencialId: string,
    ticketId: string,
    adminId: string
  ): Promise<void> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );

      if (residencialQuery.empty) {
        throw new Error('Residencial no encontrado');
      }

      const residencialDoc = residencialQuery.docs[0];
      const ticketRef = doc(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId);

      await updateDoc(ticketRef, {
        asignadoA: adminId,
        fechaActualizacion: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error asignando ticket:', error);
      throw error;
    }
  },

  /**
   * Actualizar la fecha prevista de resolución de un ticket
   */
  updateTicketFechaResolucionPrevista: async (
    residencialId: string,
    ticketId: string,
    fecha: Date | null
  ): Promise<void> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );

      if (residencialQuery.empty) {
        throw new Error('Residencial no encontrado');
      }

      const residencialDoc = residencialQuery.docs[0];
      const ticketRef = doc(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId);

      await updateDoc(ticketRef, {
        fechaResolucionPrevista: fecha ? Timestamp.fromDate(fecha) : deleteField(),
        fechaActualizacion: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error actualizando fecha prevista:', error);
      throw error;
    }
  },

  /**
   * Obtener respuestas de un ticket
   */
  getTicketRespuestas: async (
    residencialId: string,
    ticketId: string
  ): Promise<TicketRespuesta[]> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );
      if (residencialQuery.empty) return [];
      const residencialDoc = residencialQuery.docs[0];
      const respuestasRef = collection(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId, 'respuestas');
      const respuestasQuery = query(respuestasRef, orderBy('fecha', 'asc'));
      const snapshot = await getDocs(respuestasQuery);
      return snapshot.docs.map((d) => ({ respuestaId: d.id, ...d.data() } as TicketRespuesta));
    } catch (error) {
      console.error('Error obteniendo respuestas:', error);
      throw error;
    }
  },

  /**
   * Agregar respuesta de admin a un ticket
   */
  addTicketRespuesta: async (
    residencialId: string,
    ticketId: string,
    texto: string,
    adminUid: string,
    adminNombre: string,
    archivos?: File[]
  ): Promise<void> => {
    try {
      const residencialQuery = await getDocs(
        query(collection(db, 'residenciales'), where('residencialID', '==', residencialId))
      );
      if (residencialQuery.empty) {
        throw new Error('Residencial no encontrado');
      }
      const residencialDoc = residencialQuery.docs[0];
      const ticketRef = doc(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId);
      const respuestasRef = collection(db, 'residenciales', residencialDoc.id, 'supportTickets', ticketId, 'respuestas');

      const ticketDoc = await getDoc(ticketRef);
      if (!ticketDoc.exists()) {
        throw new Error('Ticket no encontrado');
      }

      const ticketData = ticketDoc.data()!;
      const estado = ticketData.estado as string;
      if (estado === 'resuelto' || estado === 'cerrado') {
        throw new Error('Este ticket está cerrado. El usuario debe crear un nuevo ticket.');
      }

      const archivosData: { url: string; nombre: string; tipo: string }[] = [];
      if (archivos && archivos.length > 0 && storage) {
        for (const file of archivos) {
          const path = `support/${residencialId}/tickets/${ticketId}/respuestas/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          archivosData.push({ url, nombre: file.name, tipo: file.type || 'imagen' });
        }
      }

      const batch = writeBatch(db);
      const respuestaData: Record<string, any> = {
        texto: texto.trim(),
        enviadoPor: 'admin' as const,
        uid: adminUid,
        nombre: adminNombre,
        fecha: serverTimestamp(),
      };
      if (archivosData.length > 0) respuestaData.archivos = archivosData;

      const nuevaRespuestaRef = doc(respuestasRef);
      batch.set(nuevaRespuestaRef, respuestaData);

      const updateTicketData: Record<string, any> = {
        fechaActualizacion: serverTimestamp(),
      };
      if (!ticketDoc.data()?.fechaPrimeraRespuesta) {
        updateTicketData.fechaPrimeraRespuesta = serverTimestamp();
        updateTicketData.primeraRespuestaPor = adminUid;
      }
      batch.update(ticketRef, updateTicketData);
      await batch.commit();
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de tickets
   */
  getTicketStats: async (residencialId?: string): Promise<TicketStats> => {
    try {
      const tickets = await SupportService.getTickets(residencialId);
      const now = new Date();

      const stats: TicketStats = {
        total: tickets.length,
        abiertos: tickets.filter((t) => t.estado === 'abierto').length,
        enProceso: tickets.filter((t) => t.estado === 'en_proceso').length,
        resueltos: tickets.filter((t) => t.estado === 'resuelto').length,
        cerrados: tickets.filter((t) => t.estado === 'cerrado').length,
        vencidos: tickets.filter((t) => {
          if (!t.fechaResolucionPrevista) return false;
          if (t.estado === 'resuelto' || t.estado === 'cerrado') return false;
          const fecha = t.fechaResolucionPrevista instanceof Timestamp
            ? t.fechaResolucionPrevista.toDate()
            : new Date(t.fechaResolucionPrevista as string);
          return fecha < now;
        }).length,
        tiempoPromedioResolucion: 0,
        tiempoPromedioPrimeraRespuesta: 0,
        ticketsPorCategoria: {
          tecnico: 0,
          facturacion: 0,
          acceso: 0,
          general: 0,
          otro: 0,
        },
        ticketsPorPrioridad: {
          baja: 0,
          media: 0,
          alta: 0,
          urgente: 0,
        },
      };

      // Calcular tiempo promedio de resolución
      const ticketsResueltos = tickets.filter(
        (t) => t.estado === 'resuelto' && t.fechaResolucion
      );
      if (ticketsResueltos.length > 0) {
        const tiemposResolucion = ticketsResueltos.map((ticket) => {
          const fechaCreacion = ticket.fechaCreacion instanceof Timestamp
            ? ticket.fechaCreacion.toDate()
            : new Date(ticket.fechaCreacion as string);
          const fechaResolucion = ticket.fechaResolucion instanceof Timestamp
            ? ticket.fechaResolucion.toDate()
            : new Date(ticket.fechaResolucion as string);
          return (fechaResolucion.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60);
        });
        stats.tiempoPromedioResolucion =
          tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length;
      }

      // Calcular tiempo promedio de primera respuesta
      const ticketsConPrimeraResp = tickets.filter(
        (t) => t.fechaPrimeraRespuesta
      );
      if (ticketsConPrimeraResp.length > 0) {
        const tiemposPrimeraResp = ticketsConPrimeraResp.map((ticket) => {
          const fechaCreacion = ticket.fechaCreacion instanceof Timestamp
            ? ticket.fechaCreacion.toDate()
            : new Date(ticket.fechaCreacion as string);
          const fechaPrimeraResp = ticket.fechaPrimeraRespuesta instanceof Timestamp
            ? ticket.fechaPrimeraRespuesta.toDate()
            : new Date(ticket.fechaPrimeraRespuesta as string);
          return (fechaPrimeraResp.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60);
        });
        stats.tiempoPromedioPrimeraRespuesta =
          tiemposPrimeraResp.reduce((a, b) => a + b, 0) / tiemposPrimeraResp.length;
      }

      // Contar por categoría y prioridad
      tickets.forEach((ticket) => {
        stats.ticketsPorCategoria[ticket.categoria]++;
        stats.ticketsPorPrioridad[ticket.prioridad]++;
      });

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las preguntas frecuentes
   */
  getKnowledgeBase: async (): Promise<KnowledgeBaseItem[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'supportKnowledgeBase'), orderBy('fechaCreacion', 'desc'))
      );

      return snapshot.docs.map((doc) => ({
        knowledgeId: doc.id,
        ...doc.data(),
      })) as KnowledgeBaseItem[];
    } catch (error) {
      console.error('Error obteniendo base de conocimiento:', error);
      throw error;
    }
  },

  /**
   * Crear o actualizar pregunta frecuente
   * Genera automáticamente el embedding para RAG cuando se crea o actualiza
   */
  saveKnowledgeBaseItem: async (
    item: Partial<KnowledgeBaseItem>,
    itemId?: string
  ): Promise<string> => {
    try {
      let finalItemId: string;

      if (itemId) {
        // Actualizar existente
        const itemRef = doc(db, 'supportKnowledgeBase', itemId);
        await updateDoc(itemRef, {
          ...item,
          fechaActualizacion: serverTimestamp(),
        });
        finalItemId = itemId;
      } else {
        // Crear nuevo
        const itemRef = await addDoc(collection(db, 'supportKnowledgeBase'), {
          ...item,
          vecesUtilizada: 0,
          efectividad: 0,
          activo: true,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
        });
        finalItemId = itemRef.id;
      }

      // Generar embedding para RAG automáticamente
      // Solo si tenemos pregunta, respuesta y tags
      if (item.pregunta && item.respuesta) {
        try {
          const generateEmbedding = httpsCallable(functions, 'generateKnowledgeBaseEmbedding');
          await generateEmbedding({
            knowledgeId: finalItemId,
            pregunta: item.pregunta,
            variantesPregunta: item.variantesPregunta || [],
            respuesta: item.respuesta,
            tags: item.tags || [],
          });
          console.log(`Embedding generado para pregunta frecuente: ${finalItemId}`);
        } catch (embeddingError) {
          // No fallar si el embedding falla, solo loguear
          console.warn('Error generando embedding (no crítico):', embeddingError);
          // Si no hay OPENAI_API_KEY configurada, esto es esperado
        }
      }

      return finalItemId;
    } catch (error) {
      console.error('Error guardando pregunta frecuente:', error);
      throw error;
    }
  },

  /**
   * Eliminar pregunta frecuente
   */
  deleteKnowledgeBaseItem: async (itemId: string): Promise<void> => {
    try {
      const itemRef = doc(db, 'supportKnowledgeBase', itemId);
      await updateDoc(itemRef, {
        activo: false,
        fechaActualizacion: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error eliminando pregunta frecuente:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de base de conocimiento
   */
  getKnowledgeBaseStats: async (): Promise<KnowledgeBaseStats> => {
    try {
      const items = await SupportService.getKnowledgeBase();

      return {
        total: items.length,
        activos: items.filter((i) => i.activo).length,
        inactivos: items.filter((i) => !i.activo).length,
        masUtilizadas: [...items]
          .sort((a, b) => b.vecesUtilizada - a.vecesUtilizada)
          .slice(0, 10),
        mejorEfectividad: [...items]
          .filter((i) => i.vecesUtilizada > 0)
          .sort((a, b) => b.efectividad - a.efectividad)
          .slice(0, 10),
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de base de conocimiento:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los tags únicos de la base de conocimiento para sugerencias
   */
  getAllTags: async (): Promise<string[]> => {
    try {
      const items = await SupportService.getKnowledgeBase();
      const allTags = new Set<string>();
      
      items.forEach((item) => {
        item.tags?.forEach((tag) => {
          if (tag.trim()) {
            allTags.add(tag.trim().toLowerCase());
          }
        });
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error obteniendo tags:', error);
      return [];
    }
  },

  /**
   * Regenerar embedding para un item de conocimiento
   */
  regenerateEmbedding: async (knowledgeId: string, item: Partial<KnowledgeBaseItem>): Promise<void> => {
    try {
      if (!item.pregunta || !item.respuesta) {
        throw new Error('Se requiere pregunta y respuesta para generar embedding');
      }

      const generateEmbedding = httpsCallable(functions, 'generateKnowledgeBaseEmbedding');
      await generateEmbedding({
        knowledgeId,
        pregunta: item.pregunta,
        variantesPregunta: item.variantesPregunta || [],
        respuesta: item.respuesta,
        tags: item.tags || [],
      });
    } catch (error) {
      console.error('Error regenerando embedding:', error);
      throw error;
    }
  },
};
