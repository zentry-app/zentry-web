export interface UserProfile {
  id: string;
  nombre: string;
  curp: string;
  nss: string;
  email: string;
  telefono: string;
  role: 'admin' | 'user' | 'asesor' | 'patron';
  createdAt: Date;
  updatedAt: Date;
}

export interface PensionData {
  semanasCotizadas: number;
  salarioPromedio: number;
  edad: number;
  fechaNacimiento: string;
  modalidad40: boolean;
} 