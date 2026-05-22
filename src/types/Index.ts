// ─── Auth & User ────────────────────────────────────────────────────────────
export interface MerchantUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: 'merchant';
  profileImage?: string;
}

export interface LoginPayload {
  token?: string;
  accessToken?: string;
  success?: boolean;
  user?: MerchantUser;
  merchant?: MerchantUser;
  userType?: string;
}

export interface LoginResponse {
  data?: LoginPayload;
  token?: string;
  success?: boolean;
}

// ─── Venue ───────────────────────────────────────────────────────────────────
export type VenueType = 'parking' | 'garage' | 'residence';
export type BookingPeriod = 'daily' | 'weekly' | 'monthly';

export interface VenueSlots {
  booked: number;
  available: number;
  total: number;
}

export interface VenueEarnings {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface RecentBooking {
  _id: string;
  customerName: string;
  slot: string | number;
  from: string;
  to: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  type: VenueType;
  isMonthly: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  type: VenueType;
  slots: VenueSlots;
  earnings: VenueEarnings;
  monthlyChargeEnabled: boolean;
  monthlyRate: number;
  activeMonthlySubscriptions: number;
  recentBookings: RecentBooking[];
}

export interface DashboardData {
  totalEarnings: VenueEarnings;
  totalBookings: { daily: number; weekly: number; monthly: number };
  venues: Venue[];
  recentBookings: RecentBooking[];
}

// ─── Dry Cleaning ─────────────────────────────────────────────────────────────
export type DryCleaningOrderStatus =
  | 'pending' | 'accepted' | 'in_progress' | 'pickup_completed'
  | 'en_route_to_dropoff' | 'arrived_at_dropoff' | 'dropped_at_center'
  | 'ready_for_delivery' | 'completed' | 'cancelled' | 'rejected';

export interface DryCleaningOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  status: DryCleaningOrderStatus;
}

export interface ShopOrderStatus {
  pending: number;
  active: number;
  readyForDelivery: number;
  paid: number;
}

export interface ShopEarnings {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface DryCleaningShop {
  id: string;
  shopname: string;
  address?: { street?: string; city?: string };
  rating: number;
  earnings: ShopEarnings;
  allTimeRevenue: number;
  orderStatus: ShopOrderStatus;
  recentOrders: DryCleaningOrder[];
}

export interface CategoryBreakdown {
  category: string;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
}

export interface StatusBreakdown {
  status: DryCleaningOrderStatus;
  count: number;
}

export interface OverallStats {
  avgOrderValue: number;
  totalShops: number;
}

export interface DryCleaningData {
  totalEarnings?: VenueEarnings;
  totalBookings?: { daily: number; weekly: number; monthly: number };
  overallStats?: OverallStats;
  shops?: DryCleaningShop[];
  recentOrders?: DryCleaningOrder[];
  statusBreakdown?: StatusBreakdown[];
  categoryBreakdown?: CategoryBreakdown[];
}

