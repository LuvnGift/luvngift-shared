export type VendorBusinessType = 'RETAIL' | 'DELIVERY' | 'LOGISTICS';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  businessType: VendorBusinessType;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
