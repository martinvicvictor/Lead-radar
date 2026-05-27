import { useState } from "react";
import useStore from "../lib/store";

// Pre-set location suggestions
const LOCATIONS = [
  "Victoria Island Lagos",
  "Lekki Lagos",
  "Ikeja Lagos",
  "Abuja FCT",
  "Port Harcourt Rivers",
  "Kano",
  "Ibadan Oyo",
  "Enugu",
  "London UK",
  "Manchester UK",
  "New York USA",
  "Toronto Canada",
  "Accra Ghana",
  "Nairobi Kenya",
];

// Pre-set keyword suggestions
const KEYWORD_SUGGESTIONS = [
  "restaurants",
  "fashion boutiques",
  "salons and spas",
  "hospitals and clinics",
  "event centres",
  "supermarkets",
  "pharmacies",
  "hotels",
  "law firms",
  "real estate agents",
  "schools",
  "logistics companies",
  "mechanic workshops",
  "dental clinics",
  "gyms and fitness",
];

function ratingStars(rating) {
  if (!rating) return "";
  const full = Math.floor(rating);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  return stars + " " + rating.toFixed(1);
}

export default function BusinessFinderPage() {
  const { config } = useStore();

  const [keyword,    setKeyword]    = useState("");
  const [location,   setLocation]   = useState(config.gmapsLocation || "Lagos Nigeria");
  const [limit,      setLimit]      = useState(20);
  const [loading,    setLoading]    = useState(false);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState("");
  const [sourceMsg,  setSourceMsg]  = useState("");
  const [filter,     setFilter]     = useState("all");    // all | no-website | no-phone
  const [sortBy,     setSortBy]     = useState("rating"); // rating | reviews | name
  const [copied,     setCopied]     = useState(false);

  const search = async () => {
    if (!keyword.trim() || !location.trim()) {
      setError("Please enter both a keyword and a location.");
      return;
    }
    setLoading(true);
    setResults(null);
    setError("");
    setSourceMsg("");

    try {
      const res  = await fetch("/api/business-finder", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ keyword, location, limit }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      if (data.message) {
        setError(data.message);
      } else {
        setResults(data.businesses || []);
        setSourceMsg("Found " + (data.count || 0) + " businesses via " + (data.source || "search"));
      }
    } catch (e) {
      setError("Search failed: " + e.message);
    }
    setLoading(false);
  };

  const filtered = (results || [])
    .filter(b => {
      if (filter === "no-website") return !b.hasWebsite;
      if (filter === "no-phone")   return !b.hasPhone;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating")  return (b.rating  || 0) - (a.rating  || 0);
      if (sortBy === "reviews") return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === "name")    return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Business Name", "Phone", "Email", "Website", "Address", "Rating", "Reviews", "Category", "Google Maps"];
    const rows = filtered.map(b => [
      '"' + (b.name     || "").replace(/"/g, "") + '"',
      '"' + (b.phone    || "") + '"',
      '"' + (b.email    || "") + '"',
      '"' + (b.website  || "") + '"',
      '"' + (b.address  || "").replace(/"/g, "") + '"',
      b.rating  || "",
      b.reviews || "",
      '"' + (b.category || "") + '"',
      '"' + (b.gmapsUrl || "") + '"',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "businesses-" + keyword.replace(/\s+/g, "-") + "-" + location.replace(/\s+/g, "-") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy all phones to clipboard
  const copyPhones = () => {
    const phones = filtered.filter(b => b.phone).map(b => b.name + ": " + b.phone).join("\n");
    navigator.clipboard && navigator.clipboard.writeText(phones);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // No-website leads: add to lead radar
  const noWebsiteCount   = (results || []).filter(b => !b.hasWebsite).length;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Business Finder</div>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
          Find businesses by keyword and location — get their name, phone, email, website, and address.
          Use the "No website" filter to instantly spot businesses that need your services.
        </div>
      </div>

      {/* Search form */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "18px", marginBottom: 16,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 80px", gap: 10, marginBottom: 12 }}>
          {/* Keyword */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
              Business type / keyword
            </div>
            <input
              className="input"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="e.g. restaurants, salons, hospitals..."
            />
          </div>

          {/* Location */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
              Location
            </div>
            <input
              className="input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="e.g. Victoria Island Lagos, London..."
            />
          </div>

          {/* Limit */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
              Results
            </div>
            <select className="input" value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
            </select>
          </div>
        </div>

        {/* Keyword quick-pick */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>Quick pick:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {KEYWORD_SUGGESTIONS.map(k => (
              <button key={k} onClick={() => setKeyword(k)} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                border: "1px solid var(--border2)",
                background: keyword === k ? "rgba(99,102,241,0.15)" : "var(--bg3)",
                color: keyword === k ? "var(--accent2)" : "var(--text2)",
                fontFamily: "inherit",
              }}>{k}</button>
            ))}
          </div>
        </div>

        {/* Location quick-pick */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>Common locations:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LOCATIONS.map(l => (
              <button key={l} onClick={() => setLocation(l)} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                border: "1px solid var(--border2)",
                background: location === l ? "rgba(99,102,241,0.15)" : "var(--bg3)",
                color: location === l ? "var(--accent2)" : "var(--text2)",
                fontFamily: "inherit",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={search}
          disabled={loading}
          style={{ fontSize: 13, padding: "9px 24px" }}
        >
          {loading ? "Searching..." : "Find businesses"}
        </button>
      </div>

      {/* API setup notice */}
      {!results && !loading && !error && (
        <div style={{
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 8, padding: "14px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent2)", marginBottom: 6 }}>Setup required to activate</div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8 }}>
            This tool needs one of these API keys in Vercel Environment Variables:<br />
            <strong style={{ color: "var(--text)" }}>Option 1 (recommended):</strong> <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>OUTSCRAPER_API_KEY</code> — sign up at outscraper.com, pay per result (~$0.002 each), free credits included on signup<br />
            <strong style={{ color: "var(--text)" }}>Option 2:</strong> <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>GOOGLE_PLACES_API_KEY</code> — from console.cloud.google.com, $200 free credit per month<br />
            <br />
            Both options return business name, phone, website, address, rating, and category. Outscraper also returns email addresses.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, padding: "12px 14px", marginBottom: 14,
          fontSize: 13, color: "#ef4444", lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Searching for {keyword} in {location}...</div>
          <div style={{ fontSize: 11 }}>This may take 10–20 seconds depending on results</div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Stats + controls */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 10, marginBottom: 14,
          }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>{sourceMsg}</span>
              {noWebsiteCount > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.12)",
                  color: "#ef4444", padding: "2px 10px", borderRadius: 20,
                }}>
                  {noWebsiteCount} have no website — potential leads
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={exportCSV} style={{ fontSize: 12 }}>Download CSV</button>
              <button className="btn" onClick={copyPhones} style={{ fontSize: 12, color: copied ? "#22c55e" : "var(--text2)" }}>
                {copied ? "Copied!" : "Copy phones"}
              </button>
            </div>
          </div>

          {/* Filter + sort */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
              {[["all","All"], ["no-website","No website"], ["no-phone","No phone"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  border: "none", fontFamily: "inherit",
                  fontWeight: filter === v ? 600 : 400,
                  background: filter === v ? "var(--bg3)" : "transparent",
                  color: filter === v ? "var(--text)" : "var(--text2)",
                }}>{l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
              {[["rating","Top rated"], ["reviews","Most reviewed"], ["name","A-Z"]].map(([v, l]) => (
                <button key={v} onClick={() => setSortBy(v)} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  border: "none", fontFamily: "inherit",
                  fontWeight: sortBy === v ? 600 : 400,
                  background: sortBy === v ? "var(--bg3)" : "transparent",
                  color: sortBy === v ? "var(--text)" : "var(--text2)",
                }}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Showing {filtered.length} of {results.length}</span>
          </div>

          {/* Business cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <div>No businesses match this filter</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((b, i) => (
                <div key={i} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "14px 16px",
                  borderLeft: "3px solid " + (!b.hasWebsite ? "#ef4444" : b.rating >= 4 ? "#22c55e" : "var(--border)"),
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{b.name}</span>
                        {!b.hasWebsite && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.12)", color: "#ef4444", padding: "2px 8px", borderRadius: 20 }}>
                            No website
                          </span>
                        )}
                        {b.rating && (
                          <span style={{ fontSize: 11, color: "#f59e0b" }}>
                            {ratingStars(b.rating)}
                            {b.reviews ? <span style={{ color: "var(--text3)", marginLeft: 4 }}>({b.reviews})</span> : ""}
                          </span>
                        )}
                        {b.category && (
                          <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--bg3)", padding: "2px 7px", borderRadius: 20 }}>
                            {b.category}
                          </span>
                        )}
                      </div>
                      {b.address && (
                        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
                          📍 {b.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact details grid */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {b.phone && (
                      <a href={"tel:" + b.phone} style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 12, color: "var(--accent2)", display: "flex", alignItems: "center", gap: 4 }}>
                          📞 {b.phone}
                        </span>
                      </a>
                    )}
                    {b.email && (
                      <a href={"mailto:" + b.email} style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 12, color: "var(--accent2)", display: "flex", alignItems: "center", gap: 4 }}>
                          📧 {b.email}
                        </span>
                      </a>
                    )}
                    {b.website && (
                      <a href={b.website.startsWith("http") ? b.website : "https://" + b.website} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                          🌐 {b.website.replace(/^https?:\/\//, "").slice(0, 30)}
                        </span>
                      </a>
                    )}
                    {!b.website && (
                      <span style={{ fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                        🌐 No website found
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {b.phone && (
                      <a href={"https://wa.me/" + b.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer">
                        <button className="btn btn-success" style={{ fontSize: 11, padding: "4px 10px" }}>
                          WhatsApp
                        </button>
                      </a>
                    )}
                    {b.gmapsUrl && (
                      <a href={b.gmapsUrl} target="_blank" rel="noreferrer">
                        <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }}>
                          View on Maps
                        </button>
                      </a>
                    )}
                    {b.email && (
                      <a href={"mailto:" + b.email} target="_blank" rel="noreferrer">
                        <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }}>
                          Email
                        </button>
                      </a>
                    )}
                    <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => {
                        const text = b.name + "\n" + (b.phone || "") + "\n" + (b.email || "") + "\n" + (b.website || "") + "\n" + (b.address || "");
                        navigator.clipboard && navigator.clipboard.writeText(text.trim());
                      }}>
                      Copy details
                    </button>
                    {!b.hasWebsite && (
                      <span style={{ fontSize: 11, color: "#ef4444", alignSelf: "center", fontWeight: 500 }}>
                        Pitch them a website
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
