/**
 * Modelos de datos correspondientes al proyecto móvil Zentry
 * Estos modelos están diseñados para ser compatibles con la estructura
 * de datos utilizada en la aplicación móvil, sin requerir cambios en ella.
 */

export enum UserRole {
  Resident = 'resident',
  Guard = 'guard',
  Admin = 'admin',

}

export interface UserModel {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
  residencialId: string;
  residencialDocId: string;
  houseNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
  paternalLastName?: string;
  maternalLastName?: string;
  doNotDisturb?: boolean;
  doNotDisturbStart?: Date;
  doNotDisturbEnd?: Date;
  isGlobalAdmin?: boolean;
  managedResidencials?: string[];
}

export interface Residencial {
  id: string;
  nombre: string;
  name?: string; 
  direccion: string;
  address?: string;
  ciudad?: string;
  city?: string;
  estado?: string;
  state?: string;
  codigoPostal?: string;
  postalCode?: string;
  pais?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
  adminIds?: string[];
  totalHouses?: number;
}

export interface AccessCode {
  id?: string;
  code: string;
  userId: string;
  residencialId: string;
  visitorName: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  validatedBy?: string;
  isOneTime: boolean;
}

export interface DrawerItem {
  label: string;
  route: string;
  icon: string;
}

export interface NavigationItem {
  label: string;
  route: string; 
  icon: string;
} 