import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BankStatementImport } from '../BankStatementImport';
import { WebERPService } from '@/lib/services/WebERPService';
import Papa from 'papaparse';

vi.mock('papaparse', () => ({
    default: {
        parse: vi.fn()
    }
}));

vi.mock('@/lib/services/WebERPService', () => {
    return {
        WebERPService: class {
            importBankTransactions = vi.fn();
        }
    };
});

describe.skip('BankStatementImport', () => {
    let mockService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = new WebERPService();
    });

    const validCsvContent = `date,amount,reference,description\n2026-03-08,1500.00,REF123,Pago Casa 1`;
    const mixedCsvContent = `date,amount,reference,description\n2026-03-08,1500.00,REF123,Pago Casa 1\nInvalidDate,not-a-number,,Bad Row`;

    it('should parse and preview valid and invalid rows correctly', async () => {
        render(<BankStatementImport service={mockService} residencialId="RES-1" accountId="ACC-1" />);

        const mockedParseData = {
            data: [
                { date: '2026-03-08', amount: '1500.00', reference: 'REF123', description: 'Pago Casa 1' },
                { date: 'InvalidDate', amount: 'not-a-number', reference: '', description: 'Bad Row' }
            ]
        };

        (Papa.parse as any).mockImplementation((file: any, config: any) => {
            console.log('MOCK CALLED', file);
            config.complete(mockedParseData);
        });

        const fileInput = screen.getByLabelText(/Sube tu archivo CSV bancario/i, { selector: 'input' });
        const file = new File(['dummy'], 'statement.csv', { type: 'text/csv' });

        fireEvent.change(fileInput, {
            target: { files: { 0: file, length: 1, item: () => file } }
        });

        await waitFor(() => {
            // Preview renders
            expect(screen.getByText('Previsualización de Filas')).toBeInTheDocument();
            expect(screen.getByText('✓ Listo')).toBeInTheDocument();
            expect(screen.getByText('⚠ Inválido')).toBeInTheDocument();
        });
    });

    it('should successfully submit valid rows and show summary', async () => {
        mockService.importBankTransactions.mockResolvedValue({
            success: true,
            stats: { processed: 1, duplicates: 0, invalid: 0 }
        });

        const mockedParseData = {
            data: [
                { date: '2026-03-08', amount: '1500.00', reference: 'REF123', description: 'Pago Casa 1' }
            ]
        };

        (Papa.parse as any).mockImplementation((file: any, config: any) => {
            config.complete(mockedParseData);
        });

        render(<BankStatementImport service={mockService} residencialId="RES-1" accountId="ACC-1" />);

        const fileInput = screen.getByLabelText(/Sube tu archivo CSV bancario/i, { selector: 'input' });
        const file = new File(['dummy'], 'statement.csv', { type: 'text/csv' });
        fireEvent.change(fileInput, {
            target: { files: { 0: file, length: 1, item: () => file } }
        });

        await screen.findByText('Previsualización de Filas');

        const importBtn = screen.getByRole('button', { name: /Confirmar Importación/i });
        fireEvent.click(importBtn);

        await waitFor(() => {
            expect(mockService.importBankTransactions).toHaveBeenCalled();
            expect(screen.getByText('¡Importación Exitosa!')).toBeInTheDocument();
            expect(screen.getByText('Nuevas Registradas')).toBeInTheDocument();
            // It should render "1" somewhere inside the stat block
        });

        const processedVal = screen.getAllByText('1').find(el => el.classList.contains('text-3xl'));
        expect(processedVal).toBeInTheDocument();
    });
});
