import { useState, useEffect, useRef } from "react";
import useStore from "../lib/store";
import { heatLevel } from "../lib/scoring";
import { getReachLinks } from "../lib/contactLinks";

// Auto-pitch panel — appears when auto-pitch is toggled ON
// AI generates pitches for hot leads automatically
// You review each one and tap Send — one action only

export default function AutoPitchPanel({ onClose }) {
  const { leads, dismissed, pitched, config, templates, pitchLead, addOutreach } = useStore();

  const [queue,      setQueue]      = useState([]);
  const [current,   setCurrent]    = useState(0);
  const [pitches,   setPitches]    = useState({});
  const [loading,   setLoading]    = useState({});
  const [sent,      setSent]       = useState({});
  const [skipped,   setSkipped]    = useState({});
  const [done,      setDone]       = useState(false);
  const generatedRef = useRef({});

  // Build queue of hot unpitched leads
  useEffect(() => {
    const hotLeads = leads.filter(l =>
      !dismissed.includes(l.id) &&
      !pitched.includes(l.id) &&
      heatLevel(l.score) === "hot"
    ).sort((a, b) => b.score - a.score).slice(0, 10);
    setQueue(hotLeads);
  }, []); // eslint-disable-line

  // Auto-generate pitch for current lead
  useEffect(() => {
    if (!queue.length) return;
    const lead = queue[current];
    if (!lead) return;
    if (generatedRef.current[lead.id]) return;
    generatedRef.current[lead.id] = true;
    generatePitch(lead);
  }, [current, queue]); // eslint-disable-line

  const generatePitch = async (lead) => {
    setLoading(l => ({ ...l, [lead.id]: true }));
    try {
      const tpl = (templates && templates[0]) || {};
      const res = await fetch("/api/ai-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          template: tpl.body || "",
          writingStyle: config.writingStyle || "",
          aiProvider:   config.aiProvider   || "claude",
          userInfo: {
            name:     config.yourName     || "Ike",
            business: config.businessName || "martinvic.com.ng",
            service:  config.yourService  || "Professional website design",
            offering: config.yourOffering || "Websites from 50,000 naira with installments",
            waNumber: config.waNumber     || "",
          },
        }),
      });
      const data = await res.json();
      if (data.pitch) {
        setPitches(p => ({ ...p, [lead.id]: data.pitch }));
      } else {
        // Fallback to template
        const body = (tpl.body || "Hi {name}, I saw your post about {excerpt}...")
          .replace(/{name}/g,         lead.handle || "there")
          .replace(/{platform}/g,     lead.source || "a platform")
          .replace(/{excerpt}/g,      (lead.excerpt || "").slice(0, 60) + "...")
          .replace(/{businessName}/g, config.businessName || "martinvic.com.ng");
        setPitches(p => ({ ...p, [lead.id]: body }));
      }
    } catch (_) {
      const tpl = (templates && templates[0]) || {};
      const body = (tpl.body || "Hi there! I saw your post and I can help.")
        .replace(/{name}/g,         lead.handle || "there")
        .replace(/{platform}/g,     lead.source || "")
        .replace(/{excerpt}/g,      (lead.excerpt || "").slice(0, 60) + "...")
        .replace(/{businessName}/g, config.businessName || "martinvic.com.ng");
      setPitches(p => ({ ...p, [lead.id]: body }));
    }
    setLoading(l => ({ ...l, [lead.id]: false }));
  };

  const handleSend = (lead, channel) => {
    const pitch = pitches[lead.id] || "";
    const links  = getReachLinks(lead);
    const primaryLink = links.find(r => r.primary) || links[0];

    if (channel === "whatsapp" && lead.contact && lead.contact.phone) {
      const num = (lead.contact.phone || "").replace(/\D/g, "");
      window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(pitch), "_blank");
    } else if (channel === "email" && (lead.contact && lead.contact.email)) {
      window.open("mailto:" + lead.contact.email + "?subject=Website Design for Your Business&body=" + encodeURIComponent(pitch), "_blank");
    } else if (channel === "profile" && primaryLink) {
      // Copy pitch to clipboard then open profile
      navigator.clipboard && navigator.clipboard.writeText(pitch);
      window.open(primaryLink.href, "_blank");
    }

    pitchLead(lead.id);
    addOutreach({
      leadId: lead.id, handle: lead.handle, source: lead.source,
      region: lead.region, score: lead.score,
      pitchPreview: pitch.slice(0, 100) + "...",
      template: "Auto-pitch", sentAt: new Date().toISOString(),
    });
    setSent(s => ({ ...s, [lead.id]: true }));
    advanceQueue(lead.id);
  };

  const handleSkip = (leadId) => {
    setSkipped(s => ({ ...s, [leadId]: true }));
    advanceQueue(leadId);
  };

  const advanceQueue = (leadId) => {
    const nextIdx = current + 1;
    if (nextIdx >= queue.length) {
      setDone(true);
    } else {
      setCurrent(nextIdx);
    }
  };

  if (!queue.length) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
      <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 6 }}>No hot leads to pitch right now</div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Hot leads are those with a score of 78 or above. Run a scan to find more.</div>
      <button className="btn" onClick={onClose}>Close</button>
    </div>
  );

  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Auto-pitch session complete!</div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>
        Sent: {Object.values(sent).filter(Boolean).length} pitches
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        Skipped: {Object.values(skipped).filter(Boolean).length}
      </div>
      <button className="btn btn-primary" onClick={onClose}>Done</button>
    </div>
  );

  const lead    = queue[current];
  const pitch   = pitches[lead.id] || "";
  const isLoading = loading[lead.id];
  const links   = getReachLinks(lead);
  const primaryLink = links.find(r => r.primary) || links[0];
  const hasPhone = lead.contact && lead.contact.phone;
  const hasEmail = lead.contact && lead.contact.email;

  return (
    <div>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "var(--text3)" }}>
          Lead {current + 1} of {queue.length}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {queue.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < current ? "#22c55e" : i === current ? "var(--accent)" : "var(--bg3)",
            }} />
          ))}
        </div>
        <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={onClose}>Stop</button>
      </div>

      {/* Lead info */}
      <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.handle}</span>
            <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{lead.source}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.12)", padding: "2px 8px", borderRadius: 20 }}>
            Hot {lead.score}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.5 }}>
          "{(lead.excerpt || "").slice(0, 160)}..."
        </div>
      </div>

      {/* AI-generated pitch */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          AI-generated pitch {isLoading ? "(generating...)" : "(edit if needed)"}
        </div>
        {isLoading ? (
          <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "20px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
            Generating personalised pitch...
          </div>
        ) : (
          <textarea
            value={pitch}
            onChange={e => setPitches(p => ({ ...p, [lead.id]: e.target.value }))}
            className="input"
            style={{ minHeight: 140, fontSize: 13, lineHeight: 1.7, resize: "vertical" }}
          />
        )}
      </div>

      {/* How to reach them */}
      <div style={{
        background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "var(--text2)",
      }}>
        <strong style={{ color: "var(--accent2)" }}>To reach them:</strong> {primaryLink && primaryLink.note}
      </div>

      {/* Send buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {hasPhone && (
          <button className="btn btn-success" style={{ flex: 1, fontSize: 12 }}
            onClick={() => handleSend(lead, "whatsapp")} disabled={isLoading}>
            Send via WhatsApp
          </button>
        )}
        {hasEmail && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}
            onClick={() => handleSend(lead, "email")} disabled={isLoading}>
            Send via Email
          </button>
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 12, background: "rgba(99,102,241,0.2)", borderColor: "var(--accent)" }}
          onClick={() => handleSend(lead, "profile")} disabled={isLoading}
        >
          Copy + Open profile
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" style={{ flex: 1, fontSize: 12 }} onClick={() => handleSkip(lead.id)}>
          Skip this lead
        </button>
        <button className="btn" style={{ fontSize: 12 }} onClick={() => {
          generatedRef.current[lead.id] = false;
          setPitches(p => ({ ...p, [lead.id]: "" }));
          generatePitch(lead);
        }} disabled={isLoading}>
          Regenerate
        </button>
      </div>

      {(lead.source || "").toLowerCase().match(/twitter|x\.com|tiktok|instagram|linkedin|facebook/) && !hasPhone && !hasEmail && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)", background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
          This lead is from {lead.source}. Click "Copy + Open profile" — the pitch will be copied to your clipboard so you can paste it directly when you DM them.
        </div>
      )}
    </div>
  );
}
