import { useState } from "react";
import { heatLevel, heatColor, heatLabel } from "../lib/scoring";
import useStore from "../lib/store";

const STAGES = ["New", "Contacted", "Replied", "Converted", "Lost"];
const STAGE_COLORS = {
  New:       { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  Contacted: { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  Replied:   { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  Converted: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  Lost:      { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
};
const SOURCE_COLORS = {
  reddit:    { bg: "rgba(255,86,0,0.12)",    color: "#ff6314" },
  twitter:   { bg: "rgba(29,161,242,0.12)",  color: "#1da1f2" },
  linkedin:  { bg: "rgba(0,119,181,0.12)",   color: "#0a66c2" },
  facebook:  { bg: "rgba(24,119,242,0.12)",  color: "#1877f2" },
  quora:     { bg: "rgba(180,0,0,0.12)",     color: "#b92b27" },
  nairaland: { bg: "rgba(0,160,0,0.12)",     color: "#00a800" },
  instagram: { bg: "rgba(193,53,132,0.12)",  color: "#c13584" },
  tiktok:    { bg: "rgba(0,0,0,0.2)",        color: "#69c9d0" },
  google:    { bg: "rgba(66,133,244,0.12)",  color: "#4285f4" },
  default:   { bg: "rgba(99,102,241,0.12)",  color: "var(--accent2)" },
};

function getSrcStyle(source) {
  const s = (source || "").toLowerCase();
  for (const [k, v] of Object.entries(SOURCE_COLORS)) {
    if (s.includes(k)) return v;
  }
  return SOURCE_COLORS.default;
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return Math.round(diff) + "s ago";
  if (diff < 3600)  return Math.round(diff / 60) + "m ago";
  if (diff < 86400) return Math.round(diff / 3600) + "h ago";
  return Math.round(diff / 86400) + "d ago";
}

// Returns colour based on lead age
function ageColor(iso, coldDays) {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (days < 1)                return "#22c55e";  // green — fresh
  if (days < (coldDays || 7) / 2) return "#f59e0b"; // amber — aging
  return "#ef4444";                                // red — nearly cold
}

function ageLabel(iso) {
  const hours = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (hours < 1)  return "Just in";
  if (hours < 24) return Math.round(hours) + "h old";
  return Math.round(hours / 24) + "d old";
}

export default function LeadCard({ lead, onPitch }) {
  const { dismissLead, archiveLead, pitched, leadNotes, leadStages,
          setLeadNote, setLeadStage, config } = useStore();

  const [showNote,     setShowNote]     = useState(false);
  const [noteText,     setNoteText]     = useState(leadNotes[lead.id] || "");
  const [findingEmail, setFindingEmail] = useState(false);
  const [foundEmail,   setFoundEmail]   = useState(
    lead.contact && lead.contact.email ? lead.contact.email : null
  );
  const [showStage, setShowStage] = useState(false);

  const heat       = heatLevel(lead.score);
  const srcStyle   = getSrcStyle(lead.source);
  const isPitched  = pitched.includes(lead.id);
  const stage      = leadStages[lead.id] || "New";
  const stageStyle = STAGE_COLORS[stage] || STAGE_COLORS.New;
  const heatBorder = heat === "hot" ? "#ef4444" : heat === "warm" ? "#f59e0b" : "#3b82f6";
  const ageDotColor = ageColor(lead.createdAt, config.coldStorageDays);

  const saveNote = () => { setLeadNote(lead.id, noteText); setShowNote(false); };

  const findEmail = async () => {
    if (!lead.contact || !lead.contact.url) return;
    setFindingEmail(true);
    try {
      let domain = lead.contact.url;
      try { domain = new URL(lead.contact.url).hostname.replace("www.", ""); } catch (_) {}
      const res  = await fetch("/api/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (data.email) setFoundEmail(data.email);
    } catch (e) { console.error("Email find error", e); }
    setFindingEmail(false);
  };

  return (
    <div className="fade-in" style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid " + heatBorder,
      borderRadius: "var(--radius)",
      padding: "12px 14px",
    }}>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, flex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: srcStyle.bg, color: srcStyle.color, whiteSpace: "nowrap" }}>
            {lead.source}
          </span>
          {lead.sub && <span style={{ fontSize: 11, color: "var(--text3)" }}>{lead.sub}</span>}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)" }}>{lead.handle}</span>
          {isPitched && (
            <span style={{ fontSize: 10, background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>Pitched</span>
          )}
          {/* Pipeline stage */}
          <button onClick={() => setShowStage(!showStage)} style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            background: stageStyle.bg, color: stageStyle.color,
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>
            {stage} {showStage ? "▲" : "▼"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Age indicator dot */}
          <span title={ageLabel(lead.createdAt)} style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: ageDotColor, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
            background: heat === "hot" ? "rgba(239,68,68,0.12)" : heat === "warm" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)",
            color: heatBorder,
          }}>
            {heatLabel(lead.score)} {lead.score}
          </span>
          <button onClick={() => dismissLead(lead.id)} style={{
            background: "none", border: "none", color: "var(--text3)",
            cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1,
          }} title="Dismiss">x</button>
        </div>
      </div>

      {/* Stage selector */}
      {showStage && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {STAGES.map(s => (
            <button key={s} onClick={() => { setLeadStage(lead.id, s); setShowStage(false); }} style={{
              fontSize: 11, fontWeight: stage === s ? 700 : 400,
              padding: "3px 10px", borderRadius: 20,
              background: stage === s ? (STAGE_COLORS[s] || STAGE_COLORS.New).bg : "var(--bg3)",
              color: stage === s ? (STAGE_COLORS[s] || STAGE_COLORS.New).color : "var(--text2)",
              border: "none", cursor: "pointer", fontFamily: "inherit",
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Score bar */}
      <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, marginBottom: 8 }}>
        <div style={{ height: "100%", width: lead.score + "%", background: heatBorder, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>

      {/* Excerpt */}
      <div style={{
        fontSize: 13, color: "var(--text)", lineHeight: 1.6,
        background: "var(--bg3)", padding: "9px 11px",
        borderRadius: 7, marginBottom: 9,
        borderLeft: "2px solid var(--border2)", fontStyle: "italic",
      }}>
        "{(lead.excerpt || "").slice(0, 240)}{(lead.excerpt || "").length > 240 ? "..." : ""}"
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        {[
          { icon: "🕐", text: timeAgo(lead.createdAt), color: ageDotColor },
          { icon: "📍", text: lead.region },
          { icon: "🔖", text: lead.keyword },
          foundEmail ? { icon: "📧", text: foundEmail } : null,
          lead.contact && lead.contact.phone ? { icon: "📞", text: "Phone found" } : null,
        ].filter(Boolean).map((m, i) => (
          <span key={i} style={{ fontSize: 11, color: m.color || "var(--text2)", display: "flex", alignItems: "center", gap: 3 }}>
            {m.icon} {m.text}
          </span>
        ))}
      </div>

      {/* Note preview */}
      {leadNotes[lead.id] && !showNote && (
        <div style={{
          fontSize: 11, color: "var(--text2)", background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6,
          padding: "6px 10px", marginBottom: 8, lineHeight: 1.5,
        }}>
          📝 {leadNotes[lead.id]}
        </div>
      )}

      {/* Note editor */}
      {showNote && (
        <div style={{ marginBottom: 8 }}>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a private note about this lead..."
            className="input"
            style={{ minHeight: 70, fontSize: 12, marginBottom: 6 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={saveNote}>Save note</button>
            <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setShowNote(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => onPitch(lead)}>
          {isPitched ? "Re-pitch" : "Pitch lead"}
        </button>
        {lead.contact && lead.contact.url && (
          <a href={lead.contact.url} target="_blank" rel="noreferrer">
            <button className="btn" style={{ fontSize: 12 }}>View post</button>
          </a>
        )}
        {lead.contact && lead.contact.phone && (
          <a href={"https://wa.me/" + (lead.contact.phone || "").replace(/\D/g, "")} target="_blank" rel="noreferrer">
            <button className="btn btn-success" style={{ fontSize: 12 }}>WhatsApp</button>
          </a>
        )}
        {!foundEmail && (
          <button className="btn" style={{ fontSize: 12 }} onClick={findEmail} disabled={findingEmail}>
            {findingEmail ? "Finding..." : "Find email"}
          </button>
        )}
        <button className="btn" style={{ fontSize: 12 }} onClick={() => setShowNote(!showNote)}>
          {leadNotes[lead.id] ? "Edit note" : "Add note"}
        </button>
        <button className="btn" style={{ fontSize: 12 }} onClick={() => archiveLead(lead.id)} title="Move to cold storage">
          🧊 Archive
        </button>
        <button className="btn" style={{ fontSize: 12 }} onClick={() => navigator.clipboard && navigator.clipboard.writeText(lead.excerpt || "")}>
          Copy
        </button>
      </div>
    </div>
  );
}
