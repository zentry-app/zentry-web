import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HouseFeesView from '../HouseFeesView';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('HouseFeesView', () => {
    const mockResidencialId = 'res-123';
    const mockHouseId = 'house-ABC';
    let mockService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            getHouseFees: vi.fn(),
        };
        (WebERPService as any).prototype.getHouseFees = mockService.getHouseFees;
    });

    it('renders loading state initially', () => {
        mockService.getHouseFees.mockReturnValue(new Promise(() => { }));
        render(<HouseFeesView residencialId={mockResidencialId} houseId={mockHouseId} />);
        expect(screen.getByTestId('house-fees-loading')).toBeInTheDocument();
    });

    it('renders fees with types and operational statuses', async () => {
        const mockFees = [
            {
                id: 'fee-1',
                type: 'maintenance',
                amountCents: 150000,
                description: 'Cuota Marzo',
                dueDate: '2026-03-10T00:00:00Z',
                status: 'paid',
                operationalStatus: 'pagada'
            },
            {
                id: 'fee-2',
                type: 'late_penalty',
                amountCents: 20000,
                description: 'Recargo Marzo',
                dueDate: '2026-03-11T00:00:00Z',
                status: 'pending',
                operationalStatus: 'vencida'
            }
        ];
        mockService.getHouseFees.mockResolvedValue(mockFees);

        render(<HouseFeesView residencialId={mockResidencialId} houseId={mockHouseId} />);

        await waitFor(() => {
            // Types
            expect(screen.getByText(/Maintenance/)).toBeInTheDocument();
            expect(screen.getByText(/Late Penalty/)).toBeInTheDocument();

            // Statuses
            expect(screen.getByText(/Pagada/i)).toBeInTheDocument();
            expect(screen.getByText(/Vencida/i)).toBeInTheDocument();
        });
    });

    it('renders error state if service fails', async () => {
        mockService.getHouseFees.mockRejectedValue(new Error('API Error'));
        render(<HouseFeesView residencialId={mockResidencialId} houseId={mockHouseId} />);

        await waitFor(() => {
            expect(screen.getByText(/error al cargar el historial de cuotas/i)).toBeInTheDocument();
        });
    });
});
