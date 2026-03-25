import * as xlsx from 'xlsx';
import { Usuario } from '../firebase/firestore';

export const convertToCSV = (houses: any[]) => {
  const headers = ['Propiedad', 'Residente', 'Saldo Total', 'Saldo Vencido', 'Aging', 'Ultimo Pago'];

  const agingLabels: Record<string, string> = {
    current: 'Al día',
    '30_days': '1-30',
    '60_days': '31-60',
    '90_days': '61-90',
    plus_90: '91+',
  };

  const rows = houses.map(h => [
    h.houseId,
    h.residentPrimaryName,
    (h.totalBalanceCents / 100).toFixed(2),
    (h.overdueBalanceCents / 100).toFixed(2),
    agingLabels[h.dominantAgingBucket] || h.dominantAgingBucket,
    h.lastPaymentDate ? new Date(h.lastPaymentDate).toISOString().split('T')[0] : '-'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportUsersToExcel = (
  usuarios: Usuario[],
  getResidencialNombre: (id: string) => string,
  filename: string = 'usuarios_zentry.xlsx'
) => {
  const data = usuarios.map(u => ({
    'Nombre Completo': `${u.fullName || ''} ${u.paternalLastName || ''} ${u.maternalLastName || ''}`.trim(),
    'Email': u.email || '',
    'Teléfono': u.telefono || '',
    'Rol': u.role === 'admin' ? 'Administrador' : u.role === 'resident' ? 'Residente' : u.role === 'security' ? 'Seguridad' : u.role,
    'Estado': u.status === 'approved' ? 'Activo' : u.status === 'pending' ? 'Pendiente' : u.status === 'rejected' ? 'Rechazado' : 'Inactivo',
    'Residencial': getResidencialNombre(u.residencialID),
    'Calle': u.calle || '',
    'Número': u.houseNumber || '',
    'HID': u.houseID || '',
    'Restringido (Moroso)': (u as any).isMoroso ? 'SÍ' : 'NO'
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
  
  // Generar archivo y descargar
  xlsx.writeFile(workbook, filename);
};