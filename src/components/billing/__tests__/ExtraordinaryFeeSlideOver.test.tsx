import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExtraordinaryFeeSlideOver from '../ExtraordinaryFeeSlideOver';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('ExtraordinaryFeeSlideOver', () => {
    const mockResidencialId = 'res-123';
    const mockHouseId = 'house-ABC';
    let mockService: any;
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            createExtraordinaryFee: vi.fn(),
        };
        (WebERPService as any).prototype.createExtraordinaryFee = mockService.createExtraordinaryFee;
    });

    it('renders correctly when open', () => {
        render(
            <ExtraordinaryFeeSlideOver
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                residencialId={mockResidencialId}
                houseId={mockHouseId}
            />
        );

        expect(screen.getByText(/Cargo Extraordinario/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Monto \(MXN\)/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Descripción \/ Motivo/i)).toBeInTheDocument();
    });

    it('submits correctly with cents conversion', async () => {
        mockService.createExtraordinaryFee.mockResolvedValue({ success: true });

        render(
            <ExtraordinaryFeeSlideOver
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                residencialId={mockResidencialId}
                houseId={mockHouseId}
            />
        );

        fireEvent.change(screen.getByLabelText(/Monto \(MXN\)/i), { target: { value: '250.50' } });
        fireEvent.change(screen.getByLabelText(/Descripción \/ Motivo/i), { target: { value: 'Multa por ruido' } });

        fireEvent.click(screen.getByText(/Generar Cargo/i));

        await waitFor(() => {
            expect(mockService.createExtraordinaryFee).toHaveBeenCalledWith(
                mockResidencialId,
                mockHouseId,
                25050,
                'Multa por ruido'
            );
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('shows error if service fails', async () => {
        mockService.createExtraordinaryFee.mockRejectedValue(new Error('API Error'));

        render(
            <ExtraordinaryFeeSlideOver
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                residencialId={mockResidencialId}
                houseId={mockHouseId}
            />
        );

        fireEvent.change(screen.getByLabelText(/Monto \(MXN\)/i), { target: { value: '100' } });
        fireEvent.change(screen.getByLabelText(/Descripción \/ Motivo/i), { target: { value: 'Test' } });
        fireEvent.click(screen.getByText(/Generar Cargo/i));

        await waitFor(() => {
            expect(screen.getByText(/Error de conexión al procesar el cargo/i)).toBeInTheDocument();
        });
    });
});
