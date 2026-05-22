import React, { useState } from "react";
import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { StatsData } from "./Tokens";
import { VenueIcon } from "./Ui";

interface SlotsTabProps {
  data: StatsData;
}

const O = {
  primary: "#FFA629",
  primaryBg: "rgba(255,166,41,0.10)",
  primaryBorder: "rgba(255,166,41,0.55)",
  card: "#FFFFFF",
  cardBorder: "rgba(255,166,41,0.50)",
  text: "#1A0F00",
  muted: "#8A7560",
  slotBooked: "#4B9EFF", // blue dot — booked
  slotMonthly: "#FFA629", // orange dot — monthly
  slotAvail: "#D1D5DB", // grey dot — available
  success: "#22C55E",
  pillBg: "rgba(255,166,41,0.12)",
  pillActiveBg: "#FFA629",
  pillText: "#FFA629",
  pillActiveText: "#FFFFFF",
};

// Filter definitions — each has a label and a predicate on fill %
const FILTERS = [
  { label: "All", test: (_pct: number) => true },
  { label: "0% filled", test: (pct: number) => pct === 0 },
  { label: "≤25% filled", test: (pct: number) => pct > 0 && pct <= 25 },
  { label: "≤50% filled", test: (pct: number) => pct > 25 && pct <= 50 },
  { label: ">50% filled", test: (pct: number) => pct > 50 },
];

// Animation variants with proper typing
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    } as Transition,
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export const SlotsTab: React.FC<SlotsTabProps> = ({ data }) => {
  const [activeFilter, setActiveFilter] = useState(0);

  // compute pct per venue once, then filter
  const venuesWithPct = data.venues.map((v) => ({
    ...v,
    pct: v.slots.total ? Math.round((v.slots.booked / v.slots.total) * 100) : 0,
  }));

  const filtered = venuesWithPct.filter((v) =>
    FILTERS[activeFilter].test(v.pct),
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
      {/* ── Filter Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-flex",
          gap: 6,
          background: O.primaryBg,
          border: `1.5px solid ${O.primaryBorder}`,
          borderRadius: 40,
          padding: "6px 8px",
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {FILTERS.map((f, i) => (
          <motion.button
            key={f.label}
            onClick={() => setActiveFilter(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: activeFilter === i ? [1, 0.95, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "5px 16px",
              borderRadius: 30,
              border: "none",
              outline: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              background: activeFilter === i ? O.pillActiveBg : "transparent",
              color: activeFilter === i ? O.pillActiveText : O.pillText,
              transition: "all 0.2s ease",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {f.label}
          </motion.button>
        ))}
      </motion.div>

      {/* ── 3-column Card Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <AnimatePresence mode="wait">
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "48px 0",
                color: O.muted,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              No venues match this filter.
            </motion.div>
          )}

          {filtered.map((venue) => {
            const { booked, total } = venue.slots;

            return (
              <motion.div
                key={venue.id}
                variants={cardVariants}
                layout
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  boxShadow: "0 12px 28px rgba(255,142,0,0.20)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: O.card,
                  borderRadius: 18,
                  padding: "18px 20px 16px",
                  border: `1.5px solid ${O.cardBorder}`,
                  boxShadow: "0 2px 12px rgba(255,142,0,0.07)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {/* ── Header ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  {/* Icon badge */}
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring" as const, stiffness: 300 }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: O.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(255,166,41,0.35)",
                    }}
                  >
                    <VenueIcon type={venue.type} size={20} color="#FFFFFF" />
                  </motion.div>

                  {/* Name + address */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: O.text,
                        fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {venue.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: O.muted,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {venue.address}
                    </p>
                  </div>
                </div>

                {/* ── Slot dot grid ── */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  {Array.from({ length: total }).map((_, i) => {
                    const isMonthly =
                      venue.monthlyChargeEnabled &&
                      i < venue.activeMonthlySubscriptions;
                    const isBooked = i < booked;
                    const dotColor = isMonthly
                      ? O.slotMonthly
                      : isBooked
                        ? O.slotBooked
                        : O.slotAvail;

                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: i * 0.03,
                          type: "spring" as const,
                          stiffness: 200,
                        }}
                        whileHover={{ scale: 1.2 }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background:
                            isBooked || isMonthly ? `${dotColor}18` : "#F3F4F6",
                          border: `1.5px solid ${isBooked || isMonthly ? dotColor + "40" : "#E5E7EB"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: isBooked || isMonthly ? [1, 1.2, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: isBooked || isMonthly ? Infinity : 0,
                            ease: "easeInOut",
                          }}
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: dotColor,
                            opacity: isBooked || isMonthly ? 1 : 0.4,
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Legend ── */}
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {[
                    { label: "Booked", color: O.slotBooked },
                    { label: "Monthly", color: O.slotMonthly },
                    { label: "Available", color: O.success },
                  ].map((l) => (
                    <motion.div
                      key={l.label}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: l.color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: O.muted,
                          fontWeight: 500,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {l.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SlotsTab;
