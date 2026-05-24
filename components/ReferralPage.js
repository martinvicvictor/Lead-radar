import { useState } from "react";
import useStore from "../lib/store";

const STAGES = ["Lead", "Pitched", "Replied", "Converted", "Lost"];

const EMPTY_FORM = {
  clientName:  "",
  source:      "",
  referredBy:  "",
  service:     "",
  value:       "",
  stage:       "Lead",
  notes:       "",
  date:        new Date().toISOString().slice(0, 10),
};

export default function ReferralPage() {
  const { config } = useStore();
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("referral-records") || "[]");
    } catch { return []; }
  });
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [filter,      setFilter]      = useState("all");

  const save = (updated) => {
    setRecords(updated);
    try { localStorage.setItem("referral-records", JSON.stringify(updated)); } catch (_) {}
  };

  const submit = () => {
    if (!form.clientName.trim()) return;
    if (editId) {
      save(records.map(r => r.id === editId ? { ...form, id: editId } : r));
      setEditId(null);
    } else {
      save([{ ...form, id: "ref-" + Date.now() }, ...records]);
    }
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  const startEdit = (r) => { setForm({ ...r }); setEditId(r.id); setShowForm(true); };
  const remove    = (id) => save(records.filter(r => r.id !== id));

  const visible = filter === "all" ? records : records.filter(r => r.stage === filter);

  // Stats
  const converted    = records.filter(r => r.stage === "Converted");
  const totalValue   = converted.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
  const bySource     = {};
  records.forEach(r => { if (r.source) bySource[r.source] = (bySource[r.source] || 0) + 1; });
  const topSource    = Object.entries(bySource).sort((a,b) => b[1]-a[1])[0];

  const STAGE_COLORS = {
    Lead:      "#818cf8",
    Pitched:   "#f59e0b",
    Replied:   "#60a5fa",
    Converted: "#22c55e",
    Lost:      "#ef4444",
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Referral Tracker</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Track where your clients come from and what is working</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(!showForm); }} style={{ fontSize: 12 }}>
          + Add client
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total tracked",   value: records.length,   color: "var(--accent2)" },
          { label: "Converted",       value: converted.length, color: "#22c55e" },
          { label: "Total value",     value: totalValue > 0 ? (totalValue >= 1000 ? "₦" + (totalValue/1000).toFixed(0) + "k" : "₦" + totalValue) : "—", color: "#22c55e" },
          { label: "Top source",      value: topSource ? topSource[0] : "—", color: "var(--text)" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1.2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{editId ? "Edit record" : "Add new client"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["clientName",  "Client name *",       "text",  "e.g. Emeka Salon Lagos"],
              ["source",      "Lead source",          "text",  "e.g. Reddit, Nairaland, Referral, TikTok"],
              ["referredBy",  "Referred by",          "text",  "Name of referrer (if any)"],
              ["service",     "Service sold",         "text",  "e.g. Business website"],
              ["value",       "Deal value (naira)",   "number","e.g. 150000"],
              ["date",        "Date",                 "date",  ""],
            ].map(([key, label, type, ph]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>{label}</div>
                <input type={type} className="input" value={form[key]} placeholder={ph}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>Stage</div>
              <select className="input" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>Notes</div>
            <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this client or deal..." style={{ minHeight: 60 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={submit}>{editId ? "Save changes" : "Add client"}</button>
            <button className="btn" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 8, padding: 3, marginBottom: 14, flexWrap: "wrap", border: "1px solid var(--border)" }}>
        {["all", ...STAGES].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit",
            fontWeight: filter === s ? 600 : 400,
            background: filter === s ? "var(--bg3)" : "transparent",
            color: filter === s ? "var(--text)" : "var(--text2)",
          }}>{s === "all" ? "All" : s}</button>
        ))}
      </div>

      {/* Records list */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 13 }}>No records yet — add your first client above</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map(r => (
            <div key={r.id} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "12px 14px",
              borderLeft: "3px solid " + (STAGE_COLORS[r.stage] || "#818cf8"),
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.clientName}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      background: (STAGE_COLORS[r.stage] || "#818cf8") + "22",
                      color: STAGE_COLORS[r.stage] || "#818cf8" }}>
                      {r.stage}
                    </span>
                    {r.value && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>₦{parseFloat(r.value).toLocaleString()}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {r.source    && <span style={{ fontSize: 11, color: "var(--text3)" }}>Source: {r.source}</span>}
                    {r.referredBy && <span style={{ fontSize: 11, color: "var(--text3)" }}>Ref: {r.referredBy}</span>}
                    {r.service   && <span style={{ fontSize: 11, color: "var(--text3)" }}>Service: {r.service}</span>}
                    {r.date      && <span style={{ fontSize: 11, color: "var(--text3)" }}>{r.date}</span>}
                  </div>
                  {r.notes && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, fontStyle: "italic" }}>{r.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => remove(r.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
