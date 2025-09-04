import { Ingreso } from '@/types/ingresos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para convertir timestamp a fecha legible
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return '';
  }
};

// Función para limpiar texto para CSV
const cleanTextForCSV = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toString().replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ');
};

// Función para obtener el nombre del visitante
const getVisitorName = (ingreso: Ingreso): string => {
  return ingreso.visitData?.name || 'Sin nombre';
};

// Función para obtener información del vehículo
const getVehicleInfo = (ingreso: Ingreso): string => {
  if (!ingreso.vehicleInfo) return 'Sin vehículo';
  const { placa, marca, modelo, color } = ingreso.vehicleInfo;
  return `${placa} - ${marca} ${modelo} (${color})`;
};

// Función para obtener dirección completa
const getFullAddress = (ingreso: Ingreso): string => {
  const { calle, houseNumber } = ingreso.domicilio;
  return `${calle} #${houseNumber}`;
};

// Función para obtener información del pase físico
const getPhysicalPassInfo = (ingreso: Ingreso): string => {
  if (!ingreso.physicalPass?.delivered) return 'Sin pase';
  const pass = ingreso.physicalPass;
  let info = `Pase #${pass.number}`;
  if (pass.returned) info += ' (Devuelto)';
  else if (ingreso.passLost) info += ' (Perdido)';
  else info += ' (No devuelto)';
  return info;
};

// Función para obtener categoría legible
const getCategoryLabel = (category: string): string => {
  const labels: { [key: string]: string } = {
    'temporal': 'Temporal',
    'evento': 'Evento',
    'visita': 'Visita',
    'paquete': 'Paquete',
    'servicio': 'Servicio',
    'delivery': 'Delivery',
    'mantenimiento': 'Mantenimiento',
  };
  return labels[category] || category;
};

// Función para obtener estado legible
const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    'active': 'Activo',
    'completed': 'Completado',
    'pending': 'Pendiente',
    'cancelled': 'Cancelado',
    'rejected': 'Rechazado',
  };
  return labels[status] || status;
};

// Interfaz para datos de exportación
interface ExportData {
  'Fecha Ingreso': string;
  'Fecha Salida': string;
  'Visitante': string;
  'Categoría': string;
  'Estado': string;
  'Dirección': string;
  'Residencial': string;
  'Vehículo': string;
  'Placa': string;
  'Método Entrada': string;
  'Código Acceso': string;
  'Pase Físico': string;
  'Registrado Por': string;
  'ID Documento': string;
  'Visitante Frecuente': string;
  'Rechazado': string;
  'Motivo Rechazo': string;
}

// Función para convertir ingresos a datos de exportación
export const convertIngresosToExportData = (
  ingresos: Ingreso[], 
  getResidencialNombre: (docId: string | undefined) => string
): ExportData[] => {
  return ingresos.map(ingreso => ({
    'Fecha Ingreso': formatTimestamp(ingreso.timestamp),
    'Fecha Salida': formatTimestamp(ingreso.exitTimestamp),
    'Visitante': cleanTextForCSV(getVisitorName(ingreso)),
    'Categoría': getCategoryLabel(ingreso.category),
    'Estado': getStatusLabel(ingreso.status),
    'Dirección': cleanTextForCSV(getFullAddress(ingreso)),
    'Residencial': cleanTextForCSV(getResidencialNombre(ingreso._residencialDocId)),
    'Vehículo': cleanTextForCSV(getVehicleInfo(ingreso)),
    'Placa': cleanTextForCSV(ingreso.vehicleInfo?.placa || ''),
    'Método Entrada': cleanTextForCSV(ingreso.entryMethod?.replace(/_/g, ' ') || ''),
    'Código Acceso': cleanTextForCSV(ingreso.codigoAcceso || ''),
    'Pase Físico': cleanTextForCSV(getPhysicalPassInfo(ingreso)),
    'Registrado Por': cleanTextForCSV(ingreso.registradoPor?.substring(0, 10) || ''),
    'ID Documento': cleanTextForCSV(ingreso.visitData?.idNumber || ''),
    'Visitante Frecuente': ingreso.isFrequentVisitor ? 'Sí' : 'No',
    'Rechazado': ingreso.rejected ? 'Sí' : 'No',
    'Motivo Rechazo': cleanTextForCSV(ingreso.rejectionInfo?.reason || ''),
  }));
};

// Función para exportar a CSV
export const exportToCSV = (
  ingresos: Ingreso[], 
  getResidencialNombre: (docId: string | undefined) => string,
  filename?: string
): void => {
  const data = convertIngresosToExportData(ingresos, getResidencialNombre);
  
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Crear encabezados
  const headers = Object.keys(data[0]);
  
  // Crear contenido CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header as keyof ExportData]}"`).join(',')
    )
  ].join('\n');

  // Crear y descargar archivo
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `ingresos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Función para exportar a JSON (para debugging o APIs)
export const exportToJSON = (
  ingresos: Ingreso[], 
  getResidencialNombre: (docId: string | undefined) => string,
  filename?: string
): void => {
  const data = convertIngresosToExportData(ingresos, getResidencialNombre);
  
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `ingresos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Función para copiar datos al portapapeles (formato tabla)
export const copyToClipboard = async (
  ingresos: Ingreso[], 
  getResidencialNombre: (docId: string | undefined) => string
): Promise<boolean> => {
  try {
    const data = convertIngresosToExportData(ingresos, getResidencialNombre);
    
    if (data.length === 0) {
      return false;
    }

    // Crear formato de tabla para el portapapeles
    const headers = Object.keys(data[0]);
    const tableContent = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(header => row[header as keyof ExportData]).join('\t')
      )
    ].join('\n');

    await navigator.clipboard.writeText(tableContent);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Función para generar estadísticas de exportación
export const getExportStats = (ingresos: Ingreso[]) => {
  const total = ingresos.length;
  const byCategory = ingresos.reduce((acc, ingreso) => {
    const category = getCategoryLabel(ingreso.category);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = ingresos.reduce((acc, ingreso) => {
    const status = getStatusLabel(ingreso.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const withVehicle = ingresos.filter(i => i.vehicleInfo).length;
  const withPhysicalPass = ingresos.filter(i => i.physicalPass?.delivered).length;
  const rejected = ingresos.filter(i => i.rejected).length;

  return {
    total,
    byCategory,
    byStatus,
    withVehicle,
    withPhysicalPass,
    rejected,
    rejectionRate: total > 0 ? (rejected / total * 100).toFixed(1) : '0'
  };
}; 