export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: 'mainline' | 'premium' | 'treasure-hunts' | 'vintage';
  images: string[];
  available: boolean;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_notes: string | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  payment_screenshot: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'all' | 'mainline' | 'premium' | 'treasure-hunts' | 'vintage';

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  description: string;
  icon: string;
}
