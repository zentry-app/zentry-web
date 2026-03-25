import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BillingSettings from '../BillingSettings';
import { WebERPService } from '@/lib/services/WebERPService';

vi.mock('@/lib/services/WebERPService');

describe('BillingSettings', () => {
    const mockResidencialId = 'res-123';
    let mockService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = {
            getBillingSettings: vi.fn(),
            updateBillingSettings: vi.fn()
        };
        (WebERPService as any).prototype.getBillingSettings = mockService.getBillingSettings;
        (WebERPService as any).prototype.updateBillingSettings = mockService.updateBillingSettings;
    });

    it('loads and displays settings on mount', async () => {
        const mockSettings = {
            defaultMonthlyFeeCents: 150000,
            billingDayOfMonth: 1,
            dueDayOfMonth: 10,
            lateFeeType: 'fixed',
            lateFeeValue: 20000,
            applyLateFeeAutomatically: true
        };
        mockService.getBillingSettings.mockResolvedValue(mockSettings);

        render(<BillingSettings residencialId={mockResidencialId} />);

        await waitFor(() => {
            expect(screen.getByLabelText(/cuota mensual/i)).toHaveValue(1500);
            expect(screen.getByLabelText(/día de cobro/i)).toHaveValue(1);
            expect(screen.getByLabelText(/día de vencimiento/i)).toHaveValue(10);
            expect(screen.getByLabelText(/recargo fijo/i)).toHaveValue(200);
            expect(screen.getByLabelText(/aplicar automáticamente/i)).toBeChecked();
        });
    });

    it('calls update service when form is submitted', async () => {
        const mockSettings = {
            defaultMonthlyFeeCents: 150000,
            billingDayOfMonth: 1,
            dueDayOfMonth: 10,
            lateFeeType: 'fixed',
            lateFeeValue: 20000,
            applyLateFeeAutomatically: true
        };
        mockService.getBillingSettings.mockResolvedValue(mockSettings);
        mockService.updateBillingSettings.mockResolvedValue({ success: true });

        render(<BillingSettings residencialId={mockResidencialId} />);

        await waitFor(() => expect(screen.getByLabelText(/cuota mensual/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/cuota mensual/i), { target: { value: '2000' } });
        fireEvent.click(screen.getByText(/guardar cambios/i));

        await waitFor(() => {
            expect(mockService.updateBillingSettings).toHaveBeenCalledWith(mockResidencialId, expect.objectContaining({
                defaultMonthlyFeeCents: 200000
            }));
            expect(screen.getByText(/configuración guardada/i)).toBeInTheDocument();
        });
    });
});
