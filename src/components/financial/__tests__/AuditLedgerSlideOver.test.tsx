import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuditLedgerSlideOver } from '../AuditLedgerSlideOver';

describe('AuditLedgerSlideOver', () => {
    const mockLedger = {
        balanceCents: 5000,
        entries: [
            {
                id: '1',
                date: '2026-03-05T10:00:00Z',
                description: 'Pago Referenciado',
                amountCents: -5000, // Negative for payment
                type: 'payment',
                folio: 'P-001',
                status: 'completed',
            },
            {
                id: '2',
                date: '2026-03-01T10:00:00Z',
                description: 'Mantenimiento Marzo',
                amountCents: 10000, // Positive for charge
                type: 'charge',
                folio: 'C-001',
                status: 'completed',
            }
        ]
    };

    it('should render house ID and current balance', () => {
        render(
            <AuditLedgerSlideOver
                isOpen={true}
                houseId="LOTE-101"
                ledger={mockLedger}
                isLoading={false}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/LOTE-101/i)).toBeDefined();
        expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThan(0); // Balance 5000 cents and payment -5000 cents
    });

    it('should enforce negative signs for payments in the list', () => {
        render(
            <AuditLedgerSlideOver
                isOpen={true}
                houseId="LOTE-101"
                ledger={mockLedger}
                isLoading={false}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/-\$50\.00/)).toBeDefined(); // Payment -5000 cents
        expect(screen.getByText(/\$100\.00/)).toBeDefined(); // Charge 10000 cents
    });

    it('should show folio and status correctly', () => {
        render(
            <AuditLedgerSlideOver
                isOpen={true}
                houseId="LOTE-101"
                ledger={mockLedger}
                isLoading={false}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/P-001/i)).toBeDefined();
        expect(screen.getAllByText(/completado/i).length).toBeGreaterThan(0);
    });

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <AuditLedgerSlideOver
                isOpen={true}
                houseId="LOTE-101"
                ledger={mockLedger}
                isLoading={false}
                onClose={onClose}
            />
        );

        const closeBtn = screen.getByLabelText(/cerrar/i);
        fireEvent.click(closeBtn);

        expect(onClose).toHaveBeenCalled();
    });

    it('should not render if isOpen is false', () => {
        const { container } = render(
            <AuditLedgerSlideOver
                isOpen={false}
                houseId="LOTE-101"
                ledger={null}
                isLoading={false}
                onClose={vi.fn()}
            />
        );

        expect(container.firstChild).toBeNull();
    });
});
