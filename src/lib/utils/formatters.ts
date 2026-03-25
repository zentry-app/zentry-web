/**
 * Formats a value in cents to a MXN currency string.
 */
export const formatCurrency = (amountInCents: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amountInCents / 100);
};

/**
 * Formats a number with local Mexican thousand separators.
 */
export const formatNumber = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('es-MX').format(value);
};
