import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, 'dd/MM/yyyy', { locale: es });
}

export function parseDate(dateString: string): Date {
  return parse(dateString, 'dd/MM/yyyy', new Date());
} 