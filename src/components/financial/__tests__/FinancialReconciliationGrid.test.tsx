import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinancialReconciliationGrid } from '../FinancialReconciliationGrid';

describe('FinancialReconciliationGrid', () => {
    const mockHouses = [
        {
            houseId: 'LOTE-101',
            residentPrimaryName: 'Juan Perez',
            totalBalanceCents: 15000,
            overdueBalanceCents: 10000,
            dominantAgingBucket: '30_days',
            lastPaymentDate: '2026-03-01',
            lastPaymentFolio: 'F-001',
            isMoroso: true,
        },
        {
            houseId: 'LOTE-102',
            residentPrimaryName: 'Maria Garcia',
            totalBalanceCents: 0,
            overdueBalanceCents: 0,
            dominantAgingBucket: 'current',
            lastPaymentDate: '2026-03-05',
            lastPaymentFolio: 'F-002',
            isMoroso: false,
        }
    ];

    it('should render house-centric rows correctly', () => {
        render(<FinancialReconciliationGrid houses={mockHouses} isLoading={false} onOpenLedger={vi.fn()} />);

        // House ID should be primary
        expect(screen.getByText('LOTE-101')).toBeDefined();
        expect(screen.getByText('LOTE-102')).toBeDefined();

        // Resident name should be secondary/associated
        expect(screen.getByText('Juan Perez')).toBeDefined();
    });

    it('should display the correct currency values', () => {
        render(<FinancialReconciliationGrid houses={mockHouses} isLoading={false} onOpenLedger={vi.fn()} />);

        expect(screen.getByText(/\$150\.00/)).toBeDefined();
        expect(screen.getByText(/\$0\.00/)).toBeDefined();
    });

    it('should show severity badges based on aging bucket', () => {
        render(<FinancialReconciliationGrid houses={mockHouses} isLoading={false} onOpenLedger={vi.fn()} />);

        expect(screen.getByText(/1-30/i)).toBeDefined();
        expect(screen.getByText(/al día/i)).toBeDefined();
    });

    it('should trigger onOpenLedger when a row is clicked', () => {
        const onOpenLedger = vi.fn();
        render(<FinancialReconciliationGrid houses={mockHouses} isLoading={false} onOpenLedger={onOpenLedger} />);

        const row = screen.getByText('LOTE-101').closest('tr');
        if (row) fireEvent.click(row);

        expect(onOpenLedger).toHaveBeenCalledWith('LOTE-101');
    });

    it('should show skeletons during loading state', () => {
        render(<FinancialReconciliationGrid houses={[]} isLoading={true} onOpenLedger={vi.fn()} />);

        const skeletons = screen.getAllByTestId('row-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
