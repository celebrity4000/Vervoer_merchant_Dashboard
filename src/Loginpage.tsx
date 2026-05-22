import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { logo, loginBg } from "./assets/images";
import axiosInstance from "./Axios";
import type { MerchantUser } from "./types/Index";

const NAVBAR_HEIGHT = 80;

/* ─────────────────────────────────────────── */
/* ANIMATION EASING (FIXED TYPES)              */
/* ─────────────────────────────────────────── */

const easeOutCubic: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const easeInOut: [number, number, number, number] = [0.42, 0, 0.58, 1];

/* ─────────────────────────────────────────── */
/* ANIMATION VARIANTS                          */
/* ─────────────────────────────────────────── */

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: 0.2,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.4,
    },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const welcomeVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.5,
    },
  },
};

/* ─────────────────────────────────────────── */
/* ERROR HELPERS                               */
/* ─────────────────────────────────────────── */

const STATUS_MAP: Record<number, string> = {
  400: "Invalid request.",
  401: "Invalid email or password.",
  403: "Access denied. Your account may be deactivated.",
  404: "No account found with this email.",
  500: "Server error. Try again later.",
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const err = error as { response?: { data?: unknown; status?: number } };
    const d = err.response?.data;

    if (typeof d === "object" && d) {
      const data = d as Record<string, unknown>;
      if (typeof data.message === "string") return data.message;
    }

    if (err.response?.status) {
      return STATUS_MAP[err.response.status] || "Login failed.";
    }
  }
  return "Login failed.";
}

/* ─────────────────────────────────────────── */
/* PROPS                                       */
/* ─────────────────────────────────────────── */

interface LoginProps {
  onLogin: (token: string, user: MerchantUser) => void;
}

/* ─────────────────────────────────────────── */
/* COMPONENT                                   */
/* ─────────────────────────────────────────── */

export default function Loginpage({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  /* VALIDATION */
  const validate = (): boolean => {
    let ok = true;

    if (!email) {
      setEmailErr("Email is required");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Enter a valid email");
      ok = false;
    } else {
      setEmailErr("");
    }

    if (!password) {
      setPassErr("Password is required");
      ok = false;
    } else if (password.length < 6) {
      setPassErr("Minimum 6 characters");
      ok = false;
    } else {
      setPassErr("");
    }

    return ok;
  };

  /* ─────────────────────────────────────────── */
  /* LOGIN — tries merchant first, then sub-acct */
  /* ─────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();

    // ── 1. Try merchant login ──────────────────
    try {
      const res = await axiosInstance.post("/users/login", {
        email: trimmedEmail,
        password,
        userType: "merchant",
      });

      const token = res.data.token;
      const user = res.data.user;

      if (!token || !user) throw new Error("Invalid response from server");

      onLogin(token, user);
      return; // ✅ merchant login succeeded — done
    } catch (merchantErr: unknown) {
      const status = (merchantErr as any)?.response?.status;

      // Wrong password for a real merchant → stop here
      if (status === 401) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // 403 = unverified merchant account
      if (status === 403) {
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // Only fall through to sub-account on 404 (email not a merchant)
      if (status !== 404) {
        setError(getErrorMessage(merchantErr));
        setLoading(false);
        return;
      }
      // 404 → email not found in merchant collection, try sub-account below
    }

    // ── 2. Fallback: try sub-account login ─────
    // NOTE: Do NOT send userType here — the sub-account endpoint has its own
    // schema and does NOT use the same loginUser handler.
    try {
  const res = await axiosInstance.post("/merchants/sub-account/login", {
  email: trimmedEmail,
  password,
});

  const token = res.data.data?.token ?? res.data.token;
  const merchantId = res.data.data?.merchantId ?? res.data.merchantId;

  if (!token) throw new Error("Invalid response from server");

  // Build a minimal user object from what the backend returns
  // (sub-account login doesn't return a full user object)
  const user = {
    _id: merchantId,
    email: trimmedEmail,
    userType: "subAccount",
  } as unknown as MerchantUser;

  onLogin(token, user);
} catch (subErr: unknown) {
  const subStatus = (subErr as any)?.response?.status;

  if (subStatus === 403) {
    setError("Your sub-account has been deactivated. Contact the account owner.");
  } else if (subStatus === 404) {
    setError("No account found with this email.");
  } else if (subStatus === 401) {
    setError("Invalid email or password.");
  } else {
    setError(getErrorMessage(subErr));
  }
} finally {
  setLoading(false);
}
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #root { width: 100%; height: 100%; }
        .login-video-bg {
          position: fixed !important;
          top: ${NAVBAR_HEIGHT}px !important;
          left: 0 !important;
          width: 100vw !important;
          height: calc(100vh - ${NAVBAR_HEIGHT}px) !important;
          object-fit: cover !important;
          z-index: 0 !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ══ LOGO BAR ══ */}
      <motion.div
        initial={{ y: -NAVBAR_HEIGHT }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: easeOutCubic }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: `${NAVBAR_HEIGHT}px`,
          backgroundColor: "rgb(56, 56, 56)",
          zIndex: 100,
          boxShadow: "0 1px 0 rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1920px",
            width: "100%",
            padding: "0 clamp(24px, 4vw, 48px)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <motion.img
            src={logo}
            alt="Vervoer"
            style={{ height: "56px", width: "auto", objectFit: "contain" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </motion.div>

      {/* ══ VIDEO (FULL WIDTH) ══ */}
      <motion.video
        className="login-video-bg"
        src={loginBg}
        autoPlay
        loop
        muted
        playsInline
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />

      {/* ══ OVERLAY (FULL WIDTH) ══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{
          position: "fixed",
          top: `${NAVBAR_HEIGHT}px`,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255,255,255,0.22)",
          zIndex: 1,
        }}
      />

      {/* ══ CONTENT (CONSTRAINED TO 1920PX) ══ */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: `${NAVBAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          display: "flex",
          justifyContent: "center",
          padding: "0 clamp(24px, 4vw, 48px)",
        }}
      >
        <div
          style={{
            maxWidth: "1920px",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "32px",
            padding: "24px 0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* LEFT: Welcome */}
          <motion.div
            variants={welcomeVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            style={{ flex: "1 1 220px" }}
          >
            <h1
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(36px, 7.5vw, 110px)",
                lineHeight: 1.1,
                color: "#fff",
                margin: 0,
                textShadow: "0 2px 24px rgba(0,0,0,0.3)",
              }}
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Welcome{" "}
              </motion.span>
              <motion.span
                style={{ color: "#F5A623" }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 1.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                !!
              </motion.span>
            </h1>
          </motion.div>

          {/* RIGHT: Login card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            style={{ flexShrink: 0, width: "100%", maxWidth: "640px" }}
          >
            <div
              style={{
                backgroundColor: "#FDF0DC",
                borderRadius: "12px",
                padding: "clamp(24px, 3vw, 40px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              }}
            >
              {/* Verified badge */}
              <motion.div
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                style={{ marginBottom: "18px" }}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#F5A623",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: "12px",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ShieldCheck size={13} />
                  </motion.span>
                  Verified Merchants
                </motion.span>
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: easeOutCubic }}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(18px, 2vw, 22px)",
                  color: "#1a1a1a",
                  marginBottom: "28px",
                  lineHeight: 1.35,
                }}
              >
                Sign in to your merchant dashboard
              </motion.h2>

              {/* Global error */}
              {error && (
                <motion.div
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#dc2626",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    marginBottom: "18px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <AlertCircle size={16} />
                  </motion.span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* FORM */}
              <motion.form
                variants={formVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleLogin}
              >
                {/* Email */}
                <motion.div
                  variants={itemVariants}
                  style={{ marginBottom: "16px" }}
                >
                  <label
                    style={{
                      display: "block",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#444",
                      marginBottom: "6px",
                    }}
                  >
                    Email
                  </label>
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailErr("");
                    }}
                    placeholder="Enter your mail"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: emailErr
                        ? "1.5px solid #ef4444"
                        : "1.5px solid #f0d9b5",
                      backgroundColor: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      color: "#1a1a1a",
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#F5A623")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = emailErr
                        ? "#ef4444"
                        : "#f0d9b5")
                    }
                  />
                  {emailErr && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "block",
                        color: "#ef4444",
                        fontSize: "12px",
                        marginTop: "5px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {emailErr}
                    </motion.span>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div
                  variants={itemVariants}
                  style={{ marginBottom: "10px" }}
                >
                  <label
                    style={{
                      display: "block",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#444",
                      marginBottom: "6px",
                    }}
                  >
                    Password
                  </label>
                  <motion.div
                    style={{ position: "relative" }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPassErr("");
                      }}
                      placeholder="Enter your Password"
                      style={{
                        width: "100%",
                        padding: "12px 44px 12px 16px",
                        borderRadius: "12px",
                        border: passErr
                          ? "1.5px solid #ef4444"
                          : "1.5px solid #f0d9b5",
                        backgroundColor: "#fff",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "14px",
                        color: "#1a1a1a",
                        outline: "none",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#F5A623")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = passErr
                          ? "#ef4444"
                          : "#f0d9b5")
                      }
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#999",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                      }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotate: showPass ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </motion.div>
                    </motion.button>
                  </motion.div>
                  {passErr && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "block",
                        color: "#ef4444",
                        fontSize: "12px",
                        marginTop: "5px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {passErr}
                    </motion.span>
                  )}
                </motion.div>

                {/* Forgot password */}
                <motion.div
                  variants={itemVariants}
                  style={{ textAlign: "right", marginBottom: "24px" }}
                >
                  <motion.a
                    href="#"
                    whileHover={{
                      scale: 1.05,
                      textDecoration: "underline",
                    }}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#F5A623",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    Forgot password?
                  </motion.a>
                </motion.div>

                {/* Sign In button */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(245, 166, 35, 0.4)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: loading ? "#f0c070" : "#F5A623",
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.7,
                          ease: "linear",
                        }}
                        style={{
                          width: "18px",
                          height: "18px",
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTop: "2px solid #fff",
                          borderRadius: "50%",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <>
                        <motion.span initial={{ x: 0 }} whileHover={{ x: -5 }}>
                          Sign In
                        </motion.span>
                        <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }}>
                          <ArrowRight size={18} />
                        </motion.span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}