import { UserModel, UserRole } from '@/types/models';
import { Usuario } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Convierte un objeto Usuario de Firestore a UserModel
 */
export function usuarioToUserModel(usuario: Usuario): UserModel {
  // Convertir los Timestamp a Date
  const createdAt = usuario.createdAt?.toDate ? usuario.createdAt.toDate() : undefined;
  const updatedAt = usuario.updatedAt?.toDate ? usuario.updatedAt.toDate() : undefined;
  const doNotDisturbStart = usuario.notificationSettings?.doNotDisturbStart 
    ? new Date() // Aquí deberías convertir el string a Date si es necesario
    : undefined;
  const doNotDisturbEnd = usuario.notificationSettings?.doNotDisturbEnd
    ? new Date() // Aquí deberías convertir el string a Date si es necesario
    : undefined;

  // Mapear el rol string al enum UserRole
  let role: UserRole;
  switch (usuario.role?.toLowerCase()) {
    case 'admin':
      role = UserRole.Admin;
      break;
    case 'security':
      role = UserRole.Guard;
      break;
    case 'resident':
      role = UserRole.Resident;
      break;
    default:
      role = UserRole.Resident;
  }

  return {
    uid: usuario.id || usuario.uid,
    email: usuario.email || '',
    fullName: usuario.fullName || '',
    role,
    status: usuario.status || 'pending',
    residencialId: usuario.residencialID || '',
    residencialDocId: '', // Asignar el valor correcto si existe
    houseNumber: usuario.houseNumber?.toString() || '',
    createdAt,
    updatedAt,
    paternalLastName: usuario.paternalLastName || '',
    maternalLastName: usuario.maternalLastName || '',
    doNotDisturb: usuario.notificationSettings?.doNotDisturb || false,
    doNotDisturbStart,
    doNotDisturbEnd
  };
}

/**
 * Convierte un objeto UserModel a Usuario de Firestore
 */
export function userModelToUsuario(userModel: UserModel): Omit<Usuario, 'id'> {
  // Convertir Dates a Timestamps
  const createdAt = userModel.createdAt ? Timestamp.fromDate(userModel.createdAt) : null;
  const updatedAt = userModel.updatedAt ? Timestamp.fromDate(userModel.updatedAt) : null;

  // Mapear el enum UserRole a string
  let role: 'admin' | 'resident' | 'security' | 'guest';
  switch (userModel.role) {
    case UserRole.Admin:
      role = 'admin';
      break;
    case UserRole.Guard:
      role = 'security';
      break;
    case UserRole.Resident:
      role = 'resident';
      break;
    default:
      role = 'resident';
  }

  return {
    uid: userModel.uid,
    email: userModel.email,
    fullName: userModel.fullName,
    paternalLastName: userModel.paternalLastName || '',
    maternalLastName: userModel.maternalLastName || '',
    telefono: '', // Puedes asignar un valor predeterminado
    role,
    residencialID: userModel.residencialId,
    houseNumber: userModel.houseNumber,
    status: userModel.status as 'pending' | 'approved' | 'rejected' | 'inactive',
    createdAt,
    updatedAt,
    notificationSettings: {
      doNotDisturb: userModel.doNotDisturb || false,
      doNotDisturbStart: userModel.doNotDisturbStart ? userModel.doNotDisturbStart.toISOString() : '',
      doNotDisturbEnd: userModel.doNotDisturbEnd ? userModel.doNotDisturbEnd.toISOString() : '',
      emergencies: true,
      events: true,
      packages: true,
      visitors: true
    },
    lastSignInTime: null,
    lastRefreshTime: null,
    signInProvider: ''
  };
} 