import { useState, useEffect } from 'react';
import LoginPage from './Loginpage';
import DashboardPage from './Dashboardpage';
import type { MerchantUser } from './types/Index';

const TOKEN_KEY = 'merchant_token';
const USER_KEY  = 'merchant_user';

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<MerchantUser | null>(() => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as MerchantUser) : null;
    } catch {
      return null;
    }
  });

  // Lock/unlock body scroll when needed (e.g. mobile modal open)
  useEffect(() => {
    document.documentElement.style.setProperty('box-sizing', 'border-box');
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, maximum-scale=1';
      document.head.appendChild(m);
    }
  }, []);

  const handleLogin = (tok: string, usr: MerchantUser) => {
    sessionStorage.setItem(TOKEN_KEY, tok);
    sessionStorage.setItem(USER_KEY, JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          margin: 0; padding: 0;
          overflow-x: hidden;
          -webkit-text-size-adjust: 100%;
        }
        img, svg { max-width: 100%; }

        /* Responsive dashboard shell */
        @media (max-width: 768px) {
          /* Collapse sidebar to bottom nav on mobile */
          .sidebar-desktop { display: none !important; }
          .dashboard-content {
            margin-left: 0 !important;
            padding: 70px 16px 80px !important;
          }
          .topbar { left: 0 !important; padding: 0 16px !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav { display: none !important; }
          .sidebar-desktop { display: flex !important; }
        }

        /* Mobile bottom nav */
        .mobile-bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
          background: #fff; border-top: 1px solid #eee;
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
          justify-content: space-around; align-items: center;
          box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
        }

        /* Fluid text & spacing */
        @media (max-width: 480px) {
          .page-title { font-size: 20px !important; }
          .stat-card-value { font-size: 22px !important; }
          .mrr-hero-amount { font-size: 32px !important; }
        }

        /* Tables/grids that overflow on mobile */
        .overflow-x-auto { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        /* Touch-friendly tap targets */
        button, a { min-height: 36px; }
      `}</style>

      <DashboardPage
        token={token}
        user={user ?? {}}
        onLogout={handleLogout}
      />
    </>
  );
}