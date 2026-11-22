import { Currency, StaffPermission, UserRole } from './common.types';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  role: UserRole;
  /** Empty unless `role` is STAFF. */
  staffPermissions?: StaffPermission[];
  /** Job title shown on the ops dashboard, e.g. "Country Brand Manager". */
  staffTitle?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  profilePicture?: string;
  phone?: string;
  preferredCurrency: Currency;
  /** ISO 3166-1 alpha-2 country code of the buyer (e.g. 'CA', 'US', 'GB') */
  buyerCountry?: string;
  /** Province/state code — required for Canada (drives tax), optional for US/GB */
  buyerProvince?: string;
  /** Buyer's billing street address */
  billingStreet?: string;
  /** Buyer's billing city */
  billingCity?: string;
  /** Buyer's billing postal / ZIP code */
  billingPostalCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
