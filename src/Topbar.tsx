import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Bell } from "lucide-react";
import { C } from "./Tokens";

const TAB_LABELS: Record<string, string> = {
  overview: "Command Centre",
  slots: "Slot Map",
  bookings: "Activity Log",
  monthly: "Recurring Hub",
  dryCleaning: "Laundry Suite",
  subAccounts: "Team Management",
};

const TAB_SUBS: Record<string, string> = {
  overview: "Revenue & performance overview",
  slots: "Live availability across venues",
  bookings: "Recent booking activity",
  monthly: "Subscription management",
  dryCleaning: "Laundry orders & shops",
  subAccounts: "Manage team access",
};

interface TopBarProps {
  activeTab: string;
  onRefresh: () => void;
  refreshing: boolean;
  sidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onRefresh,
  refreshing,
  sidebarCollapsed,
}) => {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () =>
        setTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        ),
      15000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: sidebarCollapsed ? 68 : 240,
        zIndex: 50,
        height: 64,
        background: "rgba(247,243,238,0.88)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 16,
        transition: "left 0.32s cubic-bezier(0.4,0,0.2,1)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Title & Subtitle */}
      <div style={{ flex: 1 }}>
        <motion.h1
          key={activeTab}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: C.text,
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {TAB_LABELS[activeTab] || "Dashboard"}
        </motion.h1>
        <motion.p
          key={`sub-${activeTab}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          style={{
            fontSize: 11,
            color: C.gray,
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {TAB_SUBS[activeTab]} · {time}
        </motion.p>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        {/* Live badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: C.card,
            padding: "6px 14px",
            borderRadius: 40,
            border: `1.5px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 7,
            boxShadow: "0 2px 8px rgba(28,20,16,0.07)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.success,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.textSub,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Live
          </span>
        </motion.div>

        {/* Refresh button */}
        <motion.button
          whileHover={{
            scale: 1.1,
            background: C.brand,
            borderColor: C.brand,
          }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: C.brandLight,
            border: `1.5px solid ${C.brand}22`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s, border-color 0.2s",
            outline: "none",
          }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              refreshing
                ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : { duration: 0 }
            }
          >
            <RefreshCw
              size={15}
              color={C.brand}
              style={refreshing ? { color: "#fff" } : {}}
            />
          </motion.div>
        </motion.button>

        {/* Notification bell */}
        <motion.button
          whileHover={{
            scale: 1.1,
            boxShadow: "0 4px 12px rgba(28,20,16,0.12)",
          }}
          whileTap={{
            scale: 0.9,
            rotate: -10,
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: C.card,
            border: `1.5px solid ${C.border}`,
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
          }}
        >
          <Bell size={15} color={C.gray} />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.brand,
            }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TopBar;
