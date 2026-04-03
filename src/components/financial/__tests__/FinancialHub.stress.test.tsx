import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinancialReconciliationGrid, AgingBucketKey } from '../FinancialReconciliationGrid';
import { convertToCSV } from '@/lib/utils/exportUtils';

// Helper to generate a massive data payload
const generateLargeDataset = (count: number) => {
    const data = [];
    const buckets: AgingBucketKey[] = ['current', '30_days', '60_days', '90_days', 'plus_90'];

    for (let i = 0; i < count; i++) {
        const isMoroso = i % 2 !== 0; // Half elements are morosos
        data.push({
            houseId: `LOTE-${100 + i}`,
            residentPrimaryName: `Residente de Prueba ${i}`,
            totalBalanceCents: isMoroso ? Math.floor(Math.random() * 50000) + 1000 : 0,
            overdueBalanceCents: isMoroso ? Math.floor(Math.random() * 40000) + 1000 : 0,
            dominantAgingBucket: isMoroso ? buckets[Math.floor(Math.random() * 4) + 1] : 'current',
            lastPaymentDate: '2026-03-01',
            lastPaymentFolio: `F-${1000 + i}`,
            isMoroso,
        });
    }
    return data;
};

describe('Financial High-Density Stress Test', () => {
    const massiveData = generateLargeDataset(100);

    it('renders 100 houses smoothly without crashing given a large dataset', () => {
        const startTime = performance.now();
        render(<FinancialReconciliationGrid houses={massiveData} isLoading={false} onOpenLedger={vi.fn()} />);

        // Validate rendered items
        expect(screen.getByText('LOTE-100')).toBeDefined();
        expect(screen.getByText('LOTE-199')).toBeDefined();

        // Use a broad guardrail since jsdom timing varies significantly across environments.
        const renderTime = performance.now() - startTime;
        console.log(`[Stress Test] Grid render time for 100 rows: ${renderTime.toFixed(2)}ms`);
        expect(renderTime).toBeLessThan(5000);
    });

    it('handles CSV export of 100+ items efficiently', () => {
        const startTime = performance.now();
        const csvContent = convertToCSV(massiveData);

        // Validate CSV creation
        expect(csvContent).toContain('LOTE-100');
        expect(csvContent).toContain('LOTE-199');

        // Each row + header
        const csvLines = csvContent.split('\n');
        expect(csvLines.length).toBe(101);

        const exportTime = performance.now() - startTime;
        console.log(`[Stress Test] CSV Export time for 100 rows: ${exportTime.toFixed(2)}ms`);
        expect(exportTime).toBeLessThan(50); // CSV processing should be near instant
    });
});
