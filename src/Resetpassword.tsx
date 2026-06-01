import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Lock, Key, CheckCircle2, Eye, EyeOff,
  ArrowLeft, ShieldCheck,
} from "lucide-react";
import axiosInstance from "./Axios";

// ─── Theme ────────────────────────────────────────────────────────────────────

const S = {
  bg:          "#FDEFD4",
  primary:     "#FFA629",
  primaryDark: "#E08A00",
  primarySoft: "rgba(255,166,41,0.12)",
  primaryGlow: "rgba(255,142,0,0.28)",
  white:       "#FFFFFF",
  text:        "#3D2800",
  textMuted:   "#B07D3A",
  textLight:   "#9A7B50",
  border:      "rgba(255,166,41,0.20)",
  shadow:      "rgba(255,142,0,0.14)",
  divider:     "rgba(255,166,41,0.20)",
  inputBg:     "#FFFAF2",
  error:       "#EF4444",
  errorBg:     "rgba(239,68,68,0.08)",
  success:     "#16a34a",
  successBg:   "rgba(22,163,74,0.08)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldState {
  value: string;
  show:  boolean;
  error: string;
}

type ToastType = "success" | "error" | null;

interface ResetPasswordProps {
  token?:  string;
  onBack?: () => void;
}

// ─── Strength calculator ──────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: S.textLight };
  let s = 0;
  if (pw.length >= 6)                        s++;
  if (pw.length >= 10)                       s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw))              s++;
  const labels = ["Too weak", "Fair", "Good", "Strong 🔒"];
  const colors = ["#EF4444", "#F59E0B", "#10B981", "#059669"];
  return {
    score: s,
    label: labels[s - 1] ?? "Too short",
    color: colors[s - 1] ?? S.textLight,
  };
}

// ─── StrengthBar ──────────────────────────────────────────────────────────────

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false });
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  const barColors = ["#EF4444", "#F59E0B", "#10B981", "#059669"] as const;
  const filled    = barColors[score - 1] ?? S.primarySoft;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ marginTop: 8 }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 99,
              background: "rgba(255,166,41,0.15)", overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={inView && i < score ? { width: "100%" } : { width: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", background: filled, borderRadius: 99 }}
            />
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </span>
    </motion.div>
  );
};

// ─── PasswordField ────────────────────────────────────────────────────────────

const PasswordField: React.FC<{
  id:          string;
  label:       string;
  placeholder: string;
  icon:        React.ReactNode;
  field:       FieldState;
  onChange:    (v: string) => void;
  onToggle:    () => void;
  extra?:      React.ReactNode;
  delay?:      number;
}> = ({ id, label, placeholder, icon, field, onChange, onToggle, extra, delay = 0 }) => {
  const [focused, setFocused] = useState(false);

  const borderColor = field.error ? S.error : focused ? S.primary : S.border;
  const boxShadow   = field.error
    ? `0 0 0 3px ${S.errorBg}`
    : focused ? `0 0 0 3px ${S.primarySoft}` : "none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 18, fontFamily: "'DM Sans', sans-serif" }}
    >
      <label
        htmlFor={id}
        style={{
          display: "block", fontSize: 11, fontWeight: 700,
          color: S.textLight, textTransform: "uppercase",
          letterSpacing: "1.2px", marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: "flex", alignItems: "center",
          background: focused ? S.white : S.inputBg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 12, transition: "all 0.22s ease",
          boxShadow, overflow: "hidden",
        }}
      >
        <span
          style={{
            padding: "0 0 0 14px",
            color: focused ? S.primary : S.textLight,
            display: "flex", alignItems: "center",
            flexShrink: 0, transition: "color 0.2s",
          }}
        >
          {icon}
        </span>

        <input
          id={id}
          type={field.show ? "text" : "password"}
          placeholder={placeholder}
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent", padding: "14px 12px",
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            color: S.text, fontWeight: 500,
          }}
        />

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          style={{
            padding: "0 14px 0 0", cursor: "pointer",
            display: "flex", alignItems: "center",
            background: "none", border: "none", outline: "none", flexShrink: 0,
          }}
        >
          {field.show
            ? <EyeOff size={16} color={focused ? S.primary : S.textLight} />
            : <Eye    size={16} color={focused ? S.primary : S.textLight} />}
        </motion.button>
      </div>

      {field.error && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            marginTop: 6, fontSize: 11, fontWeight: 600,
            color: S.error, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <CheckCircle2 size={11} color={S.error} />
          {field.error}
        </motion.div>
      )}

      {extra}
    </motion.div>
  );
};

// ─── MatchRow ─────────────────────────────────────────────────────────────────

const MatchRow: React.FC<{ newPwd: string; confirmPwd: string }> = ({ newPwd, confirmPwd }) => {
  if (!confirmPwd) return null;
  const match = newPwd === confirmPwd;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        marginTop: 6, fontSize: 11, fontWeight: 600,
        color: match ? S.success : S.error,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: match ? S.success : S.error, flexShrink: 0,
      }} />
      {match ? "Passwords match" : "Passwords do not match"}
    </motion.div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: ToastType }> = ({ message, type }) => (
  <motion.div
    initial={{ y: 80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 80, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 28 }}
    style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      background: type === "success" ? "#065f46" : "#7f1d1d",
      color: "#fff", padding: "12px 22px", borderRadius: 40,
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      zIndex: 9999, display: "flex", alignItems: "center",
      gap: 8, whiteSpace: "nowrap" as const,
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    {type === "success"
      ? <CheckCircle2 size={16} color="#fff" />
      : <ShieldCheck  size={16} color="#fff" />}
    {message}
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ResetPassword: React.FC<ResetPasswordProps> = ({ token: tokenProp, onBack }) => {
  // Read from sessionStorage as fallback — same key App.tsx uses
  const token = tokenProp ?? sessionStorage.getItem("merchant_token") ?? "";

  const [current, setCurrent] = useState<FieldState>({ value: "", show: false, error: "" });
  const [newPwd,  setNewPwd]  = useState<FieldState>({ value: "", show: false, error: "" });
  const [confirm, setConfirm] = useState<FieldState>({ value: "", show: false, error: "" });
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ message: string; type: ToastType }>({ message: "", type: null });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 3200);
  };

  const clearErrors = () => {
    setCurrent((p) => ({ ...p, error: "" }));
    setNewPwd ((p) => ({ ...p, error: "" }));
    setConfirm((p) => ({ ...p, error: "" }));
  };

  const handleReset = async () => {
    clearErrors();
    let hasErr = false;

    if (!current.value.trim()) {
      setCurrent((p) => ({ ...p, error: "Current password is required" }));
      hasErr = true;
    }
    if (newPwd.value.length < 6) {
      setNewPwd((p) => ({ ...p, error: "Password must be at least 6 characters" }));
      hasErr = true;
    }
    if (newPwd.value !== confirm.value) {
      setConfirm((p) => ({ ...p, error: "Passwords do not match" }));
      hasErr = true;
    }
    if (hasErr) return;

    if (!token) {
      showToast("User not authenticated.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(
        "/users/reset-user-password",
        {
          currentPassword:    current.value,
          newPassword:        newPwd.value,
          confirmNewPassword: confirm.value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        showToast("Password reset successfully! 🎉", "success");
        setCurrent({ value: "", show: false, error: "" });
        setNewPwd ({ value: "", show: false, error: "" });
        setConfirm({ value: "", show: false, error: "" });
        setTimeout(() => onBack?.(), 1800);
      } else {
        showToast(response.data?.message || "Something went wrong.", "error");
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const msg =
        e?.response?.status === 401
          ? "Current password is incorrect."
          : e?.response?.data?.message ?? "Something went wrong while resetting password.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const cardRef    = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');

        .rp-root, .rp-root * { font-family: 'DM Sans', sans-serif !important; }
        .rp-input::placeholder { color: ${S.textMuted}; font-weight: 400; }

        .rp-submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.55s ease;
        }
        .rp-submit-btn:hover::before { left: 100%; }

        @keyframes rp-lockwobble {
          0%,100%{transform:rotate(0deg)}
          20%{transform:rotate(-8deg)}
          40%{transform:rotate(8deg)}
          60%{transform:rotate(-4deg)}
          80%{transform:rotate(4deg)}
        }
        .rp-lock-icon { animation: rp-lockwobble 4s ease-in-out infinite; }

        @keyframes rp-blob1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }
        @keyframes rp-blob2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        .rp-blob1 { animation: rp-blob1 8s ease-in-out infinite; }
        .rp-blob2 { animation: rp-blob2 10s ease-in-out infinite; }

        @keyframes rp-spin { to { transform: rotate(360deg); } }
        .rp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: rp-spin 0.7s linear infinite;
        }
      `}</style>

      <div
        className="rp-root"
        style={{
          minHeight: "100%",
          background: S.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Background blobs */}
        <div className="rp-blob1" style={{
          position: "absolute", top: -120, right: -120,
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,166,41,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="rp-blob2" style={{
          position: "absolute", bottom: -100, left: -100,
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,142,0,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={cardInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: S.white,
            borderRadius: 24,
            border: `1.5px solid ${S.border}`,
            boxShadow: `0 8px 48px ${S.shadow}, 0 2px 12px rgba(0,0,0,0.04)`,
            width: "100%",
            maxWidth: 460,
            padding: "40px 40px 36px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top amber strip */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${S.primary} 0%, ${S.primaryDark} 100%)`,
            borderRadius: "24px 24px 0 0",
          }} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onBack?.()}
              style={{
                width: 40, height: 40, borderRadius: 12,
                border: `1.5px solid ${S.border}`,
                background: S.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", outline: "none", flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <ArrowLeft size={18} color={S.primary} />
            </motion.button>
            <span style={{ fontSize: 22, fontWeight: 800, color: S.text, letterSpacing: "-0.4px" }}>
              Reset Password
            </span>
          </motion.div>

          {/* Lock badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
            style={{
              width: 56, height: 56, borderRadius: 18,
              background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDark} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: `0 6px 22px ${S.primaryGlow}`,
            }}
          >
            <Lock size={26} color="#fff" className="rp-lock-icon" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              fontSize: 24, fontWeight: 800, color: S.text,
              textAlign: "center", letterSpacing: "-0.5px", margin: "0 0 4px",
            }}
          >
            Update your password
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{
              fontSize: 13, color: S.textMuted, textAlign: "center",
              marginBottom: 28, fontWeight: 400,
            }}
          >
            Keep your Vervoer merchant account secure
          </motion.p>

          <div style={{ height: 1, background: S.divider, marginBottom: 24, borderRadius: 1 }} />

          {/* Fields */}
          <PasswordField
            id="currentPwd"
            label="Current Password"
            placeholder="Enter current password"
            icon={<Lock size={16} />}
            field={current}
            onChange={(v) => setCurrent((p) => ({ ...p, value: v, error: "" }))}
            onToggle={() => setCurrent((p) => ({ ...p, show: !p.show }))}
            delay={0.18}
          />

          <PasswordField
            id="newPwd"
            label="New Password"
            placeholder="Create new password"
            icon={<Key size={16} />}
            field={newPwd}
            onChange={(v) => setNewPwd((p) => ({ ...p, value: v, error: "" }))}
            onToggle={() => setNewPwd((p) => ({ ...p, show: !p.show }))}
            delay={0.24}
            extra={<StrengthBar password={newPwd.value} />}
          />

          <PasswordField
            id="confirmPwd"
            label="Re-enter Password"
            placeholder="Re-enter new password"
            icon={<ShieldCheck size={16} />}
            field={confirm}
            onChange={(v) => setConfirm((p) => ({ ...p, value: v, error: "" }))}
            onToggle={() => setConfirm((p) => ({ ...p, show: !p.show }))}
            delay={0.30}
            extra={<MatchRow newPwd={newPwd.value} confirmPwd={confirm.value} />}
          />

          {/* Submit */}
          <motion.button
            type="button"
            className="rp-submit-btn"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
            whileHover={!loading ? { y: -3, boxShadow: `0 10px 32px ${S.primaryGlow}` } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            onClick={handleReset}
            disabled={loading}
            style={{
              width: "100%", padding: "15px", borderRadius: 14,
              background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDark} 100%)`,
              color: "#fff", fontFamily: "'DM Sans', sans-serif",
              fontSize: 15, fontWeight: 800, letterSpacing: "0.3px",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              outline: "none", marginTop: 6,
              boxShadow: `0 6px 22px ${S.primaryGlow}`,
              transition: "all 0.25s ease",
              position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 9, opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? (
              <>
                <div className="rp-spinner" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowLeft size={17} color="#fff" style={{ transform: "rotate(180deg)" }} />
              </>
            )}
          </motion.button>
        </motion.div>

        {toast.type && <Toast message={toast.message} type={toast.type} />}
      </div>
    </>
  );
};

export default ResetPassword;