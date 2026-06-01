import { useState, useEffect, useCallback } from "react";
import { GLOBAL_CSS } from "./Tokens";
import { useStats } from "./Hooks";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./Topbar";
import { Spinner, ErrorBanner } from "./Ui";
import { OverviewTab } from "./Overviewtab";
import { SlotsTab } from "./Slotstab";
import { BookingsTab } from "./Bookingstab";
import MonthlyTab from "./Monthlytab";
import DailyTab from "./Dailytab";
import { DryCleaningTab } from "./Drycleaningtab";
import { SubAccountsTab } from "./Subaccountstab";
import ResetPassword from "./Resetpassword"; 
import { Menu, X } from "lucide-react";

interface DashboardPageProps {
  token?: string;
  user?: { firstName?: string };
  onLogout?: () => void;
}

// Tabs that fetch their own data or don't need the stats hook
const STANDALONE_TABS = ["dryCleaning", "subAccounts", "daily", "resetPassword"];

export default function DashboardPage({
  token,
  user,
  onLogout,
}: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("weekly");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { data, loading, error, refetch } = useStats(token);
  const [refreshing, setRefreshing] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile drawer on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) setMobileOpen(false);
  };

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = mobileOpen ? "hidden" : "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isMobile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const SIDEBAR_W = isMobile ? 0 : collapsed ? 68 : 240;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow-x: hidden; }

        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 14px;
          left: 16px;
          z-index: 1100;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #FFA629;
          border: none;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(255,166,41,0.40);
          transition: transform 0.15s;
        }

        .mobile-menu-btn:active {
          transform: scale(0.93);
        }

        .sidebar-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 1050;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .sidebar-drawer {
          transition: transform 0.32s cubic-bezier(0.4,0,0.2,1) !important;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .sidebar-drawer {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 1060 !important;
            transform: translateX(-100%);
            width: 260px !important;
            min-width: 260px !important;
            max-width: 260px !important;
          }

          .sidebar-drawer.open {
            transform: translateX(0);
          }

          .sidebar-backdrop.open {
            display: block;
          }

          .dashboard-main {
            margin-left: 0 !important;
          }

          .dashboard-content {
            padding: 72px 16px 32px !important;
          }

          .topbar-inner {
            padding-left: 64px !important;
          }
        }

        @media (min-width: 769px) {
          .sidebar-collapse-btn {
            display: flex !important;
          }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#F7F3EE",
        }}
      >
        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X size={20} color="#fff" />
          ) : (
            <Menu size={20} color="#fff" />
          )}
        </button>

        {/* Sidebar */}
        <div className={`sidebar-drawer${mobileOpen ? " open" : ""}`}>
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            user={user || { firstName: "Merchant" }}
            onLogout={onLogout || (() => {})}
            collapsed={isMobile ? false : collapsed}
            onToggle={() => {
              if (isMobile) {
                setMobileOpen(false);
              } else {
                setCollapsed((c) => !c);
              }
            }}
          />
        </div>

        {/* Main content */}
        <div
          className="dashboard-main"
          style={{
            flex: 1,
            marginLeft: SIDEBAR_W,
            transition: "margin-left 0.32s cubic-bezier(0.4,0,0.2,1)",
            minWidth: 0,
          }}
        >
          <TopBar
            activeTab={activeTab}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            sidebarCollapsed={collapsed}
          />

          <div
            className="dashboard-content"
            style={{
              padding: "82px 32px 40px",
              minHeight: "100vh",
            }}
          >
            {/* ── Standalone tabs (manage their own data / no stats hook needed) ── */}
            {activeTab === "dryCleaning" && <DryCleaningTab token={token} />}
            {activeTab === "subAccounts" && <SubAccountsTab />}
            {activeTab === "daily" && <DailyTab token={token} user={user} />}

            {/* ── Reset Password tab ── */}
            {activeTab === "resetPassword" && (
              <ResetPassword onBack={() => setActiveTab("overview")} />
            )}

            {/* ── Stats-dependent tabs ── */}
            {!STANDALONE_TABS.includes(activeTab) &&
              (loading ? (
                <Spinner />
              ) : error ? (
                <ErrorBanner msg={error} onRetry={refetch} />
              ) : data ? (
                <>
                  {activeTab === "overview" && (
                    <OverviewTab
                      data={data}
                      period={period}
                      onPeriodChange={setPeriod}
                    />
                  )}

                  {activeTab === "slots" && <SlotsTab data={data} />}

                  {activeTab === "bookings" && <BookingsTab data={data} />}

                  {activeTab === "monthly" && (
                    <MonthlyTab data={data} token={token} user={user} />
                  )}
                </>
              ) : null)}
          </div>
        </div>
      </div>
    </>
  );
}