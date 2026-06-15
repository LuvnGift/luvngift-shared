import { Currency } from './common.types';

export interface BundleItem {
  id: string;
  bundleId: string;
  name: string;
  description?: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  occasionId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: Currency;
  estimatedDeliveryDays: number;
  images: string[];
  isActive: boolean;
  items: BundleItem[];
  // SEO content (optional) — rich copy rendered on the public bundle page.
  seoBody?: string | null;
  faqs?: Faq[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isActive: boolean;
  bundles?: Bundle[];
  // SEO content (optional) — rich copy rendered on the public occasion page.
  seoIntro?: string | null;
  highlights?: string[];
  faqs?: Faq[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
