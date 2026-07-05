export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: "user" | "admin";
  created_at: string;
}

export interface SaladItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  ingredients: string[];
  available: boolean;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  fssai_license: string | null;
  shop_latitude: number | null;
  shop_longitude: number | null;
  delivery_radius_km: number;
  updated_at: string;
}

export interface CartItem {
  salad: SaladItem;
  quantity: number;
}

export type PaymentMethod = "proof_upload" | "cod";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  items: { salad_id: string; name: string; price: number; quantity: number }[];
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof_url: string | null;
  delivery_address: string;
  delivery_notes: string | null;
  phone: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email" | "phone">;
}
