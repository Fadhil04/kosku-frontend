// ────────────────────────────────────────────────────────────────
// Semua type sudah disesuaikan dengan response backend (snake_case)
// Backend Prisma camelCase sudah di-normalize di service layer
// ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'tenant';
  phone_number?: string | null;
  avatar_url?: string | null;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string | null;
  description?: string | null;
  rules?: string | null;
  facilities: string[];
  photos: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats: PropertyStats;
  // Hanya ada di detail page
  rooms?: RoomInProperty[];
}

export interface PropertyStats {
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  reserved_rooms: number;
  maintenance_rooms: number;
  occupancy_rate: number;
  unpaid_bills_count: number;
  unpaid_bills_total: number;
  // Hanya di detail
  current_month_billed?: number;
  current_month_collected?: number;
  collection_rate?: number;
  contracts_expiring_30_days?: number;
}

export interface RoomInProperty {
  id: string;
  room_number: string;
  floor: number | null;
  type: string;
  base_price: number;
  size_sqm: number | null;
  status: RoomStatus;
  facilities: unknown[];
  notes: string | null;
  active_contract: {
    id: string;
    end_date: string;
    monthly_rent: number;
    tenant: { id: string; full_name: string };
  } | null;
}

export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'NEEDS_MAINTENANCE';

export interface Room {
  id: string;
  property_id: string;
  room_number: string;
  floor: number | null;
  type: string;
  size_sqm: number | null;
  base_price: number;
  status: RoomStatus;
  facilities: unknown[];
  photos?: unknown[];
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  active_contract?: {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    tenant: { id: string; full_name: string; phone_number?: string | null };
  } | null;
  contracts?: ContractInRoom[];
  stats?: {
    total_contracts: number;
    total_billed: number;
    total_collected: number;
    total_bills: number;
  };
}

export interface ContractInRoom {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: ContractStatus;
  tenant: { id: string; full_name: string; email?: string | null; phone_number?: string | null };
}

export interface Tenant {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  id_card_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
  active_contract?: {
    id: string;
    room: { room_number: string; property: { name: string } };
  } | null;
  // Hanya ada di detail
  contracts?: TenantContract[];
}

export interface TenantContract {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: ContractStatus;
  room: { room_number: string; property: { name: string } };
}

export type ContractStatus = 'PENDING' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

export interface Contract {
  id: string;
  room_id: string;
  tenant_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  deposit_status: 'UNPAID' | 'PAID' | 'REFUNDED';
  billing_date: number;
  additional_charges: unknown[];
  status: ContractStatus;
  termination_date?: string | null;
  termination_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  tenant: { id: string; full_name: string; email: string; phone_number?: string | null };
  room: { room_number: string; property: { id: string; name: string } };
  _count?: { bills: number };
  // Hanya ada di detail
  bills?: ContractBill[];
}

export interface ContractBill {
  id: string;
  period_month: number;
  period_year: number;
  due_date: string;
  base_rent: number;
  total_amount: number;
  discount_amount: number;
  status: BillStatus;
  paid_at?: string | null;
  payments: { id: string; amount: number; payment_date: string }[];
}

export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';

export interface Bill {
  id: string;
  contract_id: string;
  tenant_id: string;
  room_id: string;
  property_id: string;
  period_month: number;
  period_year: number;
  due_date: string;
  base_rent: number;
  additional_charges: unknown[];
  discount_amount: number;
  discount_reason?: string | null;
  total_amount: number;
  amount_after_discount: number;
  /** = amount_after_discount — tidak ada denda, keputusan ada di owner */
  final_amount: number;
  status: BillStatus;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  tenant: { id: string; full_name: string; email?: string | null };
  room: { room_number: string };
  property: { id: string; name: string };
  overdue_info: {
    days_overdue: number;
    is_overdue: boolean;
  };
  /** @deprecated use overdue_info */
  late_fee_info: {
    days_overdue: number;
    is_overdue: boolean;
    late_fee_amount: 0;
    late_fee_percentage: 0;
  };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  late_fee_amount?: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string | null;
  proof_url?: string | null;
  notes?: string | null;
  recorded_by: string;
  created_at: string;
}

export type PaymentTransactionStatus =
  | 'PENDING'
  | 'SETTLEMENT'
  | 'CAPTURE'
  | 'DENY'
  | 'CANCEL'
  | 'EXPIRE'
  | 'FAILURE'
  | 'REFUND';

export interface PaymentTransaction {
  id: string;
  bill_id: string;
  order_id: string;
  gateway: 'MIDTRANS';
  gross_amount: number;
  snap_token: string | null;
  redirect_url: string | null;
  status: PaymentTransactionStatus;
  payment_type: string | null;
  transaction_time: string | null;
  settled_at: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  tenant: { full_name: string };
  room: { room_number: string };
  property: { name: string };
  _count: { responses: number };
}

export interface DashboardSummary {
  total_properties: number;
  total_rooms: number;
  overall_occupancy_rate: number;
  room_status: Record<string, number>;
  current_month_revenue: {
    billed: number;
    collected: number;
    collection_rate: number;
  };
  total_active_contracts: number;
  open_complaints: number;
  overdue_bills: number;
  contracts_expiring_30_days: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
