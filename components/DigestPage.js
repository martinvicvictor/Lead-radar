import { useState, useEffect } from "react";
import useStore from "../lib/store";
import { heatColor, heatLabel } from "../lib/scoring";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return Math.round(diff) + "s ago";
  if (diff < 3600)  return Math.round(diff / 60) + "m ago";
  if (diff < 86400) return Math.round(diff / 3600) + "h ago";
  return Math.round(diff / 86400) + "d ago";
}

export default function DigestPage() {
  const { leads, pitched, outreachLog, dismissed, config, setActiveTab } = useStore();
  const [digest,  setDigest]  = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, pitched, outreachLog, dismissed }),
      });
      const data = await res.json();
      setDigest(data);
    } catch (e) {
      // Compute locally if API fails
      const now    = Date.now();
      const DAY_MS = 86400000;
      const today  = leads.filter(l => now - new Date(l.createdAt).getTime() < DAY_MS);
      const hot    = today.filter(l => l.score >= 78);
      setDigest({
        today:    { total: today.length, hot: hot.length, pitched: 0, topKw: null, topSrc: null },
        week:     { total: leads.length, pitched: pitched.length, convRate: 0 },
        topLeads: today.filter(l => !pitched.includes(l.id)).sort((a,b) => b.score - a.score).slice(0, 5),
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const copyDigest = () => {
    if (!digest) return;
    const text = [
      "LEAD RADAR — DAILY DIGEST",
      new Date().toLocaleDateString(),
      "",
      "TODAY",
      "New leads:   " + digest.today.total,
      "Hot leads:   " + digest.today.hot,
      "Pitched:     " + digest.today.pitched,
      digest.today.topKw  ? "Top keyword: " + digest.today.topKw  : "",
      digest.today.topSrc ? "Top source:  " + digest.today.topSrc : "",
      "",
      "THIS WEEK",
      "Total leads: " + digest.week.total,
      "Pitched:     " + digest.week.pitched,
      "Conv. rate:  " + digest.week.convRate + "%",
    ].filter(Boolean).join("\n");
    navigator.clipboard && navigator.clipboard.writeText(text);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
      <div style={{ fontSize: 13 }}>Loading digest...</div>
    </div>
  );

  if (!digest) return null;

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Daily Digest</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={load} style={{ fontSize: 12 }}>Refresh</button>
          <button className="btn" onClick={copyDigest} style={{ fontSize: 12 }}>Copy summary</button>
        </div>
      </div>

      {/* Today vs Week */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {/* Today */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>Today</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "New leads",  value: digest.today.total,   color: "var(--accent2)" },
              { label: "Hot leads",  value: digest.today.hot,     color: "#ef4444" },
              { label: "Pitched",    value: digest.today.pitched, color: "#22c55e" },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {(digest.today.topKw || digest.today.topSrc) && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              {digest.today.topKw && (
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                  Best keyword: <span style={{ color: "var(--text)", fontWeight: 500 }}>{digest.today.topKw}</span>
                </div>
              )}
              {digest.today.topSrc && (
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  Best source: <span style={{ color: "var(--text)", fontWeight: 500 }}>{digest.today.topSrc}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* This week */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>This week</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total leads", value: digest.week.total,    color: "var(--accent2)" },
              { label: "Pitched",     value: digest.week.pitched,  color: "#22c55e" },
              { label: "Conv. rate",  value: digest.week.convRate + "%", color: digest.week.convRate > 20 ? "#22c55e" : "#f59e0b" },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>Pitching rate</div>
            <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3 }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: digest.week.convRate > 20 ? "#22c55e" : "#f59e0b",
                width: Math.min(digest.week.convRate, 100) + "%",
                transition: "width 0.8s ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top unpitched leads */}
      {digest.topLeads && digest.topLeads.length > 0 && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            Top unpitched leads today
          </div>
          {digest.topLeads.map((lead, i) => (
            <div key={lead.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 12,
              marginBottom: 12, borderBottom: i < digest.topLeads.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: heatColor(lead.score) + "22",
                color: heatColor(lead.score),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>{lead.score}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{lead.handle}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{lead.source}</span>
                  <span style={{ fontSize: 10, color: heatColor(lead.score), fontWeight: 600, background: heatColor(lead.score) + "20", padding: "1px 6px", borderRadius: 10 }}>
                    {heatLabel(lead.score)}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{timeAgo(lead.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
                  {(lead.excerpt || "").slice(0, 120)}...
                </div>
              </div>
              <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
                onClick={() => setActiveTab("leads")}>
                Go pitch
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Motivation / tip */}
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius)", padding: "14px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)", marginBottom: 6 }}>Daily tip</div>
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
          {digest.today.hot > 0
            ? "You have " + digest.today.hot + " hot lead" + (digest.today.hot > 1 ? "s" : "") + " today — pitch them first. Hot leads go cold within 24-48 hours. Speed is your biggest advantage."
            : digest.today.total > 0
            ? "You have " + digest.today.total + " new lead" + (digest.today.total > 1 ? "s" : "") + " today. Review them and pitch the highest-scoring ones while they are still fresh."
            : "No leads yet today. Click Scan now on the Leads page to pull fresh leads from Reddit and Nairaland. Add more keywords in Config to widen your net."
          }
        </div>
      </div>
    </div>
  );
}
