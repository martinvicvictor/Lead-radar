import { useState, useEffect } from "react";
import { diffColor, diffLabel, INTENT } from "../lib/keywords";
import useStore from "../lib/store";

export default function KeywordsPage() {
  const { savedKeywords, saveKeywordIdea, removeSavedKeyword, addKeyword, config } = useStore();

  const [seed,         setSeed]         = useState("");
  const [results,      setResults]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [intentFilter, setIntentFilter] = useState("all");
  const [sortBy,       setSortBy]       = useState("diff");
  const [sourceNote,   setSourceNote]   = useState("");
  const [error,        setError]        = useState("");

  // On first load, run a search using the first config keyword automatically
  useEffect(() => {
    if (config.keywords && config.keywords.length > 0) {
      const firstKw = config.keywords[0];
      setSeed(firstKw);
      runSearch(firstKw);
    }
  }, []); // eslint-disable-line

  const runSearch = async (searchTerm) => {
    const term = (searchTerm || seed || "").trim();
    if (!term) return;
    setLoading(true);
    setResults(null);
    setError("");
    setSourceNote("");

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: term,
          configKeywords: config.keywords || [],
        }),
      });

      if (!res.ok) throw new Error("Server error " + res.status);

      const data = await res.json();
      if (data.keywords && data.keywords.length > 0) {
        setResults(data.keywords);
        setSourceNote(
          data.source === "ai"
            ? "AI-powered results based on your topic"
            : "Smart results generated for: " + term
        );
      } else {
        setError("No results returned. Try a more specific topic.");
      }
    } catch (e) {
      setError("Could not fetch keyword ideas: " + e.message);
    }

    setLoading(false);
  };

  const filtered = (results || [])
    .filter(k => intentFilter === "all" || k.intent === intentFilter)
    .sort((a, b) => {
      if (sortBy === "diff")  return a.diff - b.diff;
      if (sortBy === "vol")   return b.vol  - a.vol;
      if (sortBy === "alpha") return a.keyword.localeCompare(b.keyword);
      return 0;
    });

  const isSaved    = (kw) => savedKeywords.some(k => k.keyword === kw);
  const isInConfig = (kw) => (config.keywords || []).includes(kw);

  return (
    <div style={{ maxWidth: 980 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Keyword Research</div>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
          Find low-competition keywords for <strong>any topic</strong> — write blog posts or make YouTube videos to build inbound leads.
          Results are generated for whatever topic you type, including your scraper config keywords.
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          value={seed}
          onChange={e => setSeed(e.target.value)}
          onKeyDown={e => e.key === "Enter" && runSearch(seed)}
          placeholder="Type any topic — e.g. social media ads, logo design, photography..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={() => runSearch(seed)} disabled={loading} style={{ whiteSpace: "nowrap" }}>
          {loading ? "Searching..." : "Find keywords"}
        </button>
      </div>

      {/* Quick-search buttons from config keywords */}
      {config.keywords && config.keywords.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>
            Quick search your scraper keywords
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {config.keywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => { setSeed(kw); runSearch(kw); }}
                style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: "1px solid var(--border2)",
                  background: seed === kw ? "rgba(99,102,241,0.15)" : "var(--bg2)",
                  color: seed === kw ? "var(--accent2)" : "var(--text2)",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {kw}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
            These are your active scraper keywords. Click any to research keywords around that topic.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Intent filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {Object.entries(INTENT).map(([key, val]) => (
          <button key={key} onClick={() => setIntentFilter(intentFilter === key ? "all" : key)} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: intentFilter === key ? val.bg : "var(--bg2)",
            color: intentFilter === key ? val.color : "var(--text3)",
            border: "1px solid " + (intentFilter === key ? val.color + "44" : "var(--border)"),
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {val.label}
          </button>
        ))}
        <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center" }}>Filter by intent</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Generating keyword ideas for: {seed}</div>
          <div style={{ fontSize: 11 }}>This takes a few seconds...</div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>{filtered.length} keywords for </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)" }}>"{seed}"</span>
              {sourceNote && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>— {sourceNote}</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center" }}>Sort:</span>
              {[["diff","Easiest first"],["vol","Highest volume"],["alpha","A-Z"]].map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={sortBy === k ? "btn btn-primary" : "btn"}
                  style={{ fontSize: 11, padding: "4px 10px" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword table */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 24 }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "3fr 80px 110px 120px 1fr 110px",
              padding: "8px 14px", borderBottom: "1px solid var(--border)",
              fontSize: 10, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: "0.5px", gap: 8,
            }}>
              <span>Keyword</span>
              <span>Vol/mo</span>
              <span>Difficulty</span>
              <span>Intent</span>
              <span>Content idea</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "20px 14px", fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
                No keywords match this filter — try a different intent or clear the filter.
              </div>
            ) : filtered.map((kw, i) => {
              const intent = INTENT[kw.intent] || INTENT.informational;
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "3fr 80px 110px 120px 1fr 110px",
                  padding: "10px 14px", gap: 8,
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{kw.keyword}</div>

                  <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 600 }}>
                    {(kw.vol || 0).toLocaleString()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: (kw.diff || 0) + "%", background: diffColor(kw.diff), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: diffColor(kw.diff), fontWeight: 600, minWidth: 24 }}>
                        {kw.diff}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: diffColor(kw.diff), marginTop: 2 }}>{diffLabel(kw.diff)}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: intent.bg, color: intent.color }}>
                      {intent.label}
                    </span>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{intent.tip}</div>
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                    {kw.contentIdea}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      className="btn"
                      style={{ fontSize: 10, padding: "3px 8px", color: isSaved(kw.keyword) ? "#22c55e" : "var(--text2)" }}
                      onClick={() => isSaved(kw.keyword) ? removeSavedKeyword(kw.keyword) : saveKeywordIdea(kw)}
                    >
                      {isSaved(kw.keyword) ? "Saved" : "Save"}
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 10, padding: "3px 8px", color: isInConfig(kw.keyword) ? "#22c55e" : "var(--text2)" }}
                      onClick={() => addKeyword(kw.keyword)}
                    >
                      {isInConfig(kw.keyword) ? "In radar" : "Add to radar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Saved keywords */}
      {savedKeywords.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Saved content ideas ({savedKeywords.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {savedKeywords.map(kw => {
              const intent = INTENT[kw.intent] || INTENT.informational;
              return (
                <div key={kw.keyword} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{kw.keyword}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{kw.contentIdea}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: intent.bg, color: intent.color, fontWeight: 600 }}>
                    {intent.label}
                  </span>
                  <span style={{ fontSize: 11, color: diffColor(kw.diff), fontWeight: 600 }}>Diff: {kw.diff}</span>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>{(kw.vol || 0).toLocaleString()} vol</span>
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: "3px 8px" }}
                    onClick={() => removeSavedKeyword(kw.keyword)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14 }}>Enter any topic and click Find keywords</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Or click one of your scraper keywords above to get started</div>
        </div>
      )}
    </div>
  );
}
