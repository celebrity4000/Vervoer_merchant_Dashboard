import { useState, useEffect, useCallback, CSSProperties } from "react";
import {
  Repeat,
  Building2,
  Car,
  Home,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axiosInstance from "./Axios";

// ─── Theme ────────────────────────────────────────────────────────────────────

const O = {
  primary:      "#FFA629",
  primaryDark:  "#E08A00",
  primaryBg:    "rgba(255,166,41,0.12)",
  primaryBorder:"rgba(255,166,41,0.28)",
  primaryGlow:  "rgba(255,166,41,0.16)",
  primarySoft:  "rgba(255,166,41,0.18)",
  text:         "#1A0F00",
  textMuted:    "#7A5C30",
  bg:           "#FFFAF3",
  bgDeep:       "#FFF1D6",
  bgPage:       "#FFF8EE",
  border:       "rgba(255,166,41,0.20)",
  borderMid:    "rgba(255,166,41,0.30)",
  card:         "#FFFFFF",
  cardBorder:   "rgba(255,166,41,0.18)",
  success:      "#16a34a",
  successBg:    "rgba(22,163,74,0.09)",
  error:        "#993C1D",
  errorBg:      "#FAECE7",
  errorBorder:  "rgba(216,90,48,0.30)",
  white:        "#FFFFFF",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawVenue {
  _id: string;
  owner: string;
  parkingName?: string;
  garageName?: string;
  residenceName?: string;
  address?: string;
  gpsLocation?: { coordinates: [number, number] };
  monthlyChargeEnabled: boolean;
  monthlyRate: number;
}

interface MonthlyPatch {
  monthlyChargeEnabled: boolean;
  monthlyRate: number;
}

interface VenueMeta {
  key: string;
  label: string;
  icon: React.ElementType;
  venueType: "parking" | "garage" | "residence";
  searchPath: string;
  nameKey: keyof RawVenue;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VENUE_TYPES: VenueMeta[] = [
  {
    key:        "parkinglot",
    label:      "Parking Lots",
    icon:       Car,
    venueType:  "parking",
    searchPath: "/merchants/parkinglot/search",
    nameKey:    "parkingName",
  },
  {
    key:        "garage",
    label:      "Garages",
    icon:       Building2,
    venueType:  "garage",
    searchPath: "/merchants/garage/search",
    nameKey:    "garageName",
  },
  {
    key:        "residence",
    label:      "Residences",
    icon:       Home,
    venueType:  "residence",
    searchPath: "/merchants/residence/search",
    nameKey:    "residenceName",
  },
];

type FilterKey = "all" | "enabled" | "disabled";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonthlyTabProps {
  token?: string;
  data?: unknown;
  user?: { _id?: string; firstName?: string };
}

// ─── VenueCard ────────────────────────────────────────────────────────────────

interface VenueCardProps {
  venue: RawVenue;
  meta: VenueMeta;
  token?: string;
  onUpdated: (id: string, patch: MonthlyPatch) => void;
}

function VenueCard({ venue, meta, token, onUpdated }: VenueCardProps) {
  const [open,      setOpen]      = useState(false);
  const [enabled,   setEnabled]   = useState(venue.monthlyChargeEnabled);
  const [rate,      setRate]      = useState(venue.monthlyRate);
  const [rateInput, setRateInput] = useState(
    venue.monthlyRate > 0 ? String(venue.monthlyRate) : ""
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = (venue[meta.nameKey] as string | undefined) ?? "Unnamed";

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) { setRate(0); setRateInput(""); }
    setError(null);
    setSuccess(false);
  };

  const handleRateChange = (val: string) => {
    setRateInput(val);
    setRate(parseFloat(val) || 0);
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (enabled && rate <= 0) {
      setError("Enter a valid monthly rate greater than 0.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await axiosInstance.patch(
        "/merchants/monthly-settings",
        {
          venueType: meta.venueType,
          venueId: venue._id,
          monthlyChargeEnabled: enabled,
          monthlyRate: rate,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSuccess(true);
      onUpdated(venue._id, { monthlyChargeEnabled: enabled, monthlyRate: rate });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    enabled !== venue.monthlyChargeEnabled || rate !== venue.monthlyRate;

  return (
    <div
      style={{
        ...s.card,
        borderColor: open ? O.primary + "55" : O.cardBorder,
        boxShadow:   open ? `0 4px 18px rgba(255,142,0,0.10)` : "none",
      }}
    >
      {/* Header row */}
      <div style={s.cardHeader} onClick={() => setOpen((o) => !o)}>
        <div style={s.cardLeft}>
          <div style={s.iconBadge}>
            <meta.icon size={17} color={O.primary} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={s.cardName}>{name}</p>
            <p style={s.cardAddr}>
              {venue.address ??
                venue.gpsLocation?.coordinates?.join(", ") ??
                "No address"}
            </p>
          </div>
        </div>

        <div style={s.cardRight}>
          {venue.monthlyChargeEnabled ? (
            <span style={{ ...s.pill, color: O.success, background: O.successBg }}>
              <CheckCircle2 size={10} style={{ marginRight: 4 }} />
              ${venue.monthlyRate}/mo
            </span>
          ) : (
            <span style={{ ...s.pill, color: O.textMuted, background: O.bgDeep }}>
              Not set
            </span>
          )}
          {open
            ? <ChevronUp size={15} color={O.textMuted} />
            : <ChevronDown size={15} color={O.textMuted} />}
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={s.panel}>
          <div style={s.divider} />

          {/* Toggle */}
          <div style={s.switchRow}>
            <div>
              <p style={s.switchLabel}>Enable monthly plans</p>
              <p style={s.switchSub}>
                Let customers subscribe to this venue on a monthly basis.
              </p>
            </div>
            <label style={{ cursor: "pointer", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                style={{ display: "none" }}
              />
              <div style={{ ...s.track, background: enabled ? O.primary : O.border }}>
                <div
                  style={{
                    ...s.thumb,
                    transform: enabled ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </div>
            </label>
          </div>

          {/* Rate input */}
          {enabled && (
            <div style={{ marginBottom: 12 }}>
              <p style={s.fieldLabel}>Monthly rate per slot</p>
              <div
                style={{
                  ...s.rateRow,
                  borderColor: error ? O.error : rateInput ? O.primary : O.borderMid,
                  boxShadow: rateInput && !error
                    ? `0 0 0 3px ${O.primaryGlow}`
                    : "none",
                }}
              >
                <span style={s.ratePrefix}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => handleRateChange(e.target.value)}
                  style={s.rateInput}
                />
                <span style={s.rateSuffix}>/mo</span>
              </div>

              {rate > 0 && (
                <div style={s.preview}>
                  <div style={s.previewRow}>
                    <span style={s.previewLabel}>Monthly per slot</span>
                    <span style={s.previewVal}>${rate.toFixed(2)}/mo</span>
                  </div>
                  <div style={s.previewRow}>
                    <span style={s.previewLabel}>Annual per slot</span>
                    <span style={s.previewVal}>${(rate * 12).toFixed(2)}/yr</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div style={{ ...s.feedback, color: O.error, background: O.errorBg, borderColor: O.errorBorder }}>
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ ...s.feedback, color: O.success, background: O.successBg, borderColor: O.success + "44" }}>
              <CheckCircle2 size={13} />
              <span>Monthly settings saved!</span>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              ...s.saveBtn,
              background: saving || !hasChanges ? O.primaryDark : O.primary,
              opacity:    saving || !hasChanges ? 0.5 : 1,
              cursor:     saving || !hasChanges ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />
                Saving…
              </>
            ) : (
              <>
                <Repeat size={14} style={{ marginRight: 6 }} />
                Save Monthly Settings
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  meta: VenueMeta;
  token?: string;
  merchantId?: string;
}

function Section({ meta, token, merchantId }: SectionProps) {
  const [venues,  setVenues]  = useState<RawVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<FilterKey>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(meta.searchPath);
      const raw: unknown = res.data?.data ?? res.data ?? [];
      const all: RawVenue[] = Array.isArray(raw) ? (raw as RawVenue[]) : [];

      // Filter to only venues owned by the current merchant
      const owned = merchantId
        ? all.filter((v) => v.owner === merchantId)
        : all;

      setVenues(owned);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? `Failed to load ${meta.label}.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [meta.searchPath, meta.label, merchantId]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (id: string, patch: MonthlyPatch) =>
    setVenues((prev) => prev.map((v) => (v._id === id ? { ...v, ...patch } : v)));

  const enabledCount  = venues.filter((v) =>  v.monthlyChargeEnabled).length;
  const disabledCount = venues.filter((v) => !v.monthlyChargeEnabled).length;

  const filtered = venues.filter((v) => {
    if (filter === "enabled")  return  v.monthlyChargeEnabled;
    if (filter === "disabled") return !v.monthlyChargeEnabled;
    return true;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all",      label: `All (${venues.length})`     },
    { key: "enabled",  label: `Enabled (${enabledCount})`  },
    { key: "disabled", label: `Not set (${disabledCount})` },
  ];

  const Icon = meta.icon;

  return (
    <section style={s.section}>
      <div style={s.secHead}>
        <div style={s.secTitle}>
          <Icon size={19} color={O.primary} />
          <h2 style={s.secH2}>{meta.label}</h2>
          <span style={s.badge}>{venues.length}</span>
        </div>

        {venues.length > 0 && (
          <div style={s.filterRow}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  ...s.filterPill,
                  background:  filter === f.key ? O.primary     : "transparent",
                  color:       filter === f.key ? O.white       : O.textMuted,
                  borderColor: filter === f.key ? O.primary     : O.borderMid,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={s.stateBox}>
          <Loader2 size={22} color={O.primary} style={{ animation: "spin 1s linear infinite" }} />
          <p style={s.stateText}>Loading {meta.label.toLowerCase()}…</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ ...s.feedback, color: O.error, background: O.errorBg, borderColor: O.errorBorder, marginBottom: 0 }}>
          <AlertCircle size={14} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={load} style={s.retryBtn}>Retry</button>
        </div>
      )}

      {!loading && !error && venues.length === 0 && (
        <div style={s.stateBox}>
          <Icon size={30} color={O.border} />
          <p style={s.stateText}>No {meta.label.toLowerCase()} found.</p>
        </div>
      )}

      {!loading && !error && venues.length > 0 && filtered.length === 0 && (
        <div style={s.stateBox}>
          <p style={s.stateText}>No venues match this filter.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={s.cardList}>
          {filtered.map((v) => (
            <VenueCard
              key={v._id}
              venue={v}
              meta={meta}
              token={token}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function MonthlyTab({ token, user }: MonthlyTabProps) {
  console.log("MonthlyTab user:", user); 
  const merchantId = user?._id;
  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <div style={s.pageIconWrap}>
          <Repeat size={20} color={O.primary} />
        </div>
        <div>
          <h1 style={s.pageTitle}>Monthly Plans</h1>
          <p style={s.pageSub}>
            Enable and configure monthly billing for your parking lots, garages,
            and residences.
          </p>
        </div>
      </div>

      {VENUE_TYPES.map((meta) => (
        <Section key={meta.key} meta={meta} token={token} merchantId={merchantId} />
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page:        { maxWidth: 800, margin: "0 auto", padding: "28px 20px 64px", fontFamily: "'DM Sans', sans-serif" },
  pageHead:    { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 32 },
  pageIconWrap:{ width: 42, height: 42, borderRadius: 12, background: O.primaryBg, border: `1px solid ${O.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  pageTitle:   { fontSize: 24, fontWeight: 800, margin: 0, color: O.text, letterSpacing: "-0.3px", fontFamily: "'Playfair Display', serif" },
  pageSub:     { fontSize: 13, color: O.textMuted, margin: "4px 0 0", lineHeight: 1.5 },

  section:   { marginBottom: 36 },
  secHead:   { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10, marginBottom: 12 },
  secTitle:  { display: "flex", alignItems: "center", gap: 8 },
  secH2:     { fontSize: 16, fontWeight: 700, margin: 0, color: O.text },
  badge:     { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, color: O.textMuted, background: O.bgDeep },
  filterRow: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  filterPill:{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1.5px solid", cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif" },

  cardList:   { display: "flex", flexDirection: "column" as const, gap: 8 },
  card:       { background: O.card, borderRadius: 14, border: "1.5px solid", transition: "border-color 0.2s, box-shadow 0.2s", overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", userSelect: "none" as const, gap: 10 },
  cardLeft:   { display: "flex", alignItems: "center", gap: 11, minWidth: 0, flex: 1 },
  iconBadge:  { width: 36, height: 36, borderRadius: 10, background: O.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardName:   { fontSize: 14, fontWeight: 700, margin: 0, color: O.text, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 },
  cardAddr:   { fontSize: 11, color: O.textMuted, margin: "2px 0 0", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 },
  cardRight:  { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  pill:       { display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },

  panel:   { padding: "0 16px 16px" },
  divider: { height: 1, background: O.border, marginBottom: 14 },

  switchRow:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 14 },
  switchLabel: { fontSize: 13, fontWeight: 700, margin: 0, color: O.text },
  switchSub:   { fontSize: 12, color: O.textMuted, margin: "3px 0 0", lineHeight: 1.4 },
  track:       { width: 44, height: 24, borderRadius: 12, position: "relative" as const, transition: "background 0.2s" },
  thumb:       { position: "absolute" as const, top: 3, left: 3, width: 18, height: 18, borderRadius: "50%", background: O.white, transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.22)" },

  fieldLabel: { fontSize: 12, fontWeight: 600, color: O.textMuted, marginBottom: 7 },
  rateRow:    { display: "flex", alignItems: "center", border: "1.5px solid", borderRadius: 10, padding: "0 13px", height: 48, background: O.bg, transition: "border-color 0.2s, box-shadow 0.2s" },
  ratePrefix: { fontSize: 18, fontWeight: 700, color: O.textMuted, marginRight: 5 },
  rateInput:  { flex: 1, border: "none", background: "transparent", fontSize: 18, fontWeight: 700, color: O.text, outline: "none", minWidth: 0, fontFamily: "'DM Sans', sans-serif" },
  rateSuffix: { fontSize: 12, color: O.textMuted },

  preview:      { marginTop: 10, background: O.bgDeep, borderRadius: 10, padding: "10px 13px", display: "flex", flexDirection: "column" as const, gap: 6 },
  previewRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { fontSize: 12, color: O.textMuted },
  previewVal:   { fontSize: 13, fontWeight: 700, color: O.text },

  feedback: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, border: "1px solid", borderRadius: 8, padding: "8px 12px", marginBottom: 10 },

  saveBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: O.white, border: "none", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.2s, background 0.2s" },

  retryBtn: { background: "none", border: "none", color: O.error, fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0, flexShrink: 0 },

  stateBox:  { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, padding: "30px 0", borderRadius: 14, border: `1.5px dashed ${O.borderMid}`, background: O.bgPage },
  stateText: { fontSize: 13, color: O.textMuted, margin: 0 },
};