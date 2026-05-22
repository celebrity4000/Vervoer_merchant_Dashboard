import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import axiosInstance from "./Axios";
import { RealSubAccount } from "./Tokens";
import { Spinner } from "./Ui";

const ORANGE = "#FFA629";
const ORANGE_LIGHT = "#FF8E0033";
const ORANGE_BORDER = "#FFA62940";

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
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
    x: -30,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalBoxVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const toastVariants: Variants = {
  hidden: { opacity: 0, x: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export const SubAccountsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<RealSubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [newAcc, setNewAcc] = useState({ email: "", password: "", label: "" });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string, type: "success" | "error") =>
    setToast({ msg, type });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/merchants/sub-accounts");
      if (res.data.success) setAccounts(res.data.data || []);
      else throw new Error(res.data.message);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to load sub-accounts",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!newAcc.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAcc.email.trim()))
      errs.email = "Enter a valid email";
    if (!newAcc.password.trim()) errs.password = "Password is required";
    else if (newAcc.password.length < 6) errs.password = "Minimum 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setAddLoading(true);
    try {
      const res = await axiosInstance.post("/merchants/sub-accounts", {
        email: newAcc.email.trim().toLowerCase(),
        password: newAcc.password,
        label: newAcc.label.trim(),
      });
      if (res.data.success) {
        setAccounts(res.data.data || accounts);
        setNewAcc({ email: "", password: "", label: "" });
        setErrors({});
        setShowModal(false);
        showToast("Sub-account added successfully", "success");
      } else throw new Error(res.data.message);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to add sub-account",
        "error",
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setActionId(id);
    try {
      const res = await axiosInstance.patch("/merchants/sub-accounts/toggle", {
        subAccountId: id,
      });
      if (res.data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a._id === id ? { ...a, isActive: !current } : a)),
        );
        showToast(
          `Account ${!current ? "activated" : "deactivated"}`,
          "success",
        );
      } else throw new Error(res.data.message);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setConfirmId(null);
    setActionId(id);
    try {
      const res = await axiosInstance.delete("/merchants/sub-accounts", {
        data: { subAccountId: id },
      });
      if (res.data.success) {
        setAccounts((prev) => prev.filter((a) => a._id !== id));
        showToast("Sub-account removed", "success");
      } else throw new Error(res.data.message);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to remove", "error");
    } finally {
      setActionId(null);
    }
  };

  const confirmTarget = accounts.find((a) => a._id === confirmId);

  return (
    <>
      <style>{`
        .sa-wrap {
          max-width: 1060px;
          margin: 0 auto;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-add-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 22px;
          border-radius: 24px;
          background: ${ORANGE};
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(255,166,41,0.35);
          font-family: 'DM Sans', sans-serif;
        }

        .sa-progress-bg {
          height: 6px;
          background: #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .sa-progress-fill {
          height: 6px;
          background: ${ORANGE};
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .sa-card {
          background: ${ORANGE};
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
          box-shadow: 0 4px 16px rgba(255,166,41,0.25);
          box-sizing: border-box;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          flex-shrink: 0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: ${ORANGE};
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          font-family: 'DM Sans', sans-serif;
        }

        .sa-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-email {
          font-size: 12px;
          color: rgba(255,255,255,0.80);
          margin: 2px 0 5px;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 20px;
          background: rgba(255,255,255,0.25);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-badge.active {
          background: rgba(34,197,94,0.25);
          color: #86efac;
        }

        .sa-date {
          font-size: 10px;
          color: rgba(255,255,255,0.65);
          margin-left: 6px;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-toggle {
          width: 46px;
          height: 25px;
          border-radius: 13px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.25s;
          flex-shrink: 0;
        }

        .sa-toggle-thumb {
          position: absolute;
          top: 3px;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
        }

        .sa-delete {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          flex-shrink: 0;
          background: #ef4444;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sa-empty {
          text-align: center;
          padding: 64px 24px;
        }

        .sa-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          background: ${ORANGE_LIGHT};
          border: 1.5px solid ${ORANGE_BORDER};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
        }

        .sa-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 8888;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sa-modal-box {
          background: #fff;
          border-radius: 22px;
          padding: 30px 32px;
          max-width: 420px;
          width: 90%;
          border: 1.5px solid #eee;
          box-shadow: 0 32px 64px rgba(0,0,0,0.18);
          font-family: 'DM Sans', sans-serif;
        }

        .sa-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          box-sizing: border-box;
          background: #fafafa;
          transition: border-color 0.15s;
        }

        .sa-input:focus {
          border-color: ${ORANGE};
          background: #fff;
        }

        .sa-label {
          font-size: 10px;
          font-weight: 700;
          color: #999;
          display: block;
          margin-bottom: 5px;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-modal-cancel {
          flex: 1;
          padding: 12px;
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          color: #666;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .sa-modal-submit {
          flex: 2;
          padding: 12px;
          background: ${ORANGE};
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(255,166,41,0.35);
        }

        .sa-confirm-box {
          background: #fff;
          border-radius: 20px;
          padding: 28px 30px;
          max-width: 380px;
          width: 90%;
          border: 1.5px solid #eee;
          box-shadow: 0 24px 48px rgba(0,0,0,0.16);
          font-family: 'DM Sans', sans-serif;
        }

        @media (max-width: 500px) {
          .sa-modal-box { padding: 22px 18px; }
          .sa-card { padding: 14px 14px; }
        }
      `}</style>

      <div className="sa-wrap">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: "fixed",
                top: 22,
                right: 22,
                zIndex: 9999,
                borderRadius: 14,
                padding: "13px 18px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                minWidth: 260,
                background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1.5px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <CheckCircle
                size={16}
                color={toast.type === "success" ? "#22c55e" : "#ef4444"}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: toast.type === "success" ? "#16a34a" : "#dc2626",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {toast.msg}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setToast(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm dialog */}
        <AnimatePresence>
          {confirmId && confirmTarget && (
            <motion.div
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="sa-modal-overlay"
              onClick={() => setConfirmId(null)}
            >
              <motion.div
                variants={modalBoxVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="sa-confirm-box"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring" as const, stiffness: 200 }}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Trash2 size={20} color="#ef4444" />
                </motion.div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Remove Sub-Account
                </h3>
                <p style={{ fontSize: 14, color: "#666", margin: "0 0 22px" }}>
                  Remove{" "}
                  <strong style={{ color: "#1a1a1a" }}>
                    {confirmTarget.email}
                  </strong>
                  ? This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="sa-modal-cancel"
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRemove(confirmId)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "#1a1a1a",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Sub-Accounts
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: "#999",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {accounts.length}/10 slots used
            </motion.p>
          </div>
          <motion.button
            whileHover={{
              scale: 1.05,
              y: -2,
              boxShadow: "0 6px 18px rgba(255,166,41,0.45)",
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="sa-add-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Add login
          </motion.button>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sa-progress-bg"
          style={{ marginTop: 14 }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(accounts.length / 10) * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="sa-progress-fill"
            style={{
              background: accounts.length >= 9 ? "#ef4444" : ORANGE,
            }}
          />
        </motion.div>

        {/* List */}
        {loading ? (
          <Spinner />
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="sa-empty"
          >
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="sa-empty-icon"
            >
              <Users size={28} color={ORANGE} />
            </motion.div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "0 0 6px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              No sub-accounts yet
            </h3>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>
              Add your first login to give a team member access.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {accounts.map((sa) => (
                <motion.div
                  key={sa._id}
                  variants={cardVariants}
                  layout
                  exit="exit"
                  whileHover={{
                    y: -3,
                    scale: 1.01,
                    boxShadow: "0 8px 24px rgba(255,166,41,0.35)",
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`sa-card${sa.isActive ? "" : " inactive"}`}
                >
                  {/* White square avatar */}
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring" as const, stiffness: 300 }}
                    className="sa-avatar"
                  >
                    {(sa.label || sa.email || "?").charAt(0).toUpperCase()}
                  </motion.div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {sa.label && <p className="sa-name">{sa.label}</p>}
                    <p className="sa-email">{sa.email}</p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className={`sa-badge${sa.isActive ? " active" : ""}`}
                      >
                        {sa.isActive ? "● Active" : "○ Inactive"}
                      </span>
                      <span className="sa-date">
                        {new Date(sa.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    {actionId === sa._id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 size={18} color="#fff" />
                      </motion.div>
                    ) : (
                      <>
                        {/* Toggle */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="sa-toggle"
                          onClick={() => handleToggle(sa._id, sa.isActive)}
                          style={{
                            background: sa.isActive
                              ? "#22c55e"
                              : "rgba(255,255,255,0.3)",
                          }}
                        >
                          <motion.span
                            className="sa-toggle-thumb"
                            animate={{ left: sa.isActive ? 22 : 3 }}
                            transition={{
                              type: "spring" as const,
                              stiffness: 300,
                              damping: 25,
                            }}
                          />
                        </motion.button>
                        {/* Delete */}
                        <motion.button
                          whileHover={{ scale: 1.1, background: "#dc2626" }}
                          whileTap={{ scale: 0.9 }}
                          className="sa-delete"
                          onClick={() => setConfirmId(sa._id)}
                        >
                          <Trash2 size={14} color="#fff" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="sa-modal-overlay"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                variants={modalBoxVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="sa-modal-box"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#1a1a1a",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Add Sub-Account
                    </h3>
                    <p
                      style={{ margin: "3px 0 0", fontSize: 12, color: "#999" }}
                    >
                      They can log in independently
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#aaa",
                      cursor: "pointer",
                      fontSize: 22,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </motion.button>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div>
                    <label className="sa-label">Label (optional)</label>
                    <input
                      className="sa-input"
                      placeholder="e.g. Manager, Cashier"
                      value={newAcc.label}
                      onChange={(e) =>
                        setNewAcc((p) => ({ ...p, label: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="sa-label">Email *</label>
                    <input
                      className="sa-input"
                      type="email"
                      placeholder="login@example.com"
                      value={newAcc.email}
                      onChange={(e) => {
                        setNewAcc((p) => ({ ...p, email: e.target.value }));
                        setErrors((er) => ({ ...er, email: undefined }));
                      }}
                      style={{
                        borderColor: errors.email ? "#ef4444" : undefined,
                      }}
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          color: "#ef4444",
                          margin: "4px 0 0",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                  <div>
                    <label className="sa-label">Password *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="sa-input"
                        type={showPw ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={newAcc.password}
                        onChange={(e) => {
                          setNewAcc((p) => ({
                            ...p,
                            password: e.target.value,
                          }));
                          setErrors((er) => ({ ...er, password: undefined }));
                        }}
                        style={{
                          borderColor: errors.password ? "#ef4444" : undefined,
                          paddingRight: 42,
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPw((v) => !v)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#aaa",
                        }}
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </motion.button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          fontSize: 12,
                          color: "#ef4444",
                          margin: "4px 0 0",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 22, display: "flex", gap: 9 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="sa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 6px 18px rgba(255,166,41,0.45)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="sa-modal-submit"
                    onClick={handleAdd}
                    disabled={addLoading}
                  >
                    {addLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Loader2 size={15} color="#fff" />
                        </motion.div>{" "}
                        Adding…
                      </>
                    ) : (
                      "Add Sub-Account"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SubAccountsTab;
