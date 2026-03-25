import { describe, it, expect } from 'vitest';
import { convertToCSV } from '../exportUtils';

describe('exportUtils', () => {
    const mockData = [
        {
            houseId: 'LOTE-101',
            residentPrimaryName: 'Juan Perez',
            totalBalanceCents: 15000,
            overdueBalanceCents: 10000,
            dominantAgingBucket: '30_days',
            lastPaymentDate: '2026-03-01',
        },
    ];

    it('should convert house data to CSV string with correct headers', () => {
        const csv = convertToCSV(mockData);

        expect(csv).toContain('Propiedad,Residente,Saldo Total,Saldo Vencido,Aging,Ultimo Pago');
        expect(csv).toContain('LOTE-101,Juan Perez,150.00,100.00,1-30,2026-03-01');
    });

    it('should handle empty data safely', () => {
        const csv = convertToCSV([]);
        expect(csv).toContain('Propiedad,Residente,Saldo Total,Saldo Vencido,Aging,Ultimo Pago');
    });
});
