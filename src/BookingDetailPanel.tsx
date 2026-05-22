import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft,
  Car,
  Warehouse,
  Home,
  Phone,
  Mail,
  LogOut,
  RefreshCw,
  User,
} from "lucide-react";

type BookingType = "parking" | "garage" | "residence";
interface BookingDetail {
  _id: string;
  bookingId: string;
  orderNumber: string;
  status: any;
  createdAt: string;
  vehicleNumber: string;
  totalAmount: number;
  bookingPeriod?: { from: string; to: string };
  placeInfo?: { name: string; address: string; phoneNo: string };
  slot?: string;
  type: BookingType;
  paymentMethod?: string;
  paymentStatus?: string;
  user?: { firstName: string; lastName: string; phone: string; email?: string };
}
interface Props {
  bookingData: BookingDetail;
  onBack: () => void;
}

const O = {
  primary: "#FFA629",
  primaryDark: "#E08A00",
  primaryLight: "rgba(255,166,41,0.12)",
  primaryBorder: "rgba(255,166,41,0.30)",
  card: "#FFFFFF",
  cardBorder: "rgba(255,166,41,0.25)",
  text: "#1A0F00",
  muted: "#8A7560",
  divider: "rgba(255,166,41,0.15)",
  shadow: "rgba(255,142,0,0.10)",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" },
  }),
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" },
  }),
};

const getStatusStyle = (status: string) => {
  const s = (status || "").toUpperCase();
  if (["SUCCESS", "CONFIRMED", "ACTIVE", "COMPLETED"].includes(s))
    return { bg: O.success, color: "#fff" };
  if (["PENDING", "IN_PROGRESS"].includes(s))
    return { bg: O.warning, color: "#fff" };
  return { bg: O.error, color: "#fff" };
};

const TypeIcon = ({
  type,
  size = 24,
}: {
  type: BookingType;
  size?: number;
}) => {
  if (type === "parking") return <Car size={size} color="#FFFFFF" />;
  if (type === "garage") return <Warehouse size={size} color="#FFFFFF" />;
  return <Home size={size} color="#FFFFFF" />;
};

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "N/A";
  }
};

const InfoRow = ({
  label,
  value,
  valueColor,
  delay = 0,
}: {
  label: string;
  value: string;
  valueColor?: string;
  delay?: number;
}) => (
  <motion.div
    custom={delay}
    variants={slideIn}
    initial="hidden"
    animate="visible"
    whileHover={{
      backgroundColor: "rgba(255,166,41,0.05)",
      scale: 1.01,
      transition: { duration: 0.2 },
    }}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 16px",
      borderBottom: "1px solid " + O.divider,
      borderRadius: 12,
      cursor: "default",
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <span style={{ fontSize: 13, color: O.muted, fontWeight: 500 }}>
      {label}
    </span>
    <motion.span
      whileHover={{ scale: 1.05 }}
      style={{ fontSize: 14, fontWeight: 700, color: valueColor || O.text }}
    >
      {value}
    </motion.span>
  </motion.div>
);

const Section = ({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) => (
  <motion.div
    custom={delay}
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    whileHover={{
      boxShadow: "0 8px 28px rgba(255,142,0,0.15)",
      y: -2,
      transition: { duration: 0.3 },
    }}
    style={{
      background: O.card,
      borderRadius: 20,
      border: "1.5px solid " + O.cardBorder,
      padding: "20px 22px",
      marginBottom: 16,
      boxShadow: "0 4px 18px " + O.shadow,
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <motion.h3
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay * 0.07 + 0.2 }}
        style={{
          margin: 0,
          color: O.text,
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {title}
      </motion.h3>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 40 }}
        transition={{ delay: delay * 0.07 + 0.4, duration: 0.5 }}
        style={{
          height: 3,
          borderRadius: 999,
          background:
            "linear-gradient(90deg," + O.primary + "," + O.primaryDark + ")",
        }}
      />
    </div>
    {children}
  </motion.div>
);

export default function BookingDetailPanel({ bookingData, onBack }: Props) {
  const [booking] = useState(bookingData);
  const st = getStatusStyle(booking.status);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      style={{
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        paddingBottom: 50,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Back button */}
      <motion.button
        whileHover={{ x: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: O.primaryLight,
          border: "1.5px solid " + O.primaryBorder,
          color: O.primaryDark,
          cursor: "pointer",
          padding: "11px 18px",
          borderRadius: 14,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 22,
        }}
      >
        <ArrowLeft size={16} color={O.primaryDark} />
        Back to Bookings
      </motion.button>

      {/* Hero header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.01 }}
        style={{
          background:
            "linear-gradient(135deg, " +
            O.primary +
            " 0%, " +
            O.primaryDark +
            " 100%)",
          borderRadius: 24,
          padding: "28px",
          marginBottom: 20,
          boxShadow: "0 8px 32px rgba(255,142,0,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "rgba(255,255,255,0.22)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TypeIcon type={booking.type} size={32} />
            </motion.div>
            <div>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.80)",
                  fontSize: 11,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Booking Details
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                style={{
                  margin: "6px 0 4px",
                  color: "#FFFFFF",
                  fontSize: 30,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {booking.orderNumber}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: "capitalize",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {booking.type} Booking
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
            whileHover={{ scale: 1.05 }}
            style={{
              background: "rgba(255,255,255,0.20)",
              border: "1.5px solid rgba(255,255,255,0.30)",
              borderRadius: 18,
              padding: "16px 22px",
              textAlign: "right",
              minWidth: 160,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.80)",
                fontSize: 11,
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Total Amount
            </p>
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                margin: "8px 0 0",
                color: "#FFFFFF",
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: "-1.5px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ${booking.totalAmount?.toFixed(2)}
            </motion.h2>
          </motion.div>
        </div>
      </motion.div>

      {/* Status badge */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: 20 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: st.bg + "18",
            border: "1.5px solid " + st.bg + "40",
            padding: "10px 18px",
            borderRadius: 999,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: st.bg,
            }}
          />
          <span
            style={{
              color: st.bg,
              fontWeight: 800,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {booking.status}
          </span>
        </motion.div>
      </motion.div>

      {/* Sections */}
      <Section title="Booking Information" delay={2}>
        <InfoRow label="Order Number" value={booking.orderNumber} delay={0} />
        <InfoRow
          label="Vehicle Number"
          value={booking.vehicleNumber}
          valueColor={O.primary}
          delay={1}
        />
        <InfoRow label="Booking ID" value={booking.bookingId} delay={2} />
        <InfoRow
          label="Created At"
          value={fmtDate(booking.createdAt)}
          delay={3}
        />
        {booking.slot && (
          <InfoRow label="Slot" value={String(booking.slot)} delay={4} />
        )}
        {booking.bookingPeriod && (
          <>
            <InfoRow
              label="From"
              value={fmtDate(booking.bookingPeriod.from)}
              delay={5}
            />
            <InfoRow
              label="To"
              value={fmtDate(booking.bookingPeriod.to)}
              delay={6}
            />
          </>
        )}
      </Section>

      {booking.placeInfo && (
        <Section title="Venue" delay={3}>
          <InfoRow label="Name" value={booking.placeInfo.name} delay={0} />
          <InfoRow
            label="Address"
            value={booking.placeInfo.address}
            delay={1}
          />
          <InfoRow label="Phone" value={booking.placeInfo.phoneNo} delay={2} />
        </Section>
      )}

      {booking.user && (
        <Section title="Customer" delay={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: O.primaryLight,
                border: "1.5px solid " + O.primaryBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={24} color={O.primary} />
            </motion.div>
            <div>
              <h3
                style={{
                  margin: "0 0 2px",
                  color: O.text,
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {booking.user.firstName} {booking.user.lastName}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: O.muted,
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Customer
              </p>
            </div>
          </motion.div>
          <InfoRow label="Phone" value={booking.user.phone} delay={1} />
          {booking.user.email && (
            <InfoRow label="Email" value={booking.user.email} delay={2} />
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href={"tel:" + booking.user.phone}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: O.primary,
                padding: "13px",
                borderRadius: 14,
                textDecoration: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 6px 18px rgba(255,166,41,0.30)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Phone size={15} /> Call
            </motion.a>
            {booking.user.email && (
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={"mailto:" + booking.user.email}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: O.primaryLight,
                  border: "1.5px solid " + O.primaryBorder,
                  padding: "13px",
                  borderRadius: 14,
                  textDecoration: "none",
                  color: O.primaryDark,
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Mail size={15} color={O.primaryDark} /> Email
              </motion.a>
            )}
          </div>
        </Section>
      )}

      <Section title="Payment Details" delay={5}>
        <InfoRow
          label="Amount"
          value={"$" + booking.totalAmount?.toFixed(2)}
          valueColor={O.success}
          delay={0}
        />
        <InfoRow
          label="Payment Method"
          value={booking.paymentMethod || "N/A"}
          delay={1}
        />
        <InfoRow
          label="Payment Status"
          value={booking.paymentStatus || "N/A"}
          valueColor={st.bg}
          delay={2}
        />
      </Section>

      {/* Action buttons */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}
      >
        <motion.button
          whileHover={{
            scale: 1.03,
            y: -3,
            boxShadow: "0 12px 28px rgba(255,166,41,0.40)",
          }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          style={{
            flex: 1,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background:
              "linear-gradient(135deg, " +
              O.primary +
              " 0%, " +
              O.primaryDark +
              " 100%)",
            border: "none",
            borderRadius: 16,
            padding: "16px",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(255,166,41,0.30)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={17} />
          </motion.div>
          Update Status
        </motion.button>
        <motion.button
          whileHover={{
            scale: 1.03,
            y: -3,
            backgroundColor: "rgba(239,68,68,0.15)",
          }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.49 }}
          style={{
            flex: 1,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "rgba(239,68,68,0.10)",
            border: "1.5px solid rgba(239,68,68,0.25)",
            borderRadius: 16,
            padding: "16px",
            color: "#EF4444",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <LogOut size={17} /> Cancel Booking
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
