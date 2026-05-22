import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { DollarSign, CalendarDays, Repeat, MapPin, Crown } from "lucide-react";
import { StatsData, PeriodTotals, fmtCurrency } from "./Tokens";
import { PeriodToggle, VenueIcon, SectionLabel } from "./Ui";

const O = {
  primary: "#FFA629",
  primaryBg: "#FF8E0033",
  primaryDark: "#E08A00",
  primarySoft: "rgba(255,166,41,0.12)",
  white: "#FFFFFF",
  offWhite: "#FFF8EE",
  text: "#1A0F00",
  textMuted: "#7A5C30",
  cardBg: "#FFFFFF",
  border: "rgba(255,166,41,0.20)",
  shadow: "rgba(255,142,0,0.10)",
  bgDeep: "#FFF1D6",
};

interface OverviewTabProps {
  data: StatsData;
  period: string;
  onPeriodChange: (p: string) => void;
}

/* ── Scroll-triggered section wrapper ── */
const InViewSection: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
}> = ({ children, delay = 0, direction = "up" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const initial = {
    opacity: 0,
    y: direction === "up" ? 28 : 0,
    x: direction === "left" ? -24 : direction === "right" ? 24 : 0,
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ── Animated progress bar (fires when in view) ── */
const AnimatedBar: React.FC<{ pct: number }> = ({ pct }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });

  return (
    <div
      ref={ref}
      style={{
        height: 6,
        background: "rgba(255,255,255,0.20)",
        borderRadius: 99,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        style={{
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.92), rgba(255,255,255,0.42))",
          borderRadius: 99,
          boxShadow: "0 0 8px rgba(255,255,255,0.4)",
        }}
      />
    </div>
  );
};

/* ── KPI Card — liquid fill animation ── */
const KpiCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon: React.FC<any>;
  trend?: string;
  index: number;
}> = ({ label, value, sub, icon: Icon, trend, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.09,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.22 } }}
      className="kpi-card"
    >
      {/* Liquid fill blob */}
      <div className="liquid-fill" />

      {/* Top row: label + icon */}
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">
          <Icon size={16} color={O.primary} strokeWidth={2.2} />
        </div>
      </div>

      {/* Value */}
      <p className="kpi-value">{value}</p>

      {/* Bottom row: sub + trend */}
      <div className="kpi-bottom">
        <span className="kpi-sub">{sub}</span>
        {trend && <span className="kpi-trend">▲ {trend}</span>}
      </div>
    </motion.div>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const totalMRR = data.venues
    .filter((v) => v.monthlyChargeEnabled)
    .reduce((s, v) => s + v.monthlyRate * v.activeMonthlySubscriptions, 0);

  const p = period as keyof PeriodTotals;

  // Safe access with fallbacks
  const safeTotalEarnings = data.totalEarnings || { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
  const safeTotalBookings = data.totalBookings || { daily: 0, weekly: 0, monthly: 0, yearly: 0 };

  const getPeriodLabel = () => {
    switch(period) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "yearly": return "This Year";
      default: return period;
    }
  };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: fmtCurrency(safeTotalEarnings[p] || 0),
      sub: getPeriodLabel(),
      icon: DollarSign,
      trend: period === "yearly" ? undefined : "+12.4%",
    },
    {
      label: "Total Bookings",
      value: String(safeTotalBookings[p] || 0),
      sub: getPeriodLabel(),
      icon: CalendarDays,
      trend: period === "yearly" ? undefined : "+8.1%",
    },
    {
      label: "Monthly MRR",
      value: `$${totalMRR.toLocaleString()}`,
      sub: "Recurring",
      icon: Repeat,
    },
    {
      label: "Active Venues",
      value: String(data.venues.length),
      sub: "Operational",
      icon: MapPin,
    },
  ];

  const venueTypeRevenue = (["parking", "garage", "residence"] as const).map(
    (type) => ({
      type,
      total: data.venues
        .filter((v) => v.type === type)
        .reduce((s, v) => s + ((v.earnings?.[p] as number) || 0), 0),
    }),
  );

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        width: "100%",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

        .overview-root, .overview-root * {
          font-family: 'DM Sans', sans-serif !important;
        }

        /* ── KPI card ── */
        .kpi-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px 20px 16px;
          border: 1.5px solid rgba(255,166,41,0.18);
          box-shadow: 0 2px 14px rgba(255,142,0,0.07);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 148px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }

        /* liquid fill blob */
        .kpi-card .liquid-fill {
          position: absolute;
          bottom: -110%;
          left: -10%;
          width: 120%;
          height: 220%;
          background: linear-gradient(180deg, #FFA629 0%, #FF6B00 100%);
          border-radius: 42% 58% 44% 56% / 40% 40% 60% 60%;
          transition:
            bottom 0.72s cubic-bezier(0.33, 1, 0.68, 1),
            border-radius 1.2s ease;
          z-index: 0;
          animation: wobble 3.8s ease-in-out infinite;
          animation-play-state: paused;
        }
        .kpi-card:hover .liquid-fill {
          bottom: -10%;
          border-radius: 46% 54% 50% 50% / 38% 38% 62% 62%;
          animation-play-state: running;
        }
        @keyframes wobble {
          0%   { border-radius: 46% 54% 50% 50% / 38% 38% 62% 62%; }
          25%  { border-radius: 54% 46% 44% 56% / 42% 36% 64% 58%; }
          50%  { border-radius: 48% 52% 56% 44% / 36% 44% 56% 64%; }
          75%  { border-radius: 52% 48% 46% 54% / 44% 38% 62% 56%; }
          100% { border-radius: 46% 54% 50% 50% / 38% 38% 62% 62%; }
        }

        .kpi-card:hover {
          border-color: #E08A00;
          box-shadow: 0 8px 28px rgba(255,142,0,0.28);
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: #9A7B50;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: color 0.28s ease;
        }
        .kpi-card:hover .kpi-label { color: rgba(255,255,255,0.75); }

        .kpi-icon {
          width: 34px; height: 34px;
          border-radius: 12px;
          background: rgba(255,166,41,0.12);
          border: 1px solid rgba(255,166,41,0.22);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.28s ease, border-color 0.28s ease;
          flex-shrink: 0;
        }
        .kpi-card:hover .kpi-icon {
          background: rgba(255,255,255,0.22);
          border-color: rgba(255,255,255,0.30);
        }
        .kpi-card:hover .kpi-icon svg { stroke: #fff !important; color: #fff !important; }

        .kpi-value {
          font-size: 30px;
          font-weight: 800;
          color: #1A0F00;
          margin: 4px 0 0;
          line-height: 1;
          position: relative;
          z-index: 1;
          letter-spacing: -0.5px;
          transition: color 0.28s ease;
        }
        .kpi-card:hover .kpi-value { color: #fff; }

        .kpi-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          position: relative;
          z-index: 1;
        }
        .kpi-sub {
          font-size: 11px;
          color: #9A7B50;
          font-weight: 500;
          text-transform: capitalize;
          transition: color 0.28s ease;
        }
        .kpi-card:hover .kpi-sub { color: rgba(255,255,255,0.70); }

        .kpi-trend {
          font-size: 11px;
          font-weight: 700;
          color: #16a34a;
          background: rgba(22,163,74,0.10);
          padding: 2px 9px;
          border-radius: 99px;
          transition: background 0.28s ease, color 0.28s ease;
        }
        .kpi-card:hover .kpi-trend {
          background: rgba(255,255,255,0.22);
          color: #fff;
        }

        /* ── Revenue type pill cards ── */
        .rev-pill {
          flex: 1; min-width: 140px;
          background: ${O.primary};
          border-radius: 12px;
          padding: 16px 20px;
          border: 1.5px solid ${O.primaryDark};
          display: flex; align-items: center; gap: 13px;
          box-shadow: 0 4px 16px rgba(255,142,0,0.18);
          transition: box-shadow 0.22s ease;
        }
        .rev-pill:hover { box-shadow: 0 8px 28px rgba(255,142,0,0.30); }

        /* ── Venue card ── */
        .venue-card {
          background: ${O.primary};
          border-radius: 12px;
          padding: 18px 22px;
          border: 1.5px solid ${O.primaryDark};
          margin-bottom: 12px;
          box-shadow: 0 4px 18px rgba(255,142,0,0.12);
        }

        /* ── Section label ── */
        .section-sep {
          font-size: 11px; font-weight: 700;
          color: #9A7B50; text-transform: uppercase;
          letter-spacing: 1.5px; margin: 0 0 12px;
        }
      `}</style>

      <div className="overview-root">
        <PeriodToggle period={period} onChange={onPeriodChange} />

        {/* ── KPI Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 26,
          }}
        >
          {kpiCards.map((card, i) => (
            <KpiCard key={card.label} {...card} index={i} />
          ))}
        </div>

        {/* ── Revenue type row ── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 26,
            flexWrap: "wrap",
          }}
        >
          {venueTypeRevenue.map(({ type, total }, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-50px 0px" });
            return (
              <motion.div
                key={type}
                ref={ref}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="rev-pill"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, delay: i * 0.8 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.25)",
                    border: "1px solid rgba(255,255,255,0.30)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VenueIcon type={type} size={19} color={O.white} />
                </motion.div>
                <div>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: O.white,
                      margin: 0,
                    }}
                  >
                    {fmtCurrency(total)}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.72)",
                      margin: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {type}s revenue
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Venues ── */}
        <SectionLabel>Your Venues</SectionLabel>
        {data.venues.length === 0 && (
          <p style={{ color: O.textMuted, textAlign: "center", padding: 48 }}>
            No venues found.
          </p>
        )}

        {data.venues.map((v, i) => {
          const ref = useRef<HTMLDivElement>(null);
          const inView = useInView(ref, { once: true, margin: "-50px 0px" });
          const slotPct = v.slots.total
            ? (v.slots.booked / v.slots.total) * 100
            : 0;

          return (
            <motion.div
              key={v.id}
              ref={ref}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="venue-card"
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.25)",
                    border: "1px solid rgba(255,255,255,0.30)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VenueIcon type={v.type} size={21} color={O.white} />
                </motion.div>

                <div style={{ flex: 1, marginLeft: 13 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: O.white,
                    }}
                  >
                    {v.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.70)",
                    }}
                  >
                    {v.address}
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: "rgba(255,255,255,0.20)",
                    border: "1px solid rgba(255,255,255,0.30)",
                    padding: "7px 16px",
                    borderRadius: 40,
                  }}
                >
                  <span
                    style={{ fontSize: 19, fontWeight: 800, color: O.white }}
                  >
                    {fmtCurrency((v.earnings?.[p] as number) || 0)}
                  </span>
                </motion.div>
              </div>

              {/* Animated progress bar */}
              <AnimatedBar pct={slotPct} />

              {/* Slot stats */}
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                {[
                  { label: "Booked", val: v.slots.booked, color: O.white },
                  {
                    label: "Available",
                    val: v.slots.available,
                    color: "rgba(255,255,255,0.80)",
                  },
                  {
                    label: "Total",
                    val: v.slots.total,
                    color: "rgba(255,255,255,0.60)",
                  },
                ].map((item) => (
                  <motion.div key={item.label} whileHover={{ scale: 1.06 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.val}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "rgba(255,255,255,0.60)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {item.label}
                    </p>
                  </motion.div>
                ))}

                {v.monthlyChargeEnabled && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(255,255,255,0.20)",
                      padding: "4px 12px",
                      borderRadius: 40,
                      border: "1px solid rgba(255,255,255,0.30)",
                    }}
                  >
                    <Repeat size={10} color={O.white} />
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: O.white }}
                    >
                      {v.activeMonthlySubscriptions} monthly
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* ── MRR Banner ── */}
        {(() => {
          const ref = useRef<HTMLDivElement>(null);
          const inView = useInView(ref, { once: true, margin: "-40px 0px" });
          return (
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              style={{
                background: `linear-gradient(135deg, ${O.primaryBg} 0%, rgba(255,166,41,0.04) 100%)`,
                border: `1.5px solid rgba(255,166,41,0.28)`,
                borderRadius: 22,
                padding: "24px 28px",
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: O.primarySoft,
                    border: `1px solid ${O.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Crown size={20} color={O.primary} />
                </motion.div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      margin: 0,
                      color: O.text,
                    }}
                  >
                    Monthly Recurring Revenue
                  </p>
                  <p style={{ color: O.textMuted, fontSize: 12, margin: 0 }}>
                    Active subscriptions across all venues
                  </p>
                </div>
              </div>

              <motion.p
                animate={inView ? { scale: [1, 1.04, 1] } : {}}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: O.primary,
                  letterSpacing: "-2px",
                  margin: 0,
                }}
              >
                ${totalMRR.toLocaleString()}
              </motion.p>
            </motion.div>
          );
        })()}
      </div>
    </div>
  );
};

export default OverviewTab;