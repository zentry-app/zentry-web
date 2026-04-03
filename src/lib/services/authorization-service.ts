import { UserModel, UserRole } from '../../types/models';

/**
 * Permisos disponibles en el sistema
 */
export enum Permission {
  // Permisos generales
  ViewDashboard = 'view_dashboard',
  ViewProfile = 'view_profile',
  EditProfile = 'edit_profile',
  
  // Permisos de residentes
  RequestAccessCode = 'request_access_code',
  ViewOwnAccessCodes = 'view_own_access_codes',
  CancelOwnAccessCode = 'cancel_own_access_code',
  
  // Permisos de guardias/seguridad
  ValidateAccessCode = 'validate_access_code',
  RegisterEntry = 'register_entry',
  ViewEntryLog = 'view_entry_log',
  PerformRound = 'perform_round',
  
  // Permisos de administradores
  ManageUsers = 'manage_users',
  ManageResidentials = 'manage_residentials',
  ManageSecurity = 'manage_security',
  ViewReports = 'view_reports',
  ManageSettings = 'manage_settings',
  
  // Permisos de administradores globales
  ManageAllResidentials = 'manage_all_residentials',
  ManageAllUsers = 'manage_all_users',
  ManageAdmins = 'manage_admins',
  AccessSystemSettings = 'access_system_settings',
  
  // Permisos de desarrolladores
  AccessAllFunctions = 'access_all_functions',
}

/**
 * Matriz de permisos por rol
 */
const permissionMatrix: Record<UserRole, Permission[]> = {
  [UserRole.Resident]: [
    Permission.ViewDashboard,
    Permission.ViewProfile,
    Permission.EditProfile,
    Permission.RequestAccessCode,
    Permission.ViewOwnAccessCodes,
    Permission.CancelOwnAccessCode,
  ],
  
  [UserRole.Guard]: [
    Permission.ViewDashboard,
    Permission.ViewProfile,
    Permission.EditProfile,
    Permission.ValidateAccessCode,
    Permission.RegisterEntry,
    Permission.ViewEntryLog,
    Permission.PerformRound,
  ],
  
  [UserRole.Admin]: [
    Permission.ViewDashboard,
    Permission.ViewProfile,
    Permission.EditProfile,
    Permission.ManageUsers,
    Permission.ManageResidentials,
    Permission.ManageSecurity,
    Permission.ViewReports,
    Permission.ManageSettings,
    Permission.ValidateAccessCode,
    Permission.RegisterEntry,
    Permission.ViewEntryLog,
    // Añadimos permisos de admin global si tiene la flag de admin global
    // Estos se verifican dinámicamente en el método isGlobalAdmin
  ],
  
  [UserRole.Developer]: [
    Permission.AccessAllFunctions,
  ],
};

/**
 * Servicio para verificar permisos basados en roles
 * Refleja la funcionalidad del servicio UserAuthorizationService en la app móvil
 */
export const AuthorizationService = {
  /**
   * Verifica si un usuario es administrador global
   */
  isGlobalAdmin: (user: UserModel): boolean => {
    // Verificar flag específico en el modelo
    if (user.isGlobalAdmin) {
      return true;
    }
    
    // Si no es admin, no puede ser global admin
    if (user.role !== UserRole.Admin) {
      return false;
    }
    
    // Verificar si tiene el campo isGlobalAdmin en true
    // Por ahora, consideramos todos los admins como globales
    // Más adelante, se puede añadir un campo específico en el modelo de usuario
    return true;
  },
  
  /**
   * Verifica si un rol tiene un permiso específico
   */
  hasPermission: (user: UserModel, permission: Permission): boolean => {
    const { role } = user;
    
    // Los desarrolladores tienen acceso completo
    if (role === UserRole.Developer || permissionMatrix[role].includes(Permission.AccessAllFunctions)) {
      return true;
    }
    
    // Si es admin global, tiene permisos adicionales
    if (role === UserRole.Admin && AuthorizationService.isGlobalAdmin(user)) {
      // Añadimos permisos adicionales para admins globales
      const globalAdminPermissions = [
        Permission.ManageAllResidentials,
        Permission.ManageAllUsers,
        Permission.ManageAdmins,
        Permission.AccessSystemSettings,
      ];
      
      // Si está pidiendo un permiso de admin global, lo concedemos
      if (globalAdminPermissions.includes(permission)) {
        return true;
      }
    }
    
    // Verificar si el rol tiene el permiso específico
    return permissionMatrix[role].includes(permission);
  },
  
  /**
   * Obtiene todos los permisos disponibles para un usuario
   */
  getPermissionsForUser: (user: UserModel): Permission[] => {
    const { role } = user;
    
    // Los desarrolladores tienen todos los permisos
    if (role === UserRole.Developer) {
      return Object.values(Permission);
    }
    
    // Base de permisos según el rol
    const permissions = [...permissionMatrix[role]];
    
    // Si es admin global, añadir permisos adicionales
    if (role === UserRole.Admin && AuthorizationService.isGlobalAdmin(user)) {
      permissions.push(
        Permission.ManageAllResidentials,
        Permission.ManageAllUsers,
        Permission.ManageAdmins,
        Permission.AccessSystemSettings
      );
    }
    
    return permissions;
  },
  
  /**
   * Verifica si un usuario tiene múltiples permisos
   */
  hasPermissions: (user: UserModel, permissions: Permission[]): boolean => {
    // Los desarrolladores tienen acceso completo
    if (user.role === UserRole.Developer) {
      return true;
    }
    
    // Verificar cada permiso
    return permissions.every(permission => 
      AuthorizationService.hasPermission(user, permission)
    );
  },

  /**
   * Verifica si un usuario puede acceder a un residencial específico
   */
  canAccessResidencial: (user: UserModel, residencialId: string): boolean => {
    // Desarrolladores y admins globales pueden acceder a cualquier residencial
    if (user.role === UserRole.Developer || 
        (user.role === UserRole.Admin && AuthorizationService.isGlobalAdmin(user))) {
      return true;
    }
    
    // Otros usuarios solo pueden acceder a su propio residencial
    return user.residencialId === residencialId || user.residencialDocId === residencialId;
  }
};

export default AuthorizationService; 