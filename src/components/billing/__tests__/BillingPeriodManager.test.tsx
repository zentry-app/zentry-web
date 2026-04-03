import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingPeriodManager from '../BillingPeriodManager';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('BillingPeriodManager', () => {
    const mockResidencialId = 'res-123';
    let mockService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            getBillingPeriods: vi.fn(),
            generatePeriodDraft: vi.fn(),
            publishPeriod: vi.fn(),
            getBillingPeriodPreview: vi.fn()
        };
        (WebERPService as any).prototype.getBillingPeriods = mockService.getBillingPeriods;
        (WebERPService as any).prototype.generatePeriodDraft = mockService.generatePeriodDraft;
        (WebERPService as any).prototype.publishPeriod = mockService.publishPeriod;
        (WebERPService as any).prototype.getBillingPeriodPreview = mockService.getBillingPeriodPreview;
    });

    it('renders list of periods', async () => {
        mockService.getBillingPeriods.mockResolvedValue([
            { id: '2026-03', name: 'Marzo 2026', status: 'published', totalExpectedCents: 1500000, totalCollectedCents: 0, createdAt: '2026-03-01T00:00:00Z' }
        ]);

        render(<BillingPeriodManager residencialId={mockResidencialId} />);

        await waitFor(() => {
            expect(screen.getByText('Marzo 2026')).toBeInTheDocument();
            expect(screen.getByText(/publicado/i)).toBeInTheDocument();
        });
    });

    it('opens side panel in "create" mode when clicking New Period', async () => {
        mockService.getBillingPeriods.mockResolvedValue([]);
        render(<BillingPeriodManager residencialId={mockResidencialId} />);

        const newPeriodBtn = await waitFor(() => screen.getByText(/Nuevo Periodo/i));
        fireEvent.click(newPeriodBtn);

        // It should pass the mode to the slideover (which we can check by looking for the Title in the slideover)
        expect(screen.getByText(/Configurar Nuevo Periodo/i)).toBeInTheDocument();
    });

    it('opens side panel in "preview" mode when clicking a draft period', async () => {
        mockService.getBillingPeriods.mockResolvedValue([
            { id: '2026-04', name: 'Abril 2026', status: 'draft', totalExpectedCents: 1500000, totalCollectedCents: 0, createdAt: '2026-04-01T00:00:00Z' }
        ]);

        render(<BillingPeriodManager residencialId={mockResidencialId} />);

        await waitFor(() => {
            const draftRow = screen.getByText(/Abril 2026/i);
            fireEvent.click(draftRow);
        });

        expect(screen.getByText(/Revisar Borrador/i)).toBeInTheDocument();
        expect(screen.getByText(/BORRADOR: No afecta el ledger hasta publicar/i)).toBeInTheDocument();
    });

    it('can publish a draft period', async () => {
        mockService.getBillingPeriods.mockResolvedValue([
            { id: '2026-04', name: 'Abril 2026', status: 'draft', totalExpectedCents: 1500000, totalCollectedCents: 0, createdAt: '2026-04-01T00:00:00Z' }
        ]);
        mockService.publishPeriod.mockResolvedValue({ success: true });

        render(<BillingPeriodManager residencialId={mockResidencialId} />);

        await waitFor(() => fireEvent.click(screen.getByText(/abril 2026/i)));

        const publishButton = screen.getByText(/Publicar Periodo/i);
        fireEvent.click(publishButton);

        await waitFor(() => {
            // Should show confirmation first
            expect(screen.getByText(/¿Confirmar Publicación?/i)).toBeInTheDocument();
        });
    });
});
