/**
 * Servicio específico para validación de residenciales durante el registro
 * Contiene los métodos necesarios para el proceso de registro
 */

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ResidentialData {
  id: string;
  residencialID: string;
  nombre: string;
  calles: string[];
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

interface ResidentialValidationResult {
  isValid: boolean;
  data?: ResidentialData;
  error?: string;
}

interface UserCountInHouse {
  count: number;
  maxAllowed: number;
  canRegister: boolean;
  ownerCount: number;
  tenantCount: number;
}

class RegistrationResidentialService {
  private static instance: RegistrationResidentialService;
  private readonly baseMaxUsersPerHouse = 2;
  private readonly maxUsersWithOwner = 3;

  private constructor() {}

  static getInstance(): RegistrationResidentialService {
    if (!RegistrationResidentialService.instance) {
      RegistrationResidentialService.instance = new RegistrationResidentialService();
    }
    return RegistrationResidentialService.instance;
  }

  /**
   * Valida un ID de residencial
   */
  async validateResidentialId(residentialId: string): Promise<ResidentialValidationResult> {
    try {
      console.log('🏙️ Validando ID de residencial:', residentialId);

      if (!residentialId || residentialId.length !== 6) {
        return {
          isValid: false,
          error: 'El ID del residencial debe tener exactamente 6 caracteres'
        };
      }

      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('residencialID', '==', residentialId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ Residencial no encontrado:', residentialId);
        return {
          isValid: false,
          error: 'ID de residencial no encontrado'
        };
      }

      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      if (data.activo === false) {
        return {
          isValid: false,
          error: 'Este residencial está desactivado'
        };
      }

      const residentialData: ResidentialData = {
        id: docSnap.id,
        residencialID: data.residencialID,
        nombre: data.nombre || 'Residencial sin nombre',
        calles: Array.isArray(data.calles) ? data.calles : [],
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        activo: data.activo !== false
      };

      console.log('✅ Residencial encontrado:', residentialData.nombre);

      return {
        isValid: true,
        data: residentialData
      };
    } catch (error) {
      console.error('❌ Error al validar residencial:', error);
      return {
        isValid: false,
        error: 'Error al validar el residencial. Intenta nuevamente.'
      };
    }
  }

  /**
   * Cuenta usuarios existentes en una casa específica con información detallada
   */
  async countUsersInHouse(
    residencialID: string,
    calle: string,
    houseNumber: string,
    isNewUserOwner: boolean = false
  ): Promise<UserCountInHouse> {
    try {
      console.log('🔍 Verificando usuarios existentes en la casa');

      const usuariosRef = collection(db, 'usuarios');
      const q = query(
        usuariosRef,
        where('residencialID', '==', residencialID),
        where('calle', '==', calle),
        where('houseNumber', '==', houseNumber),
        where('status', 'in', ['pending', 'approved'])
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs;
      const count = users.length;

      // Contar propietarios e inquilinos
      let ownerCount = 0;
      let tenantCount = 0;

      for (const doc of users) {
        const userData = doc.data();
        const isOwner = userData.isOwner === true;
        if (isOwner) {
          ownerCount++;
        } else {
          tenantCount++;
        }
      }

      console.log('📋 Detalle de usuarios encontrados:');
      console.log('   Total de documentos:', users.length);
      
      // Mostrar detalles de cada usuario
      for (const doc of users) {
        const userData = doc.data();
        const isOwner = userData.isOwner === true;
        const status = userData.status || 'unknown';
        const email = userData.email || 'sin email';
        const fullName = userData.fullName || 'sin nombre';
        
        console.log('   👤 Usuario:', fullName, `(${email})`);
        console.log('      Status:', status);
        console.log('      Es propietario:', isOwner);
        console.log('      UID:', doc.id);
        console.log('      ✅ Contado como', isOwner ? 'propietario' : 'inquilino');
      }
      
      console.log('👨‍👩‍👧‍👦 Resumen de usuarios en la casa:');
      console.log('   Total:', count);
      console.log('   Propietarios:', ownerCount);
      console.log('   Inquilinos:', tenantCount);

      // Calcular el límite dinámico
      const maxAllowed = this.calculateMaxUsersForHouse(ownerCount, tenantCount, isNewUserOwner);
      const canRegister = count < maxAllowed;
      
      console.log('🎯 Resultado de verificación:');
      console.log('   Límite máximo:', maxAllowed);
      console.log('   Usuarios actuales:', count);
      console.log('   ¿Puede registrar?:', canRegister);

      return {
        count,
        maxAllowed,
        canRegister,
        ownerCount,
        tenantCount
      };
    } catch (error) {
      console.error('❌ Error al verificar usuarios en la casa:', error);
      return {
        count: 0,
        maxAllowed: this.baseMaxUsersPerHouse,
        canRegister: true,
        ownerCount: 0,
        tenantCount: 0
      };
    }
  }

  /**
   * Calcula el límite dinámico de usuarios por casa
   */
  private calculateMaxUsersForHouse(ownerCount: number, tenantCount: number, isNewUserOwner: boolean): number {
    console.log('🧮 Calculando límite dinámico de usuarios:');
    console.log('   Propietarios actuales:', ownerCount);
    console.log('   Inquilinos actuales:', tenantCount);
    console.log('   Nuevo usuario es propietario:', isNewUserOwner);
    
    // Si no hay propietarios y el nuevo usuario no es propietario, usar límite base
    if (ownerCount === 0 && !isNewUserOwner) {
      console.log('   📊 Caso: Sin propietarios + nuevo usuario no es propietario');
      console.log('   📊 Límite aplicado:', this.baseMaxUsersPerHouse, 'usuarios');
      return this.baseMaxUsersPerHouse;
    }
    
    // Si hay propietarios o el nuevo usuario es propietario, permitir hasta 3 usuarios
    console.log('   📊 Caso: Hay propietarios O nuevo usuario es propietario');
    console.log('   📊 Límite aplicado:', this.maxUsersWithOwner, 'usuarios');
    return this.maxUsersWithOwner;
  }

  // Cambiar generateHouseId para máxima legibilidad y unicidad, sin la palabra 'CALLE'
  generateHouseId(residencialId: string, calle: string, houseNumber: string): string {
    const normalizeStreet = (street: string) =>
      street
        .replace(/^CALLE\s+/i, '') // Quitar prefijo 'CALLE' si existe
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/\s+/g, '_') // Espacios por guión bajo
        .toUpperCase();
    const calleNorm = normalizeStreet(calle);
    return `${residencialId}-${calleNorm}-${houseNumber}`;
  }

  /**
   * Valida una dirección completa
   */
  async validateAddress(
    residentialId: string,
    street: string,
    houseNumber: string,
    isNewUserOwner: boolean = false
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const residentialValidation = await this.validateResidentialId(residentialId);
      if (!residentialValidation.isValid) {
        return {
          isValid: false,
          error: residentialValidation.error
        };
      }

      const streets = residentialValidation.data?.calles || [];
      if (!streets.includes(street)) {
        return {
          isValid: false,
          error: 'La calle seleccionada no pertenece a este residencial'
        };
      }

      if (!houseNumber || houseNumber.trim() === '') {
        return {
          isValid: false,
          error: 'El número de casa es obligatorio'
        };
      }

      const userCount = await this.countUsersInHouse(residentialId, street, houseNumber, isNewUserOwner);
      if (!userCount.canRegister) {
        let errorMessage;
        if (userCount.maxAllowed === this.maxUsersWithOwner) {
          errorMessage = `Esta casa ya tiene el máximo de ${userCount.maxAllowed} usuarios registrados (1 propietario + 2 inquilinos)`;
        } else {
          errorMessage = `Esta casa ya tiene el máximo de ${userCount.maxAllowed} usuarios registrados`;
        }
        
        return {
          isValid: false,
          error: errorMessage
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error al validar dirección:', error);
      return {
        isValid: false,
        error: 'Error al validar la dirección. Intenta nuevamente.'
      };
    }
  }

  /**
   * Verifica si un usuario ya existe
   */
  async checkUserExists(email: string): Promise<boolean> {
    try {
      console.log('👤 Verificando si el usuario ya existe:', email);

      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      const exists = !querySnapshot.empty;
      console.log(exists ? '⚠️ Usuario ya existe' : '✅ Usuario no existe');

      return exists;
    } catch (error) {
      console.error('❌ Error al verificar existencia del usuario:', error);
      return false;
    }
  }
}

export default RegistrationResidentialService.getInstance(); 