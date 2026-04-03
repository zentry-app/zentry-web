import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReconciliationExportPanel } from '../ReconciliationExportPanel';
import { WebERPService, WebBankTransaction } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService', () => {
    return {
        WebERPService: class {
            getReconciledBankTransactions = vi.fn();
        }
    };
});

describe('ReconciliationExportPanel', () => {
    let mockService: any;
    let originalCreateObjectURL: any;
    let originalAppendChild: any;
    let originalRemoveChild: any;

    const mockTxs: WebBankTransaction[] = [
        {
            id: 'tx-1',
            date: '2026-03-08T10:00:00.000Z',
            description: 'DEPOSITO',
            amountCents: 150000,
            referenceKey: 'REF-TX-1',
            type: 'deposit',
            reconciliationStatus: 'reconciled',
            isUnidentifiedDeposit: false,
            matchedPaymentIntentId: 'pi-1'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = new WebERPService();

        originalCreateObjectURL = URL.createObjectURL;
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');

        vi.spyOn(document.body, 'appendChild');
        vi.spyOn(document.body, 'removeChild');

        // mock alert
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    afterEach(() => {
        URL.createObjectURL = originalCreateObjectURL;
        vi.restoreAllMocks();
    });

    it('should show alert if no transactions are available to export', async () => {
        mockService.getReconciledBankTransactions.mockResolvedValue([]);
        render(<ReconciliationExportPanel service={mockService} residencialId="RES-1" />);

        const btn = screen.getByRole('button', { name: /Exportar CSV/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(mockService.getReconciledBankTransactions).toHaveBeenCalledWith('RES-1');
            expect(window.alert).toHaveBeenCalledWith('No hay transacciones conciliadas para exportar.');
        });
    });

    it('should generate and click download link if transactions exist', async () => {
        mockService.getReconciledBankTransactions.mockResolvedValue(mockTxs);
        render(<ReconciliationExportPanel service={mockService} residencialId="RES-1" />);

        const btn = screen.getByRole('button', { name: /Exportar CSV/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(mockService.getReconciledBankTransactions).toHaveBeenCalledWith('RES-1');
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(document.body.appendChild).toHaveBeenCalled();
            expect(document.body.removeChild).toHaveBeenCalled();
        });
    });
});
