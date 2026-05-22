export const C = {
  bg: "#F7F3EE",
  bgDeep: "#EFE9E0",
  card: "#FDFAF6",
  cardBorder: "#E8E0D4",
  brand: "#B8860B", // dark goldenrod
  brandLight: "rgba(184,134,11,0.10)",
  brandGlow: "rgba(184,134,11,0.30)",
  brandDark: "#8B6508",
  text: "#1C1410",
  textSub: "#6B5B4E",
  gray: "#9C8F84",
  border: "#E2D9CE",
  sidebar: "#1C1410",
  sidebarActive: "rgba(184,134,11,0.18)",
  sidebarText: "#7A6A60",
  success: "#2A7D4F",
  successBg: "rgba(42,125,79,0.10)",
  warning: "#C0831A",
  warningBg: "rgba(192,131,26,0.12)",
  error: "#B03A2E",
  errorBg: "rgba(176,58,46,0.10)",
  parking: "#2563EB",
  parkingBg: "rgba(37,99,235,0.09)",
  garage: "#7C3AED",
  garageBg: "rgba(124,58,237,0.09)",
  residence: "#0D9488",
  residenceBg: "rgba(13,148,136,0.09)",
  purple: "#7C3AED",
  purpleBg: "rgba(124,58,237,0.09)",
  teal: "#0D9488",
  tealBg: "rgba(13,148,136,0.09)",
};

export type VenueType = "parking" | "garage" | "residence";
export type BookingStatus = "SUCCESS" | "PENDING" | "FAILED";
export type OrderStatus =
  | "pending"
  | "in_progress"
  | "ready_for_delivery"
  | "completed";
export type SubRole = "admin" | "manager" | "staff";
export type SubStatus = "active" | "inactive" | "pending";

export interface PeriodTotals {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number; 
}

export interface RecentBooking {
  _id: string;
  customerName: string;
  type: VenueType;
  slot: string;
  amount: number;
  status: BookingStatus;
  isMonthly: boolean;
  from: string;
  to: string;
  paymentMethod?: string;
  vehicleNumber?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  type: VenueType;
  earnings: PeriodTotals;
  slots: { booked: number; available: number; total: number };
  monthlyChargeEnabled: boolean;
  monthlyRate: number;
  activeMonthlySubscriptions: number;
  recentBookings: RecentBooking[];
}

export interface StatsData {
  totalEarnings: PeriodTotals;
  totalBookings: PeriodTotals;
  venues: Venue[];
  recentBookings: RecentBooking[];
}

export interface DryOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
}

export interface DryShop {
  id: string;
  shopname: string;
  address: { street: string; city: string };
  earnings: PeriodTotals;
  rating: number;
  orderStatus: {
    pending: number;
    active: number;
    readyForDelivery: number;
    paid: number;
  };
}

export interface DryStatsData {
  totalEarnings: PeriodTotals;
  totalBookings: PeriodTotals;
  overallStats: { avgOrderValue: number; totalShops: number };
  statusBreakdown: { status: OrderStatus; count: number }[];
  categoryBreakdown: {
    category: string;
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
  }[];
  shops: DryShop[];
  recentOrders: DryOrder[];
}

export interface RealSubAccount {
  _id: string;
  email: string;
  label: string;
  isActive: boolean;
  createdAt: string;
}

export const VENUE_COLOR: Record<VenueType, string> = {
  parking: C.parking,
  garage: C.garage,
  residence: C.residence,
};
export const VENUE_BG: Record<VenueType, string> = {
  parking: C.parkingBg,
  garage: C.garageBg,
  residence: C.residenceBg,
};
export const PERIOD_LABEL: Record<string, string> = {
  daily: "Today",
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year", 
};
export const CAT_COLORS = [C.brand, C.purple, C.teal, C.success, C.warning];

export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: C.warning, bg: C.warningBg },
  in_progress: { label: "In Progress", color: C.purple, bg: C.purpleBg },
  ready_for_delivery: { label: "Ready", color: C.success, bg: C.successBg },
  completed: { label: "Completed", color: C.success, bg: C.successBg },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmtCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return "$0";
  return `$${value.toFixed(2)}`;
};

export const fmtDate = (iso: string) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const fmtDateTime = (iso: string) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const calcDuration = (from: string, to: string) => {
  if (!from || !to) return "N/A";
  const start = new Date(from),
    end = new Date(to);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return "N/A";
  const h = Math.floor(ms / 3_600_000),
    m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

export const statusColor = (s: string) =>
  s === "SUCCESS" ? C.success : s === "PENDING" ? C.warning : C.error;
export const statusBg = (s: string) =>
  s === "SUCCESS" ? C.successBg : s === "PENDING" ? C.warningBg : C.errorBg;

// ─── Global CSS ───────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0; padding: 0;
    background: ${C.bg};
    color: ${C.text};
    -webkit-font-smoothing: antialiased;
  }

  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeUp      { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
  @keyframes slideRight  { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideDown   { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulseDot    { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.45; transform:scale(0.7); } }
  @keyframes shimmer     { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes borderPulse { 0%,100% { border-color: rgba(184,134,11,0.18); } 50% { border-color: rgba(184,134,11,0.4); } }

  .fade-up    { animation: fadeUp 0.45s ease both; }
  .fade-in    { animation: fadeIn 0.35s ease both; }
  .slide-right{ animation: slideRight 0.3s ease both; }

  .card-hover {
    transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .card-hover:hover {
    transform: translateY(-3px);
    border-color: rgba(184,134,11,0.3) !important;
    box-shadow: 0 16px 48px rgba(28,20,16,0.10), 0 0 0 1px rgba(184,134,11,0.12);
  }

  .nav-item {
    width: 100%; display: flex; align-items: center;
    border: none; border-radius: 10px; cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    background: transparent; position: relative; overflow: hidden;
  }
  .nav-item:hover { background: rgba(255,255,255,0.06); }
  .nav-item.active { background: ${C.sidebarActive}; }

  .btn-primary {
    background: linear-gradient(135deg, ${C.brand}, ${C.brandDark});
    border: none; border-radius: 10px; color: #fff;
font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 6px 18px rgba(184,134,11,0.28);
    letter-spacing: 0.01em;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(184,134,11,0.42);
  }
  .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  .period-btn {
    padding: 7px 20px; border-radius: 40px; border: none;
    font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all 0.22s;
  }

  .filter-pill {
    padding: 6px 16px; border-radius: 40px;
  font-weight: 600; font-size: 12px;
    cursor: pointer; transition: all 0.2s;
  }

  .booking-row {
    display: flex; align-items: center; padding: 15px 22px;
    border-bottom: 1px solid ${C.border}; gap: 14px;
    transition: background 0.18s;
  }
  .booking-row:hover { background: rgba(184,134,11,0.04); cursor: pointer; }
  .booking-row:last-child { border-bottom: none; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(28,20,16,0.6);
    backdrop-filter: blur(12px);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  .modal-box {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 22px; padding: 34px;
    width: 460px; max-width: 95vw;
    box-shadow: 0 40px 80px rgba(28,20,16,0.2);
    animation: slideDown 0.28s cubic-bezier(0.4,0,0.2,1);
  }

  .input-field {
    width: 100%; padding: 11px 14px;
    background: ${C.bg}; border: 1.5px solid ${C.border};
    border-radius: 10px; color: ${C.text}; font-size: 14px;
   outline: none;
    transition: border-color 0.2s; box-sizing: border-box;
  }
  .input-field:focus { border-color: ${C.brand}; box-shadow: 0 0 0 3px rgba(184,134,11,0.08); }
  .input-field::placeholder { color: ${C.gray}; }

  .select-field {
    width: 100%; padding: 11px 14px;
    background: ${C.bg}; border: 1.5px solid ${C.border};
    border-radius: 10px; color: ${C.text}; font-size: 14px;
    outline: none;
    cursor: pointer; appearance: none;
    transition: border-color 0.2s;
  }
  .select-field:focus { border-color: ${C.brand}; }

  .sidebar-toggle {
    position: absolute; top: 34px; right: -13px;
    width: 26px; height: 26px; border-radius: 50%;
    background: ${C.card}; border: 1.5px solid ${C.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; transition: all 0.2s;
    box-shadow: 3px 0 12px rgba(28,20,16,0.15);
  }
  .sidebar-toggle:hover {
    background: ${C.brand}; border-color: ${C.brand};
    box-shadow: 0 0 12px rgba(184,134,11,0.4);
  }

  .logout-btn {
    display: flex; align-items: center; gap: 9px;
    width: 100%;
    background: rgba(176,58,46,0.07);
    border: 1px solid rgba(176,58,46,0.18);
    border-radius: 10px; cursor: pointer;
    transition: all 0.22s;
  }
  .logout-btn:hover {
    background: rgba(176,58,46,0.14);
    border-color: rgba(176,58,46,0.4);
    transform: translateY(-1px);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
`;
