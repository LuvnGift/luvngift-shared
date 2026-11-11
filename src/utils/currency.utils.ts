import { Currency } from '../types';

/** Maps a buyer's country code to the currency they pay in. */
export const getUserCurrency = (buyerCountry?: string | null): 'USD' | 'GBP' | 'CAD' => {
  if (buyerCountry === 'CA') return 'CAD';
  if (buyerCountry === 'GB') return 'GBP';
  return 'USD';
};

/**
 * One unambiguous symbol per currency. Buyers are in Canada, the US and the
 * UK, so a bare "$" could be either dollar: every price says CA$ or US$.
 */
const SYMBOLS: Record<Currency, string> = {
  [Currency.CAD]: 'CA$',
  [Currency.USD]: 'US$',
  [Currency.GBP]: '£',
  [Currency.NGN]: '₦',
};

/** Convert smallest unit (kobo/cents) to decimal amount */
export const fromSmallestUnit = (amount: number): number => amount / 100;

/** Convert decimal amount to smallest unit (kobo/cents) */
export const toSmallestUnit = (amount: number): number => Math.round(amount * 100);

/**
 * "CA$1,234.50", "-US$5.00". Every price on the site, in the app and in email
 * is written this way. Accepts a currency code as a string so a payload typed
 * loosely needs no cast; an unknown code is written in front ("EUR 5.00").
 */
export const formatMoney = (amountInSmallestUnit: number, currency: Currency | string): string => {
  const symbol = SYMBOLS[currency as Currency] ?? `${currency} `;
  const digits = (Math.abs(amountInSmallestUnit) / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amountInSmallestUnit < 0 ? '-' : ''}${symbol}${digits}`;
};

/** The same as `formatMoney`, under its older name. */
export const formatCurrency = (amountInSmallestUnit: number, currency: Currency | string): string =>
  formatMoney(amountInSmallestUnit, currency);

export const getCurrencySymbol = (currency: Currency | string): string =>
  SYMBOLS[currency as Currency] ?? String(currency);
