import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, CheckCircle, Truck, Clock, Star } from "lucide-react";
import { useDryStats } from "./Hooks";
import { C, PeriodTotals, STATUS_META } from "./Tokens";
import { Spinner, ErrorBanner } from "./Ui";
import { TrendingUp, BarChart2, MapPin } from "lucide-react";

interface DryCleaningTabProps {
  token?: string;
}

const ORANGE = "#FFA629";
const ORANGE_LIGHT = "#FF8E0012";
const ORANGE_BORDER = "#FFA62930";

const STATUS_ICONS: Record<string, React.FC<any>> = {
  pending: Clock,
  in_progress: Truck,
  ready_for_delivery: CheckCircle,
  completed: CheckCircle,
};

/* ── animated number counter hook ── */
function useCountUp(target: number, duration = 900, trigger = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(id);
      } else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, trigger]);
  return val;
}

/* ── animated bar hook ── */
function useBarWidth(pct: number, delay = 0) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return width;
}

/* ── stat card with count-up ── */
const StatCard: React.FC<{
  label: string;
  rawValue: string;
  sub?: string | null;
  pct?: string | null;
  icon: React.FC<any>;
  delay: number;
}> = ({ label, rawValue, sub, pct, icon: Icon, delay }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isNumber = /^\$?[\d.]+$/.test(rawValue);
  const numericPart = parseFloat(rawValue.replace("$", "")) || 0;
  const prefix = rawValue.startsWith("$") ? "$" : "";
  const counted = useCountUp(numericPart, 900, mounted);
  const displayValue = isNumber ? `${prefix}${counted}` : rawValue;

  return (
    <div
      className="stat-card"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{displayValue}</p>
        {sub && <p className="stat-card-sub">{sub}</p>}
        {pct && <p className="stat-card-pct">▲ {pct}</p>}
      </div>
      <div className="stat-icon-wrap">
        <Icon size={17} color="#fff" />
      </div>
    </div>
  );
};

/* ── animated category bar ── */
const CatBar: React.FC<{ item: any; maxCat: number; delay: number }> = ({
  item,
  maxCat,
  delay,
}) => {
  const pct = (item.totalRevenue / maxCat) * 100;
  const width = useBarWidth(pct, delay);
  return (
    <div
      className="cat-row"
      style={{
        opacity: width > 0 ? 1 : 0,
        transform: width > 0 ? "translateX(0)" : "translateX(-10px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      <div className="cat-row-top">
        <span className="cat-name">{item.category}</span>
        <span className="cat-val">${item.totalRevenue}</span>
      </div>
      <div className="cat-bar-bg">
        <div className="cat-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

/* ── shop card ── */
const ShopCard: React.FC<{ shop: any; p: string; delay: number }> = ({
  shop,
  p,
  delay,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className="shop-card"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "translateY(0) scale(1)"
          : "translateY(22px) scale(0.97)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div
        className="shop-card-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "16px 20px",
        }}
      >
        <div className="shop-avatar">{shop.shopname?.[0] ?? "S"}</div>
        <div style={{ flex: 1 }}>
          <p className="shop-name">{shop.shopname}</p>
          <p className="shop-sub">{shop.address?.street ?? ""}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="shop-earnings">${shop.earnings[p]}</p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 3,
              marginTop: 2,
            }}
          >
            <Star size={11} fill="#FFA629" color="#FFA629" />
            <span style={{ fontSize: 11, color: "#aaa" }}>{shop.rating}</span>
          </div>
        </div>
      </div>
      <div className="shop-stats">
        {Object.entries(shop.orderStatus).map(([k, val]) => (
          <div key={k} className="shop-stat">
            <p className="shop-stat-val">{val as React.ReactNode}</p>
            <p
              className="shop-stat-label"
              style={{ textTransform: "capitalize" }}
            >
              {k}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── analytics bar ── */
const AnalyticsBar: React.FC<{ item: any; total: number; delay: number }> = ({
  item,
  total,
  delay,
}) => {
  const meta = STATUS_META[item.status] || STATUS_META.pending;
  const Icon = STATUS_ICONS[item.status] || Clock;
  const pct = Math.round((item.count / total) * 100);
  const width = useBarWidth(pct, delay);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="analytics-row"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-14px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div className="analytics-row-top">
        <div
          className="analytics-icon"
          style={{ background: meta.bg, border: `1px solid ${meta.color}20` }}
        >
          <Icon size={13} color={meta.color} />
        </div>
        <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>
          {meta.label}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{item.count}</span>
      </div>
      <div className="analytics-bar-bg">
        <div
          className="analytics-bar-fill"
          style={{ width: `${width}%`, background: meta.color }}
        />
      </div>
    </div>
  );
};

/* ── order row ── */
const OrderRow: React.FC<{ o: any; delay: number }> = ({ o, delay }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const meta = STATUS_META[o.status] || STATUS_META.pending;
  const Icon = STATUS_ICONS[o.status] || Clock;

  return (
    <div
      className="order-row"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div
        className="order-icon"
        style={{ background: meta.bg, border: `1px solid ${meta.color}20` }}
      >
        <Icon size={16} color={meta.color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>
          {o.orderNumber}
        </p>
        <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
          {o.customerName} · {o.itemCount} items
        </p>
      </div>
      <span style={{ fontWeight: 700, color: ORANGE, fontSize: 15 }}>
        ${o.totalAmount}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
export const DryCleaningTab: React.FC<DryCleaningTabProps> = ({ token }) => {
  const { data, loading, error, refetch } = useDryStats(token);
  const [period, setPeriod] = useState("weekly");
  const [view, setView] = useState("overview");
  const [viewKey, setViewKey] = useState(0); // forces remount on view change

  const switchView = (v: string) => {
    setView(v);
    setViewKey((k) => k + 1);
  };

  if (loading) return <Spinner />;
  if (error || !data)
    return <ErrorBanner msg={error ?? "No data"} onRetry={refetch} />;

  const p = period as keyof PeriodTotals;
  const maxCat = data.categoryBreakdown[0]?.totalRevenue || 1;

  const PERIODS = ["daily", "weekly", "monthly"];
  const VIEWS = ["overview", "orders", "analytics"];

  const statCards = [
    {
      label: "Revenue",
      rawValue: `$${data.totalEarnings[p]}`,
      sub: "This Week",
      pct: "+12.4%",
      icon: TrendingUp,
    },
    {
      label: "Orders",
      rawValue: String(data.totalBookings[p]),
      sub: "This Week",
      pct: null,
      icon: ShoppingBag,
    },
    {
      label: "Avg Order",
      rawValue: `$${data.overallStats.avgOrderValue}`,
      sub: null,
      pct: null,
      icon: BarChart2,
    },
    {
      label: "Shops",
      rawValue: String(data.overallStats.totalShops),
      sub: null,
      pct: null,
      icon: MapPin,
    },
  ];

  const statusTotal = data.statusBreakdown.reduce((s, b) => s + b.count, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

        .dc-wrap, .dc-wrap * {
          font-family: 'DM Sans', sans-serif !important;
          box-sizing: border-box;
        }
        .dc-wrap { max-width: 1280px; margin: 0 auto; width: 100%; }

        /* ── pill row ── */
        .pill-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .pill-btn {
          padding: 8px 22px; border-radius: 24px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e0d9cf; background: #faf8f5; color: #555;
          transition: all 0.22s cubic-bezier(.22,1,.36,1);
          font-family: 'DM Sans', sans-serif !important;
        }
        .pill-btn:hover:not(.active) {
          border-color: ${ORANGE}88; color: ${ORANGE};
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(255,166,41,0.15);
        }
        .pill-btn.active {
          background: ${ORANGE}; border-color: ${ORANGE}; color: #fff;
          box-shadow: 0 4px 14px rgba(255,166,41,0.38);
          transform: translateY(-1px);
        }

        /* ── stat grid ── */
        .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 500px) { .stat-grid { grid-template-columns: 1fr 1fr; } }

        .stat-card {
          background: ${ORANGE_LIGHT}; border: 1.5px solid ${ORANGE_BORDER};
          border-radius: 16px; padding: 16px;
          display: flex; justify-content: space-between; align-items: flex-start;
          transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s;
          cursor: default;
        }
        .stat-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(255,166,41,0.18); }
        .stat-card-label { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
        .stat-card-value { font-size: 26px; font-weight: 800; color: #1a1a1a; margin: 0; }
        .stat-card-sub   { font-size: 11px; color: #aaa; margin: 2px 0 0; }
        .stat-card-pct   { font-size: 11px; color: #22c55e; font-weight: 700; margin: 4px 0 0; display: flex; align-items: center; gap: 3px; }
        .stat-icon-wrap  {
          width: 38px; height: 38px; border-radius: 50%;
          background: ${ORANGE}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(255,166,41,0.35);
          transition: transform 0.22s cubic-bezier(.22,1,.36,1);
        }
        .stat-card:hover .stat-icon-wrap { transform: rotate(8deg) scale(1.1); }

        /* ── cat card ── */
        .cat-card {
          background: ${ORANGE}; border-radius: 20px; padding: 20px 24px; margin-bottom: 22px;
          box-shadow: 0 6px 24px rgba(255,166,41,0.30);
        }
        .cat-title { font-weight: 700; font-size: 16px; color: #fff; margin: 0 0 16px; }
        .cat-row   { margin-bottom: 14px; }
        .cat-row-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .cat-name  { font-size: 14px; font-weight: 600; color: #fff; }
        .cat-val   { font-size: 14px; font-weight: 700; color: #fff; }
        .cat-bar-bg { height: 7px; background: rgba(255,255,255,0.22); border-radius: 99px; overflow: hidden; }
        .cat-bar-fill {
          height: 7px; background: #1a1a1a; border-radius: 99px;
          transition: width 1.1s cubic-bezier(.22,1,.36,1);
          box-shadow: 0 0 6px rgba(0,0,0,0.25);
        }

        /* ── shops ── */
        .shop-section-label { font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; }
        .shop-card {
          background: #fff; border: 1.5px solid ${ORANGE_BORDER};
          border-radius: 18px; margin-bottom: 14px; overflow: hidden;
          cursor: default;
        }
        .shop-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 28px rgba(255,166,41,0.18) !important; }
        .shop-avatar {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: ${ORANGE}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 18px;
          box-shadow: 0 3px 10px rgba(255,166,41,0.32);
          transition: transform 0.22s cubic-bezier(.22,1,.36,1);
        }
        .shop-card:hover .shop-avatar { transform: rotate(-5deg) scale(1.08); }
        .shop-name { font-weight: 700; font-size: 15px; margin: 0; color: #1a1a1a; }
        .shop-sub  { font-size: 11px; color: #aaa; margin: 0; }
        .shop-earnings { font-size: 22px; font-weight: 800; color: #22c55e; margin: 0; }
        .shop-stats {
          display: flex; background: ${ORANGE_LIGHT};
          border-top: 1px solid ${ORANGE_BORDER};
          padding: 10px 0; justify-content: space-around;
        }
        .shop-stat { text-align: center; flex: 1; }
        .shop-stat + .shop-stat { border-left: 1px solid rgba(255,166,41,0.2); }
        .shop-stat-val   { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0; }
        .shop-stat-label { font-size: 10px; color: #999; margin: 0; font-weight: 600; letter-spacing: 0.5px; }

        /* ── orders ── */
        .orders-wrap { background: #fff; border-radius: 22px; border: 1.5px solid #eee; overflow: hidden; }
        .order-row {
          display: flex; align-items: center; gap: 13px; padding: 14px 20px;
          border-bottom: 1px solid #f5f0ea;
          transition: background 0.18s;
          cursor: default;
        }
        .order-row:last-child { border-bottom: none; }
        .order-row:hover { background: #faf8f4; }
        .order-icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: transform 0.22s cubic-bezier(.22,1,.36,1);
        }
        .order-row:hover .order-icon { transform: scale(1.12); }

        /* ── analytics ── */
        .analytics-wrap { background: #fff; border-radius: 22px; padding: 24px; border: 1.5px solid #eee; }
        .analytics-title { font-weight: 700; margin-bottom: 20px; font-size: 15px; color: #1a1a1a; }
        .analytics-row { margin-bottom: 18px; }
        .analytics-row-top { display: flex; align-items: center; gap: 11px; margin-bottom: 8px; }
        .analytics-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: transform 0.22s cubic-bezier(.22,1,.36,1);
        }
        .analytics-row:hover .analytics-icon { transform: scale(1.15) rotate(-5deg); }
        .analytics-bar-bg { height: 6px; background: #f0ece6; border-radius: 99px; overflow: hidden; }
        .analytics-bar-fill {
          height: 6px; border-radius: 99px;
          transition: width 1.2s cubic-bezier(.22,1,.36,1);
          box-shadow: 0 0 5px rgba(0,0,0,0.12);
        }

        /* ── view transition wrapper ── */
        @keyframes viewSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .view-anim { animation: viewSlideIn 0.38s cubic-bezier(.22,1,.36,1) both; }

        /* ── pulse dot for pct ── */
        @keyframes pulseDot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.6; }
        }
        .pulse-dot { display: inline-block; animation: pulseDot 2s infinite; }
      `}</style>

      <div className="dc-wrap">
        {/* Sub-nav */}
        <div className="pill-row">
          {VIEWS.map((v) => (
            <button
              key={v}
              className={`pill-btn${view === v ? " active" : ""}`}
              onClick={() => switchView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <div key={`overview-${viewKey}`} className="view-anim">
            <div className="pill-row" style={{ marginBottom: 20 }}>
              {PERIODS.map((pp) => (
                <button
                  key={pp}
                  className={`pill-btn${period === pp ? " active" : ""}`}
                  onClick={() => setPeriod(pp)}
                >
                  {pp.charAt(0).toUpperCase() + pp.slice(1)}
                </button>
              ))}
            </div>

            <div className="stat-grid">
              {statCards.map((s, i) => (
                <StatCard key={s.label} {...s} delay={i * 80} />
              ))}
            </div>

            <div className="cat-card">
              <p className="cat-title">Top Categories</p>
              {data.categoryBreakdown.map((item, i) => (
                <CatBar
                  key={item.category}
                  item={item}
                  maxCat={maxCat}
                  delay={i * 120}
                />
              ))}
            </div>

            <p className="shop-section-label">Your Shops</p>
            {data.shops.map((shop, i) => (
              <ShopCard key={shop.id} shop={shop} p={p} delay={i * 100} />
            ))}
          </div>
        )}

        {/* ── ORDERS ── */}
        {view === "orders" && (
          <div key={`orders-${viewKey}`} className="view-anim">
            <div className="orders-wrap">
              {data.recentOrders.length === 0 && (
                <p style={{ color: "#aaa", textAlign: "center", padding: 48 }}>
                  No recent orders.
                </p>
              )}
              {data.recentOrders.map((o, i) => (
                <OrderRow key={o._id} o={o} delay={i * 60} />
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {view === "analytics" && (
          <div key={`analytics-${viewKey}`} className="view-anim">
            <div className="analytics-wrap">
              <p className="analytics-title">Order Status Flow</p>
              {data.statusBreakdown.map((item, i) => (
                <AnalyticsBar
                  key={item.status}
                  item={item}
                  total={statusTotal}
                  delay={i * 100}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DryCleaningTab;
