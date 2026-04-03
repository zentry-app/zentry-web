import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinancialSummaryCards } from '../FinancialSummaryCards';

describe('FinancialSummaryCards', () => {
    const mockStats = {
        facturadoBruto: 100000,
        cobradoNeto: 80000,
        pendientePeriodo: 20000,
        pagosEnValidacion: 5000,
    };

    it('should render core financial metrics correctly', () => {
        render(<FinancialSummaryCards stats={mockStats} isLoading={false} error={null} />);

        // Check for currency formatting (assuming a helper exists or inline)
        // $1,000.00 MXN for 100000 cents
        expect(screen.getByText(/facturado/i)).toBeDefined();
        expect(screen.getByText(/\$1,000\.00/)).toBeDefined();

        expect(screen.getByText(/cobrado/i)).toBeDefined();
        expect(screen.getByText(/\$800\.00/)).toBeDefined();

        expect(screen.getByText(/pendiente/i)).toBeDefined();
        expect(screen.getByText(/\$200\.00/)).toBeDefined();
    });

    it('should render operational metrics separately', () => {
        render(<FinancialSummaryCards stats={mockStats} isLoading={false} error={null} />);

        expect(screen.getByText(/en validación/i)).toBeDefined();
        expect(screen.getByText(/5,000/)).toBeDefined(); // Counts are usually integers, not currency
    });

    it('should show N/A for degraded operational state', () => {
        const degradedStats = { ...mockStats, pagosEnValidacion: null };
        render(<FinancialSummaryCards stats={degradedStats} isLoading={false} error={null} />);

        expect(screen.getByText(/en validación/i)).toBeDefined();
        expect(screen.getByText(/N\/A/i)).toBeDefined();
    });

    it('should show skeletons during loading state', () => {
        render(<FinancialSummaryCards stats={null} isLoading={true} error={null} />);

        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show error message in error state', () => {
        render(<FinancialSummaryCards stats={null} isLoading={false} error="Error al cargar métricas" />);

        expect(screen.getByText(/error al cargar métricas/i)).toBeDefined();
    });
});
