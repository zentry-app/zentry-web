import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialReconciliationScreen } from '../FinancialReconciliationScreen';
import { WebERPService, WebBankTransaction, WebPaymentIntent } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService', () => {
    return {
        WebERPService: class {
            getUnreconciledBankTransactions = vi.fn();
            getPendingValidations = vi.fn();
            executeAutoMatch = vi.fn();
            executeManualMatch = vi.fn();
        }
    };
});

describe('FinancialReconciliationScreen', () => {
    let mockService: any;

    const mockTx: WebBankTransaction = {
        id: 'tx-1',
        date: '2026-03-08T10:00:00.000Z',
        description: 'DEPOSITO BANCARIO',
        amountCents: 150000,
        referenceKey: 'REF-TX-1',
        type: 'deposit',
        reconciliationStatus: 'unreconciled',
        isUnidentifiedDeposit: false
    };

    const mockIntent: WebPaymentIntent = {
        id: 'pi-1',
        houseId: 'h-1',
        houseLabel: 'Lote 1',
        residentId: 'r-1',
        residentName: 'Juan Perez',
        amountCents: 150000,
        date: '2026-03-08T12:00:00.000Z',
        method: 'transfer',
        referenceNumber: 'REF-TX-1',
        status: 'pending_validation',
        reconciliationStatus: 'unreconciled',
        proofUrl: null,
        folio: null
    };

    const mockIntentDiffAmount: WebPaymentIntent = {
        ...mockIntent,
        id: 'pi-2',
        amountCents: 80000
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = new WebERPService();
        mockService.getUnreconciledBankTransactions.mockResolvedValue([mockTx]);
        mockService.getPendingValidations.mockResolvedValue([mockIntent, mockIntentDiffAmount]);
    });

    it('should render split view and data correctly', async () => {
        render(<FinancialReconciliationScreen service={mockService} residencialId="RES-1" />);

        expect(screen.getByText('Cargando datos de conciliación...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Movimientos Bancarios (1)')).toBeInTheDocument();
            expect(screen.getByText('Intenciones de Pago (2)')).toBeInTheDocument();
        });

        expect(screen.getByText('DEPOSITO BANCARIO')).toBeInTheDocument();
        expect(screen.getAllByText(/Juan Perez/i)[0]).toBeInTheDocument();
    });

    it('should show matching panel and allow manual match on identical amounts', async () => {
        mockService.executeManualMatch.mockResolvedValue({ success: true });

        render(<FinancialReconciliationScreen service={mockService} residencialId="RES-1" />);

        const txElement = await screen.findByText('DEPOSITO BANCARIO');
        const piElements = await screen.findAllByText(/Juan Perez/i);
        const piElement = piElements[0];

        fireEvent.click(txElement);
        fireEvent.click(piElement);

        expect(screen.getByText('Evaluación de Match')).toBeInTheDocument();
        expect(screen.getByText('✅ Montos coinciden exactamente')).toBeInTheDocument();

        const matchButton = screen.getByRole('button', { name: /Confirmar Match Manual/i });
        expect(matchButton).not.toBeDisabled();

        fireEvent.click(matchButton);

        await waitFor(() => {
            expect(mockService.executeManualMatch).toHaveBeenCalledWith('RES-1', 'tx-1', 'pi-1');
        });
    });

    it('should disable manual match when amounts mismatch', async () => {
        render(<FinancialReconciliationScreen service={mockService} residencialId="RES-1" />);

        const txElement = await screen.findByText('DEPOSITO BANCARIO');
        fireEvent.click(txElement);

        // Click the intent that has $800 instead of $1500
        const piDiffElements = await screen.findAllByText((content, element) => {
            return content.startsWith('$800.00');
        });
        fireEvent.click(piDiffElements[0]);

        expect(screen.getByText('❌ Diferencia en montos')).toBeInTheDocument();

        const matchButton = screen.getByRole('button', { name: /Confirmar Match Manual/i });
        expect(matchButton).toBeDisabled();
    });

    it('should call auto-match when button is clicked', async () => {
        mockService.executeAutoMatch.mockResolvedValue({ success: true, matchedCount: 1, unmatchedCount: 0 });

        render(<FinancialReconciliationScreen service={mockService} residencialId="RES-1" />);

        const autoMatchBtn = await screen.findByRole('button', { name: /Ejecutar Auto-Match 1:1/i });
        fireEvent.click(autoMatchBtn);

        await waitFor(() => {
            expect(mockService.executeAutoMatch).toHaveBeenCalledWith('RES-1', 2);
            expect(screen.getByText('Auto-match completado. 1 coincidencias exactas encontradas. 0 pendientes.')).toBeInTheDocument();
        });
    });
});
