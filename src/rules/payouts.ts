/**
 * Partner payout rules shared by the API and the admin dashboard.
 */

/**
 * An account number as lists show it: the last four digits only. The full
 * number is shown only on the verified detail view, where admin needs it to pay.
 */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  return `••••${digits.slice(-4)}`;
}

/** Last four digits, stored beside the account so lists never need the full number. */
export function accountLast4(accountNumber: string): string {
  return accountNumber.replace(/\D/g, '').slice(-4);
}

/** Bank details may be paid only once verified and while current. */
export function isBankAccountPayable(account: { status: string } | null | undefined): boolean {
  return account?.status === 'VERIFIED';
}
