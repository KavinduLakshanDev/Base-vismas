/**
 * Currency formatting utilities
 */

export function formatCurrency(amount: number | null | undefined, currency = 'LKR'): string {
    if (amount === null || amount === undefined) {
        return `${currency} 0.00`;
    }

    return `${currency} ${amount.toFixed(2)}`;
}

export function formatCurrencyWithoutSymbol(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
        return '0.00';
    }

    return amount.toFixed(2);
}

export function parseCurrency(value: string): number {
    // Remove currency symbols and commas, then parse
    const cleaned = value.replace(/[Rs.\s,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}