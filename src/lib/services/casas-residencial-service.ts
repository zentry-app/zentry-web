import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

export interface CasaResidencial {
  houseId: string;
  calle: string;
  houseNumber: string;
  residencialId: string;
  usuarios: {
    uid: string;
    fullName: string;
    email: string;
    role: string;
  }[];
  totalUsuarios: number;
  morosos: number;
  status: 'al_dia' | 'moroso' | 'sin_usuarios';
}

/**
 * Servicio para obtener las casas de un residencial
 */
export class CasasResidencialService {
  
  /**
   * Obtener todas las casas de un residencial con sus usuarios
   */
  static async getCasasPorResidencial(residencialDocId: string): Promise<CasaResidencial[]> {
    try {
      console.log(`🏠 [CASAS] Obteniendo casas para residencialDocId: ${residencialDocId}`);
      
      // PRIMERO: Obtener el residencialID real del documento del residencial
      const residencialRef = doc(db, 'residenciales', residencialDocId);
      const residencialDoc = await getDoc(residencialRef);
      
      if (!residencialDoc.exists()) {
        console.error(`🏠 [CASAS] Residencial no encontrado: ${residencialDocId}`);
        return [];
      }
      
      const residencialData = residencialDoc.data();
      const residencialID = residencialData?.residencialID;
      
      if (!residencialID) {
        console.error(`🏠 [CASAS] ResidencialID no encontrado en documento: ${residencialDocId}`);
        return [];
      }
      
      console.log(`🏠 [CASAS] ResidencialID encontrado: ${residencialID}`);
      
      // SEGUNDO: Obtener usuarios del residencial usando el residencialID real
      const usuariosRef = collection(db, 'usuarios');
      const q = query(
        usuariosRef,
        where('residencialID', '==', residencialID),
        where('role', '==', 'resident')
      );
      
      const querySnapshot = await getDocs(q);
      const usuarios: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usuarios.push({
          uid: doc.id,
          ...data
        });
      });
      
      console.log(`👥 ${usuarios.length} usuarios encontrados`);
      
      // Agrupar usuarios por casa
      const casasMap = new Map<string, CasaResidencial>();
      
      usuarios.forEach(usuario => {
        const calle = usuario.calle || 'Sin calle';
        const houseNumber = usuario.houseNumber || 'Sin número';
        const houseId = usuario.houseID || `${calle}-${houseNumber}`.toLowerCase().replace(/\s+/g, '_');
        
        if (!casasMap.has(houseId)) {
          casasMap.set(houseId, {
            houseId,
            calle,
            houseNumber,
            residencialId: residencialDocId,
            usuarios: [],
            totalUsuarios: 0,
            morosos: 0,
            status: 'sin_usuarios'
          });
        }
        
        const casa = casasMap.get(houseId)!;
        casa.usuarios.push({
          uid: usuario.uid,
          fullName: usuario.fullName || 'Sin nombre',
          email: usuario.email || 'Sin email',
          role: usuario.role || 'resident'
        });
        casa.totalUsuarios++;
        
        // Verificar si es moroso (simplificado)
        if (usuario.status === 'moroso' || usuario.isMoroso) {
          casa.morosos++;
        }
      });
      
      // Determinar status de cada casa
      casasMap.forEach(casa => {
        if (casa.totalUsuarios === 0) {
          casa.status = 'sin_usuarios';
        } else if (casa.morosos > 0) {
          casa.status = 'moroso';
        } else {
          casa.status = 'al_dia';
        }
      });
      
      const casas = Array.from(casasMap.values()).sort((a, b) => {
        // Ordenar por calle y luego por número de casa
        const calleCompare = a.calle.localeCompare(b.calle);
        if (calleCompare !== 0) return calleCompare;
        
        // Convertir números de casa a números para ordenar correctamente
        const numA = parseInt(a.houseNumber) || 0;
        const numB = parseInt(b.houseNumber) || 0;
        return numA - numB;
      });
      
      console.log(`🏠 ${casas.length} casas encontradas`);
      return casas;
    } catch (error) {
      console.error('❌ Error al obtener casas del residencial:', error);
      throw error;
    }
  }

  /**
   * Obtener una casa específica por houseId
   */
  static async getCasaPorId(residencialDocId: string, houseId: string): Promise<CasaResidencial | null> {
    try {
      const casas = await this.getCasasPorResidencial(residencialDocId);
      return casas.find(casa => casa.houseId === houseId) || null;
    } catch (error) {
      console.error('❌ Error al obtener casa por ID:', error);
      throw error;
    }
  }

  /**
   * Buscar casas por término de búsqueda
   */
  static async buscarCasas(residencialDocId: string, termino: string): Promise<CasaResidencial[]> {
    try {
      const casas = await this.getCasasPorResidencial(residencialDocId);
      const terminoLower = termino.toLowerCase();
      
      return casas.filter(casa => 
        casa.calle.toLowerCase().includes(terminoLower) ||
        casa.houseNumber.toLowerCase().includes(terminoLower) ||
        casa.houseId.toLowerCase().includes(terminoLower) ||
        casa.usuarios.some(usuario => 
          usuario.fullName.toLowerCase().includes(terminoLower) ||
          usuario.email.toLowerCase().includes(terminoLower)
        )
      );
    } catch (error) {
      console.error('❌ Error al buscar casas:', error);
      throw error;
    }
  }

  /**
   * Obtener casas morosas
   */
  static async getCasasMorosas(residencialDocId: string): Promise<CasaResidencial[]> {
    try {
      const casas = await this.getCasasPorResidencial(residencialDocId);
      return casas.filter(casa => casa.status === 'moroso');
    } catch (error) {
      console.error('❌ Error al obtener casas morosas:', error);
      throw error;
    }
  }

  /**
   * Obtener casas al día
   */
  static async getCasasAlDia(residencialDocId: string): Promise<CasaResidencial[]> {
    try {
      const casas = await this.getCasasPorResidencial(residencialDocId);
      return casas.filter(casa => casa.status === 'al_dia');
    } catch (error) {
      console.error('❌ Error al obtener casas al día:', error);
      throw error;
    }
  }
}
