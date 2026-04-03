import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/config'; // Corregir la ruta de importación a config.ts

const functions = getFunctions(app, 'us-central1'); // O la región donde desplegaste tus funciones

// Interfaz para los datos de entrada del formulario
export interface NewGuardiaData {
  nombre: string;
  email: string;
  password?: string; // La contraseña es opcional aquí porque puede que no la necesitemos para editar
  telefono: string;
  residencialId: string;
  residencialNombre: string;
  status?: 'active' | 'inactive' | 'pending'; // Añadir status como opcional
}

// Llama a la Cloud Function para crear un nuevo usuario de seguridad
export const createGuardia = async (data: NewGuardiaData) => {
  if (!data.password) {
    throw new Error("La contraseña es obligatoria para crear un nuevo guardia.");
  }
  
  const createSecurityUser = httpsCallable(functions, 'createSecurityUser');
  try {
    const result = await createSecurityUser(data);
    return result.data;
  } catch (error) {
    console.error("Error al llamar a la función createSecurityUser:", error);
    throw error;
  }
};

// Aquí podrías agregar más funciones en el futuro (ej. updateGuardia, deleteGuardia) 