import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingOverview from '../BillingOverview';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('BillingOverview', () => {
    const mockResidencialId = 'res-123';
    let mockService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            getBillingOverview: vi.fn()
        };
        (WebERPService as any).prototype.getBillingOverview = mockService.getBillingOverview;
    });

    it('renders loading state initially', () => {
        mockService.getBillingOverview.mockReturnValue(new Promise(() => { })); // Never resolves
        render(<BillingOverview residencialId={mockResidencialId} />);
        expect(screen.getByTestId('billing-overview-loading')).toBeInTheDocument();
    });

    it('renders KPIs correctly after loading', async () => {
        const mockData = {
            recaudacionMesCents: 500000, // $5,000
            carteraVencidaCents: 250000, // $2,500
            proximoVencimiento: '2026-03-10'
        };
        mockService.getBillingOverview.mockResolvedValue(mockData);
        const expectedDueDate = new Intl.DateTimeFormat('es-MX', {
            day: 'numeric',
            month: 'long',
        }).format(new Date(mockData.proximoVencimiento));

        render(<BillingOverview residencialId={mockResidencialId} />);

        await waitFor(() => {
            expect(screen.getByText(/5,000/)).toBeInTheDocument();
            expect(screen.getByText(/2,500/)).toBeInTheDocument();
            expect(screen.getByText(expectedDueDate)).toBeInTheDocument();
        });
    });

    it('renders error state if service fails', async () => {
        mockService.getBillingOverview.mockRejectedValue(new Error('API Error'));
        render(<BillingOverview residencialId={mockResidencialId} />);

        await waitFor(() => {
            expect(screen.getByText(/error al cargar el resumen/i)).toBeInTheDocument();
        });
    });
});
