import { useState, useEffect } from "react";
import useStore from "../lib/store";
import LeadCard from "./LeadCard";
import PitchModal from "./PitchModal";
import { getRandomDemoLead, DEMO_LEADS } from "../lib/demoLeads";
import { heatLevel } from "../lib/scoring";

function exportCSV(leads) {
  const headers = ["Handle","Source","Region","Score","Heat","Keyword","Excerpt","URL","Date"];
  const rows = leads.map(l => [
    '"' + (l.handle  || "").replace(/"/g, "") + '"',
    '"' + (l.source  || "") + '"',
    '"' + (l.region  || "") + '"',
    l.score || 0,
    heatLevel(l.score),
    '"' + (l.keyword || "").replace(/"/g, "") + '"',
    '"' + (l.excerpt || "").replace(/"/g, "").slice(0, 100) + '"',
    '"' + ((l.contact && l.contact.url) || "") + '"',
    '"' + (l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "") + '"',
  ]);
  const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "leads-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportWhatsAppBulk(leads) {
  const text = leads
    .filter(l => heatLevel(l.score) === "hot" || heatLevel(l.score) === "warm")
    .slice(0, 20)
    .map((l, i) =>
      (i + 1) + ". " + l.handle + " (" + l.source + ")\n" +
      "Score: " + l.score + " | " + l.region + "\n" +
      (l.excerpt || "").slice(0, 80) + "...\n" +
      ((l.contact && l.contact.url) ? l.contact.url : "") + "\n"
    )
    .join("\n");
  navigator.clipboard && navigator.clipboard.writeText(text);
  alert("Top " + Math.min(leads.length, 20) + " leads copied to clipboard — paste into WhatsApp or any tool.");
}

export default function LeadsPage() {
  const {
    leads, dismissed, pitched, archived, isScanning, scanProgress,
    addLeads, setScanning, setScanProgress, config, getColdLeads,
    restoreLead, dismissLead,
  } = useStore();

  const [filter,      setFilter]      = useState("all");
  const [view,        setView]        = useState("active");  // active | cold
  const [pitchTarget, setPitchTarget] = useState(null);
  const [scanMsg,     setScanMsg]     = useState("");
  const [scanError,   setScanError]   = useState("");
  const [newCount,    setNewCount]    = useState(0);

  const coldLeads = getColdLeads ? getColdLeads() : [];

  const activeLeads = leads.filter(l => {
    if (dismissed.includes(l.id))  return false;
    if (archived.includes(l.id))   return false;
    // exclude cold leads from main feed
    const ageDays = (Date.now() - new Date(l.createdAt).getTime()) / 86400000;
    if (ageDays > (config.coldStorageDays || 7)) return false;
    return true;
  });

  const visible = activeLeads.filter(l => {
    if (l.score < (config.minScore || 0)) return false;
    if (filter === "hot")       return heatLevel(l.score) === "hot";
    if (filter === "warm")      return heatLevel(l.score) === "warm";
    if (filter === "cold")      return heatLevel(l.score) === "cold";
    if (filter === "ng")        return (l.region || "").includes("Nigeria");
    if (filter === "intl")      return !(l.region || "").includes("Nigeria");
    if (filter === "unpitched") return !pitched.includes(l.id);
    return true;
  });

  const allActive    = leads.filter(l => !dismissed.includes(l.id) && !archived.includes(l.id));
  const hotCount     = allActive.filter(l => heatLevel(l.score) === "hot").length;

  const runScan = async () => {
    if (isScanning) return;
    setScanning(true);
    setScanProgress(0);
    setScanError("");
    setNewCount(0);

    const STEPS = [
      "Scanning Reddit threads...",
      "Scanning Nairaland forums...",
      "Checking Twitter / X...",
      "Scoring and ranking results...",
    ];
    const enabledSources = (config.sources || []).filter(s => s.enabled).map(s => s.id);
    let step = 0;
    setScanMsg(STEPS[0]);
    const ticker = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1);
      setScanMsg(STEPS[step]);
      setScanProgress(Math.round(((step + 1) / STEPS.length) * 80));
    }, 900);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords:    config.keywords || [],
          sources:     enabledSources,
          existingIds: leads.map(l => l.id),
        }),
      });
      clearInterval(ticker);
      if (!res.ok) throw new Error("Server error " + res.status);
      const data  = await res.json();
      const fresh = data.leads || [];
      setScanProgress(100);
      setScanMsg("Done! Found " + fresh.length + " new leads.");
      setNewCount(fresh.length);
      if (fresh.length > 0) addLeads(fresh);
    } catch (err) {
      clearInterval(ticker);
      setScanError("Could not reach scanner — showing demo leads instead.");
      const fallback = [];
      const used = new Set(leads.map(l => l.id));
      for (let i = 0; i < 3; i++) {
        const l = getRandomDemoLead([...used]);
        if (l) { fallback.push(l); used.add(l.id); }
      }
      if (fallback.length) addLeads(fallback);
      setNewCount(fallback.length);
      setScanMsg("Loaded " + fallback.length + " demo leads.");
    }
    setTimeout(() => { setScanning(false); setScanProgress(0); setScanMsg(""); }, 2500);
  };

  useEffect(() => {
    if (leads.length === 0) addLeads(DEMO_LEADS);
  }, []); // eslint-disable-line

  const FILTERS = [
    { id: "all",       label: "All" },
    { id: "hot",       label: "Hot" },
    { id: "warm",      label: "Warm" },
    { id: "cold",      label: "Cold" },
    { id: "ng",        label: "Nigeria" },
    { id: "intl",      label: "International" },
    { id: "unpitched", label: "Unpitched" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Active leads",  value: allActive.length,            color: "var(--accent2)" },
          { label: "Hot leads",     value: hotCount,                     color: "#ef4444" },
          { label: "Pitched",       value: pitched.length,               color: "#22c55e" },
          { label: "Cold storage",  value: coldLeads.length,             color: coldLeads.length > 0 ? "#f59e0b" : "var(--text3)" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px", cursor: m.label === "Cold storage" ? "pointer" : "default" }}
            onClick={() => m.label === "Cold storage" && setView(view === "cold" ? "active" : "cold")}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Age indicator legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {[["#22c55e","Fresh (under 24h)"],["#f59e0b","Aging (1-3 days)"],["#ef4444","Nearly cold (3+ days)"]].map(([c,l]) => (
          <span key={l} style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
            {l}
          </span>
        ))}
      </div>

      {/* Scan progress */}
      {isScanning && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{scanMsg}</span>
            <span style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 600 }}>{scanProgress}%</span>
          </div>
          <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: scanProgress + "%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      {!isScanning && newCount > 0 && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#22c55e" }}>{newCount} new lead{newCount > 1 ? "s" : ""} added!</span>
          <button onClick={() => setNewCount(0)} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 18 }}>x</button>
        </div>
      )}

      {scanError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#ef4444" }}>{scanError}</span>
          <button onClick={() => setScanError("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>x</button>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Active / Cold Storage toggle */}
          <div style={{ display: "flex", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 3 }}>
            {[["active","Live Leads"],["cold","Cold Storage"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit",
                background: view === v ? "var(--bg3)" : "transparent",
                color: view === v ? "var(--text)" : "var(--text2)",
                fontWeight: view === v ? 600 : 400,
              }}>
                {l}
                {v === "cold" && coldLeads.length > 0 && (
                  <span style={{ marginLeft: 5, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "0 4px" }}>
                    {coldLeads.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {config.lastScan && (
            <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center" }}>
              Last scan: {new Date(config.lastScan).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={runScan} disabled={isScanning} style={{ fontSize: 12 }}>
            {isScanning ? "Scanning..." : "Scan now"}
          </button>
          <button className="btn" onClick={() => { const l = getRandomDemoLead(leads.map(x => x.id)); if (l) addLeads([l]); }} style={{ fontSize: 12 }}>
            Simulate
          </button>
          <button className="btn" onClick={() => exportCSV(view === "cold" ? coldLeads : visible)} style={{ fontSize: 12 }}>
            CSV
          </button>
          <button className="btn" onClick={() => exportWhatsAppBulk(view === "cold" ? coldLeads : visible)} style={{ fontSize: 12 }}>
            Bulk copy
          </button>
        </div>
      </div>

      {/* ── COLD STORAGE VIEW ── */}
      {view === "cold" && (
        <div>
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#f59e0b" }}>
            These {coldLeads.length} lead{coldLeads.length !== 1 ? "s" : ""} arrived more than {config.coldStorageDays || 7} days ago without being pitched. Review them — some may still convert.
          </div>
          {coldLeads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div>No cold leads — you are on top of everything!</div>
            </div>
          ) : coldLeads.map(lead => (
            <div key={lead.id} style={{ marginBottom: 10 }}>
              <LeadCard lead={lead} onPitch={l => setPitchTarget(l)} />
              <div style={{ display: "flex", gap: 6, marginTop: 4, paddingLeft: 4 }}>
                <button className="btn" style={{ fontSize: 11, padding: "3px 10px", color: "#22c55e" }}
                  onClick={() => restoreLead(lead.id)}>
                  Restore to active
                </button>
                <button className="btn btn-danger" style={{ fontSize: 11, padding: "3px 10px" }}
                  onClick={() => dismissLead(lead.id)}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVE LEADS VIEW ── */}
      {view === "active" && (
        <>
          <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 8, padding: 3, marginBottom: 16, flexWrap: "wrap", border: "1px solid var(--border)" }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none", fontFamily: "inherit",
                fontWeight: filter === f.id ? 600 : 400,
                background: filter === f.id ? "var(--bg3)" : "transparent",
                color: filter === f.id ? "var(--text)" : "var(--text2)",
              }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📡</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>No leads match this filter</div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>Click Scan now to pull real leads</div>
                <button className="btn btn-primary" onClick={runScan} disabled={isScanning}>Scan now</button>
              </div>
            ) : (
              visible.map(lead => <LeadCard key={lead.id} lead={lead} onPitch={l => setPitchTarget(l)} />)
            )}
          </div>
        </>
      )}

      {pitchTarget && <PitchModal lead={pitchTarget} onClose={() => setPitchTarget(null)} />}
    </div>
  );
}
