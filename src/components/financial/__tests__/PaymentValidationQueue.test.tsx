import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentValidationQueue } from '../PaymentValidationQueue';
import { WebERPService, WebPaymentIntent } from '@/lib/services/WebERPService';

// Mock the service
vi.mock('@/lib/services/WebERPService', () => {
    return {
        WebERPService: class {
            getPendingValidations = vi.fn();
            validatePayment = vi.fn();
            rejectPayment = vi.fn();
            reversePayment = vi.fn();
        }
    };
});

describe('PaymentValidationQueue', () => {
    let mockService: any;
    const mockIntents: WebPaymentIntent[] = [
        {
            id: 'PI-101',
            houseId: 'LOTE-101',
            houseLabel: 'Lote 101',
            residentId: 'RES-1',
            residentName: 'Juan Perez',
            amountCents: 150000,
            date: '2026-03-08T10:00:00.000Z',
            method: 'transfer',
            referenceNumber: 'ABC123XYZ',
            status: 'pending_validation',
            reconciliationStatus: 'unreconciled',
            proofUrl: 'http://example.com/receipt.jpg',
            folio: null
        },
        {
            id: 'PI-102',
            houseId: 'LOTE-102',
            houseLabel: 'Lote 102',
            residentId: 'RES-2',
            residentName: 'Maria Lopez',
            amountCents: 80000,
            date: '2026-03-07T12:00:00.000Z',
            method: 'cash',
            referenceNumber: null,
            status: 'validated',
            reconciliationStatus: 'unreconciled',
            proofUrl: null,
            folio: 'F-8899'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = new WebERPService();
        mockService.getPendingValidations.mockResolvedValue([mockIntents[0]]);
    });

    it('should query and render pending intents in the grid', async () => {
        render(<PaymentValidationQueue service={mockService} residencialId="RES-1" />);

        expect(screen.getByText('Cargando validaciones...')).toBeInTheDocument();

        expect(await screen.findByText('Lote 101')).toBeInTheDocument();
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
        expect(screen.getByText(/1500\.00/)).toBeInTheDocument();
        expect(screen.getByText('transfer')).toBeInTheDocument();
    });

    it('should open slide-over when Review action is clicked', async () => {
        render(<PaymentValidationQueue service={mockService} residencialId="RES-1" />);

        await waitFor(() => {
            expect(screen.getByText('Lote 101')).toBeInTheDocument();
        });

        const reviewButton = screen.getByRole('button', { name: /Revisar/i });
        fireEvent.click(reviewButton);

        // Slide Over should appear
        expect(screen.getByText('Detalle de Validación')).toBeInTheDocument();
        expect(screen.getByText('Comprobante Adjunto')).toBeInTheDocument();
    });

    it('should successfully validate a payment via the slide-over', async () => {
        mockService.validatePayment.mockResolvedValue({ success: true, folio: 'F-999' });

        render(<PaymentValidationQueue service={mockService} residencialId="RES-1" />);

        await waitFor(() => {
            expect(screen.getByText('Lote 101')).toBeInTheDocument();
        });

        // Open slide over
        fireEvent.click(screen.getByRole('button', { name: /Revisar/i }));

        // Click validate inside slide over
        const validateBtn = screen.getByRole('button', { name: /Aprobar Pago/i });
        fireEvent.click(validateBtn);

        await waitFor(() => {
            expect(mockService.validatePayment).toHaveBeenCalledWith('RES-1', 'PI-101');
            // Assuming we refetch or remove from list on success
        });
    });

    it('should successfully reject a payment via the slide-over', async () => {
        mockService.rejectPayment.mockResolvedValue({ success: true });

        render(<PaymentValidationQueue service={mockService} residencialId="RES-1" />);

        await waitFor(() => expect(screen.getByText('Lote 101')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /Revisar/i }));

        // Reject usually requires a reason
        const rejectTrigger = screen.getByRole('button', { name: /Rechazar/i });
        fireEvent.click(rejectTrigger);

        const reasonInput = screen.getByPlaceholderText(/Motivo/i);
        fireEvent.change(reasonInput, { target: { value: 'Borroso' } });

        const confirmReject = screen.getByRole('button', { name: /Confirmar Rechazo/i });
        fireEvent.click(confirmReject);

        await waitFor(() => {
            expect(mockService.rejectPayment).toHaveBeenCalledWith('RES-1', 'PI-101', 'Borroso');
        });
    });

    it('should successfully reverse a validated payment via the slide-over', async () => {
        // Feed the component a validated intent
        mockService.getPendingValidations.mockResolvedValue([mockIntents[1]]);
        mockService.reversePayment.mockResolvedValue({ success: true });

        render(<PaymentValidationQueue service={mockService} residencialId="RES-1" />);

        await waitFor(() => expect(screen.getByText('Lote 102')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /Revisar/i }));

        // Reversal flow
        const reverseTrigger = screen.getByRole('button', { name: /Revertir/i });
        fireEvent.click(reverseTrigger);

        const reasonInput = screen.getByPlaceholderText(/Motivo de reversa/i);
        fireEvent.change(reasonInput, { target: { value: 'Rebote bancario' } });

        const confirmReverse = screen.getByRole('button', { name: /Confirmar Reversa/i });
        fireEvent.click(confirmReverse);

        await waitFor(() => {
            expect(mockService.reversePayment).toHaveBeenCalledWith('RES-1', 'PI-102', 'Rebote bancario');
        });
    });
});
