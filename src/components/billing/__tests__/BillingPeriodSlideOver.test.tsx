import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingPeriodSlideOver from '../BillingPeriodSlideOver';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('BillingPeriodSlideOver', () => {
    const mockResidencialId = 'res-123';
    let mockService: any;
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            generatePeriodDraft: vi.fn(),
            publishPeriod: vi.fn(),
        };
        (WebERPService as any).prototype.generatePeriodDraft = mockService.generatePeriodDraft;
        (WebERPService as any).prototype.publishPeriod = mockService.publishPeriod;
    });

    it('renders "Create" mode correctly', () => {
        render(
            <BillingPeriodSlideOver
                isOpen={true}
                mode="create"
                residencialId={mockResidencialId}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText(/Configurar Nuevo Periodo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre del Periodo/i)).toBeInTheDocument();
        expect(screen.getByText(/Generar Borrador/i)).toBeInTheDocument();
    });

    it('renders "Preview" mode with explicit draft warning', () => {
        const mockPeriod = { id: '2026-04', name: 'Abril 2026', status: 'draft' as const };

        render(
            <BillingPeriodSlideOver
                isOpen={true}
                mode="preview"
                period={mockPeriod}
                residencialId={mockResidencialId}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText(/Revisar Borrador/i)).toBeInTheDocument();
        expect(screen.getByText(/BORRADOR: No afecta el ledger hasta publicar/i)).toBeInTheDocument();
        expect(screen.getByText(/Publicar Periodo/i)).toBeInTheDocument();
    });

    it('shows reinforced confirmation before publishing', async () => {
        const mockPeriod = { id: '2026-04', name: 'Abril 2026', status: 'draft' as const };

        render(
            <BillingPeriodSlideOver
                isOpen={true}
                mode="preview"
                period={mockPeriod}
                residencialId={mockResidencialId}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText(/Publicar Periodo/i));

        expect(screen.getByText(/¿Confirmar Publicación?/i)).toBeInTheDocument();
        expect(screen.getByText(/Esta acción generará cargos reales en el ledger/i)).toBeInTheDocument();
    });

    it('calls publish API after reinforced confirmation', async () => {
        const mockPeriod = { id: '2026-04', name: 'Abril 2026', status: 'draft' as const };
        mockService.publishPeriod.mockResolvedValue({ success: true });

        render(
            <BillingPeriodSlideOver
                isOpen={true}
                mode="preview"
                period={mockPeriod}
                residencialId={mockResidencialId}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Open confirmation
        fireEvent.click(screen.getByText(/Publicar Periodo/i));

        // Confirm
        fireEvent.click(screen.getByText(/Sí, generar cargos reales/i));

        await waitFor(() => {
            expect(mockService.publishPeriod).toHaveBeenCalledWith(mockResidencialId, '2026-04');
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});
