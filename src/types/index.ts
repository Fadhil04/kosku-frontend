export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'tenant';
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  is_active: boolean;
  stats: {
    total_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    occupancy_rate: number;
    unpaid_bills_count: number;
    unpaid_bills_total: number;
    contracts_expiring_30_days: number;
  };
}

export interface Room {
  id: string;
  room_number: string;
  floor: number | null;
  type: string;
  base_price: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'NEEDS_MAINTENANCE';
  facilities: string[];
  active_contract?: {
    id: string;
    tenant: { full_name: string };
    end_date: string;
  } | null;
}

// Backend generate password sendiri, tidak butuh field password dari frontend
// Tenant yang bisa muncul di list hanya yang sudah/pernah punya kontrak dengan owner ini
export interface Tenant {
  id: string;
  email: string;
  // Backend return camelCase karena Prisma field mapping
  fullName?: string;
  full_name?: string;
  phoneNumber?: string;
  phone_number?: string;
  idCardNumber?: string;
  id_card_number?: string;
  emergencyContactName?: string;
  emergency_contact_name?: string;
  emergencyContactPhone?: string;
  emergency_contact_phone?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  active_contract?: {
    id: string;
    room: { room_number: string; property: { name: string } };
  } | null;
}

export interface Contract {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  deposit_status: 'UNPAID' | 'PAID' | 'REFUNDED';
  billing_date: number;
  notes?: string;
  termination_date?: string;
  termination_reason?: string;
  created_at: string;
  tenant: { id: string; full_name: string; email: string; phone_number?: string };
  room: {
    room_number: string;
    property: { id: string; name: string };
  };
  _count?: { bills: number };
}

export interface Bill {
  id: string;
  period_month: number;
  period_year: number;
  due_date: string;
  total_amount: number;
  final_amount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
  tenant: { full_name: string };
  room: { room_number: string };
  property: { name: string };
  late_fee_info: {
    days_overdue: number;
    late_fee_amount: number;
    is_overdue: boolean;
  };
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