import { Usuario, Residencial, GlobalScreenRestrictions } from '../firebase/firestore';
import { getResidencial } from '../firebase/firestore';

/**
 * Servicio para verificar el acceso a features considerando restricciones globales y individuales
 */
export class FeatureAccessService {
  /**
   * Verifica si una feature específica está habilitada para un usuario
   * @param usuario El usuario para verificar
   * @param featureName El nombre de la feature a verificar
   * @param residencialId El ID del residencial del usuario
   * @returns true si la feature está habilitada, false en caso contrario
   */
  static async isFeatureEnabled(
    usuario: Usuario,
    featureName: keyof GlobalScreenRestrictions,
    residencialId: string
  ): Promise<boolean> {
    try {
      // Si el usuario es admin o seguridad, siempre tiene acceso
      if (usuario.role === 'admin' || usuario.role === 'security') {
        return true;
      }

      // Solo verificar restricciones para residentes
      if (usuario.role !== 'resident') {
        return true;
      }

      // Obtener el residencial para verificar restricciones globales
      const residencial = await getResidencial(residencialId);
      if (!residencial) {
        console.warn(`Residencial no encontrado: ${residencialId}`);
        return true; // Por defecto permitir si no se puede verificar
      }

      // Verificar restricciones globales primero
      if (residencial.globalScreenRestrictions) {
        const globalRestriction = residencial.globalScreenRestrictions[featureName];
        if (globalRestriction === false) {
          console.log(`🔒 Feature ${featureName} bloqueada globalmente para residencial ${residencialId}`);
          return false;
        }
      }

      // Si no hay restricción global, verificar restricciones individuales
      if (usuario.features) {
        const individualFeature = usuario.features[featureName];
        if (individualFeature === false) {
          console.log(`🔒 Feature ${featureName} bloqueada individualmente para usuario ${usuario.id}`);
          return false;
        }
      }

      // Si no hay restricciones, la feature está habilitada
      return true;
    } catch (error) {
      console.error(`Error verificando acceso a feature ${featureName}:`, error);
      return true; // Por defecto permitir si hay error
    }
  }

  /**
   * Verifica si múltiples features están habilitadas
   * @param usuario El usuario para verificar
   * @param featureNames Array de nombres de features a verificar
   * @param residencialId El ID del residencial del usuario
   * @returns Objeto con el estado de cada feature
   */
  static async checkMultipleFeatures(
    usuario: Usuario,
    featureNames: (keyof GlobalScreenRestrictions)[],
    residencialId: string
  ): Promise<Record<keyof GlobalScreenRestrictions, boolean>> {
    const results: Partial<Record<keyof GlobalScreenRestrictions, boolean>> = {};
    
    for (const featureName of featureNames) {
      results[featureName] = await this.isFeatureEnabled(usuario, featureName, residencialId);
    }
    
    return results as Record<keyof GlobalScreenRestrictions, boolean>;
  }

  /**
   * Obtiene el estado de todas las features para un usuario
   * @param usuario El usuario para verificar
   * @param residencialId El ID del residencial del usuario
   * @returns Objeto con el estado de todas las features
   */
  static async getAllFeaturesStatus(
    usuario: Usuario,
    residencialId: string
  ): Promise<Record<keyof GlobalScreenRestrictions, boolean>> {
    const allFeatures: (keyof GlobalScreenRestrictions)[] = [
      'visitas',
      'eventos',
      'mensajes',
      'reservas',
      'encuestas'
    ];
    
    return await this.checkMultipleFeatures(usuario, allFeatures, residencialId);
  }

  /**
   * Verifica si un usuario tiene restricciones globales activas
   * @param usuario El usuario para verificar
   * @param residencialId El ID del residencial del usuario
   * @returns true si hay restricciones globales activas
   */
  static async hasGlobalRestrictions(
    usuario: Usuario,
    residencialId: string
  ): Promise<boolean> {
    try {
      // Solo verificar para residentes
      if (usuario.role !== 'resident') {
        return false;
      }

      const residencial = await getResidencial(residencialId);
      if (!residencial || !residencial.globalScreenRestrictions) {
        return false;
      }

      // Verificar si alguna feature está bloqueada globalmente
      return Object.values(residencial.globalScreenRestrictions).some(restriction => restriction === false);
    } catch (error) {
      console.error('Error verificando restricciones globales:', error);
      return false;
    }
  }
}
