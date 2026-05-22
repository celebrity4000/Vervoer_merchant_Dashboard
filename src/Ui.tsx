import React from 'react';
import {
  Loader2, AlertCircle, Car, Warehouse, Home,
  ArrowUpRight,
} from 'lucide-react';
import { C, PERIOD_LABEL } from './Tokens';

// ─── VenueIcon ────────────────────────────────────────────────────────────────
export const VenueIcon = ({
  type, size = 18, color,
}: { type: string; size?: number; color: string }) => {
  if (type === 'parking')  return <Car      size={size} color={color} />;
  if (type === 'garage')   return <Warehouse size={size} color={color} />;
  return                          <Home      size={size} color={color} />;
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({
  color = C.brand, size = 30,
}: { color?: string; size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 72 }}>
    <Loader2 size={size} color={color} style={{ animation: 'spin 1s linear infinite' }} />
  </div>
);

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export const ErrorBanner = ({
  msg, onRetry,
}: { msg: string; onRetry?: () => void }) => (
  <div style={{
    background: C.errorBg, border: `1px solid rgba(176,58,46,0.22)`,
    borderRadius: 16, padding: '18px 24px',
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22,
  }}>
    <AlertCircle size={20} color={C.error} />
    <span style={{ color: C.error, fontWeight: 600, flex: 1, fontSize: 14 }}>{msg}</span>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
        Retry
      </button>
    )}
  </div>
);

// ─── PeriodToggle ─────────────────────────────────────────────────────────────
export const PeriodToggle = ({
  period, onChange,
}: { period: string; onChange: (p: string) => void }) => (
  <div style={{
    display: 'flex', background: C.bgDeep,
    borderRadius: 40, padding: 4, gap: 2,
    width: 'fit-content', marginBottom: 22,
    border: `1.5px solid ${C.border}`,
  }}>
    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
      <button key={p} onClick={() => onChange(p)} className="period-btn" style={{
        background: period === p
          ? `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`
          : 'none',
        color: period === p ? '#fff' : C.gray,
        boxShadow: period === p ? `0 4px 12px rgba(184,134,11,0.28)` : 'none',
      }}>
        {p.charAt(0).toUpperCase() + p.slice(1)}
      </button>
    ))}
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({
  label, value, color, sub, Icon, trend, delay = 0,
}: {
  label: string; value: string; color: string; sub?: string;
  Icon: React.FC<any>; trend?: string; delay?: number;
}) => (
  <div className="card-hover fade-up" style={{
    background: C.card, borderRadius: 20, padding: '22px 24px',
    border: `1.5px solid ${C.border}`, flex: '1 1 200px',
    position: 'relative', overflow: 'hidden',
    animationDelay: `${delay}ms`,
    boxShadow: '0 2px 12px rgba(28,20,16,0.06)',
  }}>
    {/* Top accent line */}
    <div style={{
      position: 'absolute', top: 0, left: 24, right: 24, height: 2,
      background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
      borderRadius: '0 0 4px 4px',
    }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 700, color: C.gray,
        textTransform: 'uppercase', letterSpacing: '1.8px',
        fontFamily: 'Instrument Sans, sans-serif',
      }}>{label}</p>
      <div style={{
        width: 36, height: 36, borderRadius: 11,
        background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}20`,
      }}>
        <Icon size={16} color={color} />
      </div>
    </div>

    <p style={{
      margin: 0, fontSize: 32, fontWeight: 800, color: C.text,
      letterSpacing: '-1.5px', lineHeight: 1.1,
      fontFamily: 'Playfair Display, serif',
    }}>
      <span style={{ color }}>{value}</span>
    </p>

    {sub && (
      <p style={{ margin: '5px 0 0', fontSize: 12, color: C.gray }}>
        {PERIOD_LABEL[sub] || sub}
      </p>
    )}
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5,
          background: C.successBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpRight size={11} color={C.success} />
        </div>
        <span style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>{trend}</span>
      </div>
    )}
  </div>
);

// ─── Section Label ────────────────────────────────────────────────────────────
export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 10, fontWeight: 700, color: C.gray,
    letterSpacing: '2.2px', textTransform: 'uppercase', marginBottom: 16,
    fontFamily: 'Instrument Sans, sans-serif',
  }}>
    {children}
  </p>
);