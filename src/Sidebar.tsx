import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Grid,
  List,
  Repeat,
  Clock,
  Shirt,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  KeyRound,
} from "lucide-react";
import { logoSrc } from "./assets/images";

export const NAV_ITEMS = [
  { key: "overview",      label: "Overview",        Icon: LayoutDashboard, badge: null },
  { key: "slots",         label: "Slots",            Icon: Grid,            badge: null },
  { key: "bookings",      label: "Bookings",         Icon: List,            badge: "12" },
  { key: "monthly",       label: "Monthly/Permit",   Icon: Repeat,          badge: null },
  { key: "daily",         label: "Daily",            Icon: Clock,           badge: null },
  { key: "dryCleaning",   label: "Laundry",          Icon: Shirt,           badge: "3"  },
  { key: "subAccounts",   label: "Team",             Icon: Users,           badge: null },
];

// Bottom utility items — rendered separately above logout
export const UTILITY_ITEMS = [
  { key: "resetPassword", label: "Reset Password", Icon: KeyRound, badge: null },
];

const S = {
  bg:            "#FDEFD4",
  bgDark:        "#F8E4B8",
  active:        "#FFA629",
  activeText:    "#FFFFFF",
  iconRest:      "#FFA629",
  labelRest:     "#3D2800",
  labelMuted:    "#B07D3A",
  border:        "rgba(255,166,41,0.18)",
  shadow:        "rgba(255,142,0,0.14)",
  divider:       "rgba(255,166,41,0.20)",
  logoutBg:      "#EF4444",
  logoutText:    "#FFFFFF",
  badgeBg:       "rgba(255,166,41,0.18)",
  badgeText:     "#FFA629",
  badgeActive:   "#FFFFFF",
  badgeActiveTxt:"#FFA629",
  hoverBg:       "rgba(255,166,41,0.12)",
  hoverBorder:   "rgba(255,166,41,0.25)",
};

interface SidebarProps {
  activeTab:    string;
  onTabChange:  (t: string) => void;
  user:         { firstName?: string };
  onLogout:     () => void;
  collapsed:    boolean;
  onToggle:     () => void;
}

/** Shared nav button used for both main nav and utility items */
const NavButton: React.FC<{
  navKey:    string;
  label:     string;
  Icon:      React.FC<any>;
  badge:     string | null;
  active:    boolean;
  collapsed: boolean;
  onClick:   () => void;
}> = ({ navKey, label, Icon, badge, active, collapsed, onClick }) => (
  <motion.button
    key={navKey}
    animate={{
      background: active ? S.active : "transparent",
      boxShadow:  active ? `0 6px 18px ${S.shadow}` : "0px 0px 0px rgba(0,0,0,0)",
    }}
    whileHover={
      active
        ? { scale: 1.02 }
        : { scale: 1.03, background: S.hoverBg }
    }
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    style={{
      width:           "100%",
      border:          active ? "none" : "1px solid transparent",
      outline:         "none",
      cursor:          "pointer",
      display:         "flex",
      alignItems:      "center",
      gap:             12,
      padding:         collapsed ? "13px 0" : "13px 16px",
      borderRadius:    12,
      color:           active ? S.activeText : S.labelRest,
      position:        "relative",
      justifyContent:  collapsed ? "center" : "flex-start",
      fontFamily:      "'DM Sans', sans-serif",
    }}
  >
    <Icon
      size={19}
      color={active ? S.activeText : S.iconRest}
      style={{ flexShrink: 0 }}
    />

    {!collapsed && (
      <>
        <span
          style={{
            flex:       1,
            textAlign:  "left",
            fontSize:   14,
            fontWeight: active ? 700 : 500,
            color:      active ? S.activeText : S.labelRest,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            style={{
              minWidth:        22,
              height:          22,
              borderRadius:    999,
              background:      active ? S.badgeActive : S.badgeBg,
              color:           active ? S.badgeActiveTxt : S.badgeText,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        11,
              fontWeight:      700,
              padding:         "0 5px",
              fontFamily:      "'DM Sans', sans-serif",
            }}
          >
            {badge}
          </span>
        )}
      </>
    )}

    {/* Collapsed badge dot */}
    {collapsed && badge && (
      <span
        style={{
          position:     "absolute",
          top:          6,
          right:        10,
          width:        8,
          height:       8,
          borderRadius: "25%",
          background:   S.active,
          border:       `2px solid ${S.bg}`,
        }}
      />
    )}
  </motion.button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogout,
  collapsed,
  onToggle,
}) => {
  return (
    <>
      {/* ── Toggle button (lives outside sidebar so it's never clipped) ── */}
      <motion.button
        animate={{ left: collapsed ? 67 : 227 }}
        transition={{ duration: 0.32, ease: [0.25, 0.25, 0, 1] }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position:       "fixed",
          top:            28,
          zIndex:         200,
          width:          28,
          height:         28,
          borderRadius:   "25%",
          border:         `2px solid rgba(255,166,41,0.35)`,
          cursor:         "pointer",
          background:     S.active,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 4px 16px rgba(255,142,0,0.40)",
          outline:        "none",
          padding:        0,
        }}
      >
        {collapsed
          ? <ChevronRight size={13} color="#fff" strokeWidth={2.5} />
          : <ChevronLeft  size={13} color="#fff" strokeWidth={2.5} />}
      </motion.button>

      {/* ── Sidebar panel ── */}
      <motion.div
        animate={{ width: collapsed ? 80 : 240 }}
        transition={{ duration: 0.32, ease: [0.25, 0.25, 0, 1] }}
        style={{
          minHeight:    "100vh",
          background:   S.bg,
          display:      "flex",
          flexDirection:"column",
          position:     "fixed",
          top:          0,
          left:         0,
          bottom:       0,
          zIndex:       100,
          overflow:     "hidden",
          borderRight:  `1px solid ${S.divider}`,
          boxShadow:    `4px 0 24px ${S.shadow}`,
          fontFamily:   "'DM Sans', sans-serif",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            padding:        collapsed ? "22px 0" : "22px 20px",
            display:        "flex",
            alignItems:     "center",
            gap:            12,
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom:   `1px solid ${S.divider}`,
            minHeight:      80,
          }}
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.08 }}
            style={{
              width:          44,
              height:         44,
              borderRadius:   12,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              overflow:       "hidden",
              flexShrink:     0,
            }}
          >
            <img
              src={logoSrc}
              alt="Vervoer Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </motion.div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x:  0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22 }}
            >
              <h2
                style={{
                  margin:        0,
                  color:         S.labelRest,
                  fontSize:      20,
                  fontWeight:    900,
                  letterSpacing: "-0.5px",
                  fontFamily:    "'DM Sans', sans-serif",
                }}
              >
                Vervoer
              </h2>
              <p
                style={{
                  margin:         0,
                  color:          S.labelMuted,
                  fontSize:       10,
                  letterSpacing:  "1.8px",
                  textTransform:  "uppercase",
                  fontWeight:     600,
                  fontFamily:     "'DM Sans', sans-serif",
                }}
              >
                Merchant Panel
              </p>
            </motion.div>
          )}
        </div>

        {/* ── Main Navigation ── */}
        <div style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_ITEMS.map(({ key, label, Icon, badge }) => (
              <NavButton
                key={key}
                navKey={key}
                label={label}
                Icon={Icon}
                badge={badge}
                active={activeTab === key}
                collapsed={collapsed}
                onClick={() => onTabChange(key)}
              />
            ))}
          </div>
        </div>

        {/* ── Utility section (Reset Password etc.) ── */}
        <div
          style={{
            padding:    "8px 10px",
            borderTop:  `1px solid ${S.divider}`,
          }}
        >
          {!collapsed && (
            <p
              style={{
                fontSize:      10,
                fontWeight:    700,
                color:         S.labelMuted,
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                padding:       "4px 6px 8px",
                margin:        0,
                fontFamily:    "'DM Sans', sans-serif",
              }}
            >
              Settings
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {UTILITY_ITEMS.map(({ key, label, Icon, badge }) => (
              <NavButton
                key={key}
                navKey={key}
                label={label}
                Icon={Icon}
                badge={badge}
                active={activeTab === key}
                collapsed={collapsed}
                onClick={() => onTabChange(key)}
              />
            ))}
          </div>
        </div>

        {/* ── User + Logout ── */}
        <div
          style={{
            padding:   "12px 10px 16px",
            borderTop: `1px solid ${S.divider}`,
          }}
        >
          {!collapsed ? (
            <motion.div
              whileHover={{
                scale:           1.01,
                backgroundColor: S.hoverBg,
                border:          `1px solid ${S.hoverBorder}`,
                transition:      { duration: 0.2 },
              }}
              style={{
                padding:      "12px 14px",
                borderRadius: 12,
                background:   S.bgDark,
                border:       `1px solid ${S.border}`,
                marginBottom: 10,
                display:      "flex",
                alignItems:   "center",
                gap:          11,
                fontFamily:   "'DM Sans', sans-serif",
              }}
            >
              <div
                style={{
                  width:          42,
                  height:         42,
                  borderRadius:   "25%",
                  background:     `linear-gradient(135deg, ${S.active} 0%, #E08A00 100%)`,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  color:          "#fff",
                  fontWeight:     800,
                  fontSize:       16,
                  flexShrink:     0,
                  fontFamily:     "'DM Sans', sans-serif",
                }}
              >
                {user?.firstName?.[0]?.toUpperCase() || "M"}
              </div>
              <div>
                <p
                  style={{
                    margin:     0,
                    color:      S.labelRest,
                    fontWeight: 700,
                    fontSize:   13,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {user?.firstName || "Merchant"}
                </p>
                <p
                  style={{
                    margin:     0,
                    color:      S.labelMuted,
                    fontSize:   11,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Admin
                </p>
              </div>
            </motion.div>
          ) : (
            <div
              style={{
                width:          42,
                height:         42,
                borderRadius:   "50%",
                background:     `linear-gradient(135deg, ${S.active} 0%, #E08A00 100%)`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                color:          "#fff",
                fontWeight:     800,
                fontSize:       16,
                margin:         "0 auto 10px",
                fontFamily:     "'DM Sans', sans-serif",
              }}
            >
              {user?.firstName?.[0]?.toUpperCase() || "M"}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "#DC2626", transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            style={{
              width:          "100%",
              outline:        "none",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap:            10,
              padding:        collapsed ? "13px 0" : "13px 16px",
              borderRadius:   12,
              background:     S.logoutBg,
              border:         "none",
              color:          S.logoutText,
              fontWeight:     700,
              fontSize:       14,
              boxShadow:      "0 4px 14px rgba(239,68,68,0.25)",
              fontFamily:     "'DM Sans', sans-serif",
              transition:     "background 0.2s ease",
            }}
          >
            <LogOut size={17} color={S.logoutText} />
            {!collapsed && <span>Sign Out</span>}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;