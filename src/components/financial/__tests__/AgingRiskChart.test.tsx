import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgingRiskChart } from '../AgingRiskChart';

describe('AgingRiskChart', () => {
    const mockBuckets = [
        { key: 'current', index: 0, label: 'Al día', amountCents: 0, housesCount: 0, severity: 'low' },
        { key: '30_days', index: 1, label: '1-30', amountCents: 20000, housesCount: 5, severity: 'medium' },
        { key: '60_days', index: 2, label: '31-60', amountCents: 10000, housesCount: 3, severity: 'high' },
        { key: '90_days', index: 3, label: '61-90', amountCents: 5000, housesCount: 2, severity: 'critical' },
        { key: 'plus_90', index: 4, label: '91+', amountCents: 2000, housesCount: 1, severity: 'critical' },
    ];

    it('should render all semantic buckets correctly', () => {
        render(<AgingRiskChart buckets={mockBuckets} isLoading={false} />);

        expect(screen.getAllByText(/1-30/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/31-60/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/61-90/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/91\+/i).length).toBeGreaterThan(0);
    });

    it('should display the correct currency amounts per bucket', () => {
        render(<AgingRiskChart buckets={mockBuckets} isLoading={false} />);

        expect(screen.getAllByText(/\$200/).length).toBeGreaterThan(0); // 20000 cents
        expect(screen.getAllByText(/\$100/).length).toBeGreaterThan(0); // 10000 cents
    });

    it('should treat "current" as an auxiliary visual metric', () => {
        render(<AgingRiskChart buckets={mockBuckets} isLoading={false} />);

        // Check if "Al día" is present but maybe styled differently or in a specific section
        expect(screen.getByText(/al día/i)).toBeDefined();
    });

    it('should show skeletons during loading state', () => {
        render(<AgingRiskChart buckets={[]} isLoading={true} />);

        const skeletons = screen.getAllByTestId('chart-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
