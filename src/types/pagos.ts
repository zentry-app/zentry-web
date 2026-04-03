// Tipos para la gestión de pagos con la nueva estructura de Firestore

export interface PaymentMethodDetails {
  brand: string; // "VISA", "MasterCard", etc.
  exp_month: number; // Mes de expiración
  exp_year: number; // Año de expiración
  funding: string; // "credit", "debit", etc.
  last4: string; // Últimos 4 dígitos de la tarjeta
}

export interface UserAddress {
  calle: string;
  houseNumber: string;
  pais: string;
  residencialID: string;
}

// Timestamp de Firestore
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Pago {
  id?: string; // ID del documento de Firestore
  amount: number; // Monto del pago
  currency: string; // "MXN", "USD", etc.
  description: string; // Descripción del pago
  paymentIntentId: string; // ID de Stripe
  paymentMethod: string; // "VISA ****4242", etc.
  paymentMethodDetails: PaymentMethodDetails; // Detalles de la tarjeta
  residentialId: string; // ID del residencial
  status: "completed" | "pending" | "failed" | "cancelled"; // Estado del pago
  timestamp: FirestoreTimestamp | Date | string; // Fecha del pago
  userAddress: UserAddress; // Dirección del usuario
  userEmail: string; // Email del usuario
  userId: string; // UID del usuario
  userName: string; // Nombre del usuario
  
  // Campos internos para la UI
  _residencialNombre?: string; // Nombre del residencial (para mostrar en UI)
  _residencialDocId?: string; // ID del documento del residencial
}

// Función helper para convertir datos crudos de Firestore a tipo Pago
export const convertirDatosPago = (data: any, docId: string): Pago => {
  // Log para debugging - solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Convirtiendo pago ${docId}:`, data);
  }

  const pagoConvertido = {
    id: docId,
    amount: data.amount || 0,
    currency: data.currency || "MXN",
    description: data.description || "",
    paymentIntentId: data.paymentIntentId || "",
    paymentMethod: data.paymentMethod || "",
    paymentMethodDetails: {
      brand: data.paymentMethodDetails?.brand || "",
      exp_month: data.paymentMethodDetails?.exp_month || 0,
      exp_year: data.paymentMethodDetails?.exp_year || 0,
      funding: data.paymentMethodDetails?.funding || "",
      last4: data.paymentMethodDetails?.last4 || ""
    },
    residentialId: data.residentialId || "",
    status: data.status || "pending",
    timestamp: data.timestamp,
    userAddress: {
      calle: data.userAddress?.calle || "",
      houseNumber: data.userAddress?.houseNumber || "",
      pais: data.userAddress?.pais || "",
      residencialID: data.userAddress?.residencialID || ""
    },
    userEmail: data.userEmail || "",
    userId: data.userId || "",
    userName: data.userName || ""
  };

  // Log del resultado - solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Pago convertido ${docId}:`, pagoConvertido);
    
    // Verificar específicamente la dirección
    if (!pagoConvertido.userAddress.calle || !pagoConvertido.userAddress.houseNumber) {
      console.warn(`⚠️ Faltan datos de dirección en pago ${docId}:`, {
        calle: pagoConvertido.userAddress.calle,
        houseNumber: pagoConvertido.userAddress.houseNumber,
        datosOriginales: data.userAddress
      });
    }
  }

  return pagoConvertido;
};

// Helper para convertir Timestamp de Firestore a Date
export const convertFirestoreTimestampToDate = (timestamp: FirestoreTimestamp | Date | string): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  // Fallback si el formato no es el esperado
  console.warn("Timestamp inesperado, usando fecha actual como fallback:", timestamp);
  return new Date(); 
}; 