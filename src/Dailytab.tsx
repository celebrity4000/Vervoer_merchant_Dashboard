import { useState, useEffect, useCallback, useRef, CSSProperties } from "react";
import {
  Clock,
  Building2,
  Car,
  Home,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import axiosInstance from "./Axios";

// ─── Theme ────────────────────────────────────────────────────────────────────

const O = {
  primary:       "#FFA629",
  primaryDark:   "#E08A00",
  primaryBg:     "rgba(255,166,41,0.12)",
  primaryBorder: "rgba(255,166,41,0.28)",
  primaryGlow:   "rgba(255,166,41,0.16)",
  primarySoft:   "rgba(255,166,41,0.18)",
  text:          "#1A0F00",
  textMuted:     "#7A5C30",
  bg:            "#FFFAF3",
  bgDeep:        "#FFF1D6",
  bgPage:        "#FFF8EE",
  border:        "rgba(255,166,41,0.20)",
  borderMid:     "rgba(255,166,41,0.30)",
  card:          "#FFFFFF",
  cardBorder:    "rgba(255,166,41,0.18)",
  success:       "#16a34a",
  successBg:     "rgba(22,163,74,0.09)",
  error:         "#993C1D",
  errorBg:       "#FAECE7",
  errorBorder:   "rgba(216,90,48,0.30)",
  white:         "#FFFFFF",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyRateSlot {
  id: string;
  label: string;
  fromTime: string;
  toTime: string;
  price: number;
}

interface RawVenue {
  _id: string;
  parkingName?: string;
  garageName?: string;
  residenceName?: string;
  address?: string;
  gpsLocation?: { coordinates: [number, number] };
  dailyRateEnabled: boolean;
  dailyRates: Omit<DailyRateSlot, "id">[];
}

interface DailyPatch {
  dailyRateEnabled: boolean;
  dailyRates: Omit<DailyRateSlot, "id">[];
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
  { key: "parkinglot", label: "Parking Lots", icon: Car,       venueType: "parking",   searchPath: "/merchants/parkinglot/search", nameKey: "parkingName"   },
  { key: "garage",     label: "Garages",      icon: Building2, venueType: "garage",    searchPath: "/merchants/garage/search",     nameKey: "garageName"    },
  { key: "residence",  label: "Residences",   icon: Home,      venueType: "residence", searchPath: "/merchants/residence/search",  nameKey: "residenceName" },
];

type FilterKey = "all" | "enabled" | "disabled";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const toMins = (hhmm: string, asEnd = false) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  const v = h * 60 + m;
  return asEnd && v === 0 ? 1440 : v;
};

const formatTime12 = (hhmm: string) => {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 0 && m === 0) return "Midnight";
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

function attachIds(slots: Omit<DailyRateSlot, "id">[]): DailyRateSlot[] {
  return slots.map((s) => ({ ...s, id: uid() }));
}

function stripIds(slots: DailyRateSlot[]): Omit<DailyRateSlot, "id">[] {
  return slots.map(({ id: _id, ...rest }) => rest);
}

function validateSlots(slots: DailyRateSlot[]): string | null {
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s.label.trim())  return `Slot ${i + 1}: Label is required.`;
    if (!s.fromTime)      return `Slot ${i + 1}: Start time is required.`;
    if (!s.toTime)        return `Slot ${i + 1}: End time is required.`;
    if (s.price < 0)      return `Slot ${i + 1}: Price must be ≥ 0.`;
    if (toMins(s.fromTime) >= toMins(s.toTime, true))
      return `Slot ${i + 1} ("${s.label}"): End time must be after start time.`;
  }
  const sorted = [...slots].map((s, idx) => ({ ...s, idx })).sort((a, b) => toMins(a.fromTime) - toMins(b.fromTime));
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i], next = sorted[i + 1];
    if (toMins(next.fromTime) < toMins(curr.toTime, true))
      return `"${next.label}" (slot ${next.idx + 1}) overlaps with "${curr.label}" (slot ${curr.idx + 1}).`;
  }
  return null;
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

// Builds hour options 12 AM … 11 PM + Midnight (00:00)
const HOUR_OPTIONS: { label: string; value: string }[] = [];
for (let h = 0; h < 24; h++) {
  const suffix = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  HOUR_OPTIONS.push({ label: `${display} ${suffix}`, value: String(h).padStart(2, "0") });
}
// Midnight alias shown as "00:00 (Midnight)" at top
HOUR_OPTIONS.push({ label: "Midnight (end)", value: "00" });

const MINUTE_OPTIONS = [
  { label: ":00", value: "00" },
  { label: ":15", value: "15" },
  { label: ":30", value: "30" },
  { label: ":45", value: "45" },
];

interface TimePickerProps {
  value: string;       // "HH:MM"
  onChange: (val: string) => void;
  label: string;
}

function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hour   = value ? value.split(":")[0] : "";
  const minute = value ? value.split(":")[1] : "00";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectHour = (h: string) => {
    const m = minute || "00";
    onChange(`${h}:${m}`);
  };

  const selectMinute = (m: string) => {
    const h = hour || "08";
    onChange(`${h}:${m}`);
  };

  const displayValue = value ? formatTime12(value) : "Select";

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* Field label */}
      <p style={s.slotFieldLabel}>{label}</p>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...s.timeBtn,
          borderColor: open ? O.primary : O.borderMid,
          boxShadow:   open ? `0 0 0 3px ${O.primaryGlow}` : "none",
          color:       value ? O.text : O.textMuted,
        }}
      >
        <Clock size={13} color={open ? O.primary : O.textMuted} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 600 }}>
          {displayValue}
        </span>
        <ChevronDown
          size={12}
          color={O.textMuted}
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.timeDropdown}>
          <div style={s.timeDropdownInner}>

            {/* Hours column */}
            <div style={s.timeCol}>
              <p style={s.timeColLabel}>Hour</p>
              <div style={s.timeScroll}>
                {HOUR_OPTIONS.slice(0, 24).map((opt) => {
                  const active = hour === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectHour(opt.value)}
                      style={{
                        ...s.timeOption,
                        background:  active ? O.primary    : "transparent",
                        color:       active ? O.white      : O.text,
                        fontWeight:  active ? 700          : 500,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={s.timeColDivider} />

            {/* Minutes column */}
            <div style={{ ...s.timeCol, flex: "0 0 72px" }}>
              <p style={s.timeColLabel}>Min</p>
              <div style={s.timeScroll}>
                {MINUTE_OPTIONS.map((opt) => {
                  const active = minute === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { selectMinute(opt.value); setOpen(false); }}
                      style={{
                        ...s.timeOption,
                        background:  active ? O.primary    : "transparent",
                        color:       active ? O.white      : O.text,
                        fontWeight:  active ? 700          : 500,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Midnight shortcut */}
              <div style={{ borderTop: `1px solid ${O.border}`, paddingTop: 6, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { onChange("00:00"); setOpen(false); }}
                  style={{
                    ...s.timeOption,
                    fontSize:    10,
                    background:  value === "00:00" ? O.primaryBg : "transparent",
                    color:       value === "00:00" ? O.primary   : O.textMuted,
                    fontWeight:  700,
                    borderRadius: 6,
                    padding:     "5px 6px",
                    width:       "100%",
                  }}
                >
                  Midnight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SlotRow ──────────────────────────────────────────────────────────────────

interface SlotRowProps {
  slot: DailyRateSlot;
  index: number;
  onChange: (id: string, field: keyof DailyRateSlot, value: string | number) => void;
  onRemove: (id: string) => void;
  isOnly: boolean;
}

function SlotRow({ slot, index, onChange, onRemove, isOnly }: SlotRowProps) {
  return (
    <div style={s.slotRow}>
      {/* Handle */}
      <div style={s.slotHandle}>
        <GripVertical size={14} color={O.textMuted} />
        <span style={s.slotNum}>{index + 1}</span>
      </div>

      {/* Label */}
      <div style={{ ...s.slotField, flex: "1.4 1 0" }}>
        <p style={s.slotFieldLabel}>Label</p>
        <input
          type="text"
          placeholder="e.g. Morning"
          value={slot.label}
          onChange={(e) => onChange(slot.id, "label", e.target.value)}
          style={s.slotInput}
        />
      </div>

      {/* From — custom picker */}
      <div style={{ ...s.slotField, flex: "1.1 1 0" }}>
        <TimePicker
          label="From"
          value={slot.fromTime}
          onChange={(v) => onChange(slot.id, "fromTime", v)}
        />
      </div>

      {/* To — custom picker */}
      <div style={{ ...s.slotField, flex: "1.1 1 0" }}>
        <TimePicker
          label="To"
          value={slot.toTime}
          onChange={(v) => onChange(slot.id, "toTime", v)}
        />
      </div>

      {/* Price */}
      <div style={{ ...s.slotField, flex: "0.8 1 0" }}>
        <p style={s.slotFieldLabel}>Price ($)</p>
        <div style={s.priceWrap}>
          <span style={s.pricePfx}>$</span>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={slot.price === 0 ? "" : slot.price}
            onChange={(e) => onChange(slot.id, "price", parseFloat(e.target.value) || 0)}
            style={{ ...s.slotInput, paddingLeft: 20 }}
          />
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(slot.id)}
        disabled={isOnly}
        title={isOnly ? "Need at least one slot" : "Remove slot"}
        style={{
          ...s.removeBtn,
          opacity: isOnly ? 0.3 : 1,
          cursor:  isOnly ? "not-allowed" : "pointer",
        }}
      >
        <Trash2 size={14} color={O.error} />
      </button>
    </div>
  );
}

// ─── VenueCard ────────────────────────────────────────────────────────────────

interface VenueCardProps {
  venue: RawVenue;
  meta: VenueMeta;
  token?: string;
  onUpdated: (id: string, patch: DailyPatch) => void;
}

function VenueCard({ venue, meta, token, onUpdated }: VenueCardProps) {
  const [open,    setOpen]    = useState(false);
  const [enabled, setEnabled] = useState(venue.dailyRateEnabled);
  const [slots,   setSlots]   = useState<DailyRateSlot[]>(
    venue.dailyRates?.length ? attachIds(venue.dailyRates) : []
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const name = (venue[meta.nameKey] as string | undefined) ?? "Unnamed";

  const addSlot = () => {
    setSlots((prev) => [...prev, { id: uid(), label: "", fromTime: "08:00", toTime: "18:00", price: 0 }]);
    setError(null); setSuccess(false);
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setError(null); setSuccess(false);
  };

  const updateSlot = (id: string, field: keyof DailyRateSlot, value: string | number) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    setError(null); setSuccess(false);
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked && slots.length === 0)
      setSlots([{ id: uid(), label: "", fromTime: "08:00", toTime: "18:00", price: 0 }]);
    setError(null); setSuccess(false);
  };

  const handleSave = async () => {
    if (enabled) {
      if (slots.length === 0) { setError("Add at least one time slot."); return; }
      const err = validateSlots(slots);
      if (err) { setError(err); return; }
    }
    setSaving(true); setError(null); setSuccess(false);
    try {
      await axiosInstance.patch(
        "/merchants/daily-rate-settings",
        { venueType: meta.venueType, venueId: venue._id, dailyRateEnabled: enabled, dailyRates: enabled ? stripIds(slots) : [] },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSuccess(true);
      onUpdated(venue._id, { dailyRateEnabled: enabled, dailyRates: enabled ? stripIds(slots) : [] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiIssues = (err as { response?: { data?: { issues?: { message: string }[] } } })?.response?.data?.issues;
      const msg = apiIssues
        ? apiIssues.map((i) => i.message).join(" · ")
        : ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save. Please try again.");
      setError(msg);
    } finally { setSaving(false); }
  };

  const originalStripped = JSON.stringify(
    venue.dailyRates?.map(({ label, fromTime, toTime, price }) => ({ label, fromTime, toTime, price })) ?? []
  );
  const hasChanges = enabled !== venue.dailyRateEnabled || JSON.stringify(stripIds(slots)) !== originalStripped;

  const totalHours = slots.reduce((acc, s) => {
    if (!s.fromTime || !s.toTime) return acc;
    return acc + (toMins(s.toTime, true) - toMins(s.fromTime)) / 60;
  }, 0);

  return (
    <div style={{ ...s.card, borderColor: open ? O.primary + "55" : O.cardBorder, boxShadow: open ? `0 4px 18px rgba(255,142,0,0.10)` : "none" }}>
      {/* Header */}
      <div style={s.cardHeader} onClick={() => setOpen((o) => !o)}>
        <div style={s.cardLeft}>
          <div style={s.iconBadge}><meta.icon size={17} color={O.primary} /></div>
          <div style={{ minWidth: 0 }}>
            <p style={s.cardName}>{name}</p>
            <p style={s.cardAddr}>{venue.address ?? venue.gpsLocation?.coordinates?.join(", ") ?? "No address"}</p>
          </div>
        </div>
        <div style={s.cardRight}>
          {venue.dailyRateEnabled && venue.dailyRates?.length ? (
            <span style={{ ...s.pill, color: O.success, background: O.successBg }}>
              <CheckCircle2 size={10} style={{ marginRight: 4 }} />
              {venue.dailyRates.length} slot{venue.dailyRates.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span style={{ ...s.pill, color: O.textMuted, background: O.bgDeep }}>Not set</span>
          )}
          {open ? <ChevronUp size={15} color={O.textMuted} /> : <ChevronDown size={15} color={O.textMuted} />}
        </div>
      </div>

      {/* Panel */}
      {open && (
        <div style={s.panel}>
          <div style={s.divider} />

          {/* Toggle */}
          <div style={s.switchRow}>
            <div>
              <p style={s.switchLabel}>Enable daily rate plans</p>
              <p style={s.switchSub}>Set time-based pricing so customers are charged by the hour/slot.</p>
            </div>
            <label style={{ cursor: "pointer", flexShrink: 0 }}>
              <input type="checkbox" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} style={{ display: "none" }} />
              <div style={{ ...s.track, background: enabled ? O.primary : O.border }}>
                <div style={{ ...s.thumb, transform: enabled ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </label>
          </div>

          {/* Slot editor */}
          {enabled && (
            <div style={{ marginBottom: 12 }}>
              <div style={s.slotHeader}>
                <p style={s.fieldLabel}>Time slots &amp; rates</p>
                <span style={s.slotCount}>
                  {slots.length} slot{slots.length !== 1 ? "s" : ""}
                  {totalHours > 0 && ` · ${totalHours.toFixed(1)}h covered`}
                </span>
              </div>

              {slots.length > 0 && (
                <div style={s.slotList}>
                  {slots.map((slot, idx) => (
                    <SlotRow key={slot.id} slot={slot} index={idx} onChange={updateSlot} onRemove={removeSlot} isOnly={slots.length === 1} />
                  ))}
                </div>
              )}

              <button onClick={addSlot} style={s.addBtn}>
                <Plus size={14} style={{ marginRight: 6 }} />
                Add Time Slot
              </button>

              {slots.length > 0 && slots.every((sl) => sl.fromTime && sl.toTime && sl.price > 0 && sl.label) && (
                <div style={s.preview}>
                  {[...slots].sort((a, b) => toMins(a.fromTime) - toMins(b.fromTime)).map((slot) => (
                    <div key={slot.id} style={s.previewRow}>
                      <span style={s.previewLabel}>
                        {slot.label}&nbsp;
                        <span style={{ fontSize: 10, fontWeight: 500, color: O.textMuted }}>
                          {formatTime12(slot.fromTime)} → {formatTime12(slot.toTime)}
                        </span>
                      </span>
                      <span style={s.previewVal}>${slot.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div style={{ ...s.feedback, color: O.error, background: O.errorBg, borderColor: O.errorBorder }}>
              <AlertCircle size={13} /><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ ...s.feedback, color: O.success, background: O.successBg, borderColor: O.success + "44" }}>
              <CheckCircle2 size={13} /><span>Daily rate settings saved!</span>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{ ...s.saveBtn, background: saving || !hasChanges ? O.primaryDark : O.primary, opacity: saving || !hasChanges ? 0.5 : 1, cursor: saving || !hasChanges ? "not-allowed" : "pointer" }}
          >
            {saving ? (
              <><Loader2 size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />Saving…</>
            ) : (
              <><Clock size={14} style={{ marginRight: 6 }} />Save Daily Settings</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps { meta: VenueMeta; token?: string; merchantId?: string; }

function Section({ meta, token, merchantId }: SectionProps) {
  const [venues,  setVenues]  = useState<RawVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<FilterKey>("all");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const url = merchantId ? `${meta.searchPath}?owner=${merchantId}` : meta.searchPath;
      const res = await axiosInstance.get(url);
      const raw: unknown = res.data?.data ?? res.data ?? [];
      setVenues(Array.isArray(raw) ? (raw as RawVenue[]) : []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? `Failed to load ${meta.label}.`);
    } finally { setLoading(false); }
  }, [meta, token]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (id: string, patch: DailyPatch) =>
    setVenues((prev) => prev.map((v) => (v._id === id ? { ...v, ...patch } : v)));

  const enabledCount  = venues.filter((v) =>  v.dailyRateEnabled).length;
  const disabledCount = venues.filter((v) => !v.dailyRateEnabled).length;

  const filtered = venues.filter((v) => {
    if (filter === "enabled")  return  v.dailyRateEnabled;
    if (filter === "disabled") return !v.dailyRateEnabled;
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
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...s.filterPill, background: filter === f.key ? O.primary : "transparent", color: filter === f.key ? O.white : O.textMuted, borderColor: filter === f.key ? O.primary : O.borderMid }}>
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
        <div style={s.stateBox}><p style={s.stateText}>No venues match this filter.</p></div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={s.cardList}>
          {filtered.map((v) => (
            <VenueCard key={v._id} venue={v} meta={meta} token={token} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface DailyTabProps { token?: string; data?: unknown; user?: { _id?: string; firstName?: string }; }

export default function DailyTab({ token, user }: DailyTabProps) {
  const merchantId = user?._id;
  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <div style={s.pageIconWrap}><Clock size={20} color={O.primary} /></div>
        <div>
          <h1 style={s.pageTitle}>Daily Rate Plans</h1>
          <p style={s.pageSub}>Define time-slot pricing for your parking lots, garages, and residences. Each slot has its own label, time window, and rate.</p>
        </div>
      </div>
      {VENUE_TYPES.map((meta) => <Section key={meta.key} meta={meta} token={token} merchantId={merchantId} />)}
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

  section:  { marginBottom: 36 },
  secHead:  { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10, marginBottom: 12 },
  secTitle: { display: "flex", alignItems: "center", gap: 8 },
  secH2:    { fontSize: 16, fontWeight: 700, margin: 0, color: O.text },
  badge:    { fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, color: O.textMuted, background: O.bgDeep },
  filterRow:{ display: "flex", gap: 6, flexWrap: "wrap" as const },
  filterPill:{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1.5px solid", cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif" },

  cardList: { display: "flex", flexDirection: "column" as const, gap: 8 },
  card:     { background: O.card, borderRadius: 14, border: "1.5px solid", transition: "border-color 0.2s, box-shadow 0.2s", overflow: "hidden" },
  cardHeader:{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", userSelect: "none" as const, gap: 10 },
  cardLeft: { display: "flex", alignItems: "center", gap: 11, minWidth: 0, flex: 1 },
  iconBadge:{ width: 36, height: 36, borderRadius: 10, background: O.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardName: { fontSize: 14, fontWeight: 700, margin: 0, color: O.text, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 },
  cardAddr: { fontSize: 11, color: O.textMuted, margin: "2px 0 0", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 },
  cardRight:{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  pill:     { display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },

  panel:   { padding: "0 16px 16px" },
  divider: { height: 1, background: O.border, marginBottom: 14 },

  switchRow:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 14 },
  switchLabel:{ fontSize: 13, fontWeight: 700, margin: 0, color: O.text },
  switchSub:  { fontSize: 12, color: O.textMuted, margin: "3px 0 0", lineHeight: 1.4 },
  track: { width: 44, height: 24, borderRadius: 12, position: "relative" as const, transition: "background 0.2s" },
  thumb: { position: "absolute" as const, top: 3, left: 3, width: 18, height: 18, borderRadius: "50%", background: O.white, transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.22)" },

  slotHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: O.textMuted, margin: 0 },
  slotCount:  { fontSize: 11, fontWeight: 600, color: O.primary },

  slotList:  { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 10 },
  slotRow:   { display: "flex", alignItems: "flex-end", gap: 8, background: O.bgPage, border: `1.5px solid ${O.border}`, borderRadius: 10, padding: "10px 12px" },
  slotHandle:{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, paddingBottom: 6, flexShrink: 0, cursor: "grab" },
  slotNum:   { fontSize: 10, fontWeight: 700, color: O.textMuted },
  slotField: { display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0 },

  slotFieldLabel: {
    fontSize: 10, fontWeight: 600, color: O.textMuted, margin: "0 0 4px",
    textTransform: "uppercase" as const, letterSpacing: "0.5px",
  },

  slotInput: {
    border: `1.5px solid ${O.borderMid}`, borderRadius: 8, padding: "7px 10px",
    fontSize: 13, fontWeight: 600, color: O.text, background: O.white,
    fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%",
    boxSizing: "border-box" as const,
  },

  priceWrap: { position: "relative" as const, display: "flex", alignItems: "center" },
  pricePfx:  { position: "absolute" as const, left: 8, fontSize: 13, fontWeight: 700, color: O.textMuted, pointerEvents: "none" as const },

  removeBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 8,
    border: `1.5px solid ${O.errorBorder}`, background: O.errorBg,
    flexShrink: 0, padding: 0, alignSelf: "flex-end" as const, transition: "opacity 0.18s",
  },

  addBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "9px", borderRadius: 10,
    fontSize: 12, fontWeight: 700, color: O.primary,
    border: `1.5px dashed ${O.primaryBorder}`, background: O.primaryBg,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.18s", marginBottom: 10,
  },

  preview:      { marginTop: 10, background: O.bgDeep, borderRadius: 10, padding: "10px 13px", display: "flex", flexDirection: "column" as const, gap: 6 },
  previewRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { fontSize: 12, color: O.textMuted },
  previewVal:   { fontSize: 13, fontWeight: 700, color: O.text },

  feedback: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, border: "1px solid", borderRadius: 8, padding: "8px 12px", marginBottom: 10 },

  saveBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "11px", borderRadius: 10,
    fontSize: 13, fontWeight: 700, color: O.white, border: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.2s, background 0.2s",
  },

  retryBtn: { background: "none", border: "none", color: O.error, fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0, flexShrink: 0 },

  stateBox:  { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, padding: "30px 0", borderRadius: 14, border: `1.5px dashed ${O.borderMid}`, background: O.bgPage },
  stateText: { fontSize: 13, color: O.textMuted, margin: 0 },

  // ── TimePicker ──
  timeBtn: {
    display: "flex", alignItems: "center", gap: 6,
    width: "100%", padding: "7px 10px", borderRadius: 8,
    border: "1.5px solid", background: O.white,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxSizing: "border-box" as const,
  },

  timeDropdown: {
    position: "absolute" as const,
    top: "calc(100% + 6px)",
    left: 0,
    zIndex: 999,
    background: O.white,
    border: `1.5px solid ${O.primaryBorder}`,
    borderRadius: 12,
    boxShadow: `0 8px 32px rgba(255,142,0,0.18), 0 2px 8px rgba(0,0,0,0.08)`,
    overflow: "hidden",
    minWidth: 220,
  },

  timeDropdownInner: {
    display: "flex",
    maxHeight: 260,
  },

  timeCol: {
    display: "flex",
    flexDirection: "column" as const,
    flex: "1 1 0",
    minWidth: 0,
  },

  timeColLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: O.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    padding: "10px 10px 6px",
    margin: 0,
    borderBottom: `1px solid ${O.border}`,
    background: O.bgPage,
    position: "sticky" as const,
    top: 0,
  },

  timeScroll: {
    overflowY: "auto" as const,
    flex: 1,
    padding: "4px",
  },

  timeColDivider: {
    width: 1,
    background: O.border,
    flexShrink: 0,
  },

  timeOption: {
    display: "block",
    width: "100%",
    padding: "7px 10px",
    fontSize: 12,
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.12s",
    boxSizing: "border-box" as const,
    marginBottom: 1,
  },
};