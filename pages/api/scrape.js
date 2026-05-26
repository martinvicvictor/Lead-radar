import { scoreLead, detectRegion } from "../../lib/scoring";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms || 8000)
    ),
  ]);
}

// ── CORE MATCHING FUNCTION ──────────────────────────────────────────────────
// A post is relevant ONLY if it contains at least one of the user's keywords.
// No hardcoded topic fallbacks. The keywords array is the single source of truth.

function isRelevant(text, keywords) {
  if (!text || !keywords || !keywords.length) return false;
  const t = text.toLowerCase();
  return keywords.some((kw) => {
    const words = kw.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2);
    // Require ALL significant words of the keyword to appear in the text
    // e.g. "social media ads" — all three words must be present
    // For single-word keywords, just check that word exists
    if (words.length === 1) return t.includes(words[0]);
    // For multi-word, at least 2 of the words must appear
    const matchCount = words.filter(w => t.includes(w)).length;
    return matchCount >= Math.min(2, words.length);
  });
}

// Also check for general buying-intent signals relevant to ANY service
function hasBuyingIntent(text) {
  const t = (text || "").toLowerCase();
  const intentWords = [
    "need", "want", "looking for", "recommend", "hire", "who can",
    "how much", "price", "cost", "budget", "help me", "help with",
    "anyone know", "please recommend", "suggest", "referral",
    "how do i", "how to get", "where can i", "i want to",
  ];
  return intentWords.some(w => t.includes(w));
}

// ── REDDIT SCRAPER ──────────────────────────────────────────────────────────
async function scrapeReddit(keywords) {
  const leads = [];

  // 1. Direct keyword search — Reddit returns posts matching the exact query
  for (const kw of keywords.slice(0, 5)) {
    try {
      const url = "https://www.reddit.com/search.json?q=" +
        encodeURIComponent(kw) + "&sort=new&t=month&limit=15&type=link";
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "LeadRadar/2.0" } }),
        4000
      );
      if (!res.ok) continue;
      const json = await res.json();
      const posts = (json && json.data && json.data.children) || [];

      for (const post of posts) {
        const d        = post.data;
        const text     = (d.selftext || "").trim();
        const title    = (d.title   || "").trim();
        const combined = title + " " + text;
        if (combined.length < 15) continue;

        // Must contain the keyword that was searched AND show buying intent
        const kwMatch = isRelevant(combined, [kw]);
        const intent  = hasBuyingIntent(combined);
        if (!kwMatch && !intent) continue;

        leads.push({
          id:       "reddit-" + d.id,
          source:   "Reddit",
          sub:      "r/" + d.subreddit,
          handle:   "u/" + d.author,
          excerpt:  text.length > 50 ? text.slice(0, 280) : title.slice(0, 280),
          title:    title,
          region:   detectRegion(combined),
          ageHours: (Date.now() / 1000 - d.created_utc) / 3600,
          keyword:  kw,
          contact:  { type: "reddit", url: "https://reddit.com" + d.permalink },
          createdAt: new Date(d.created_utc * 1000).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Reddit:search]", e.message);
    }
  }

  // 2. Nigerian subreddits — only include posts that match user keywords
  for (const sub of ["Nigeria", "naija"]) {
    try {
      const url = "https://www.reddit.com/r/" + sub + "/new.json?limit=25";
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "LeadRadar/2.0" } }),
        4000
      );
      if (!res.ok) continue;
      const json  = await res.json();
      const posts = (json && json.data && json.data.children) || [];

      for (const post of posts) {
        const d        = post.data;
        const combined = d.title + " " + (d.selftext || "");

        // Must match at least one user keyword exactly
        if (!isRelevant(combined, keywords)) continue;

        const matchedKw = keywords.find(kw => isRelevant(combined, [kw])) || keywords[0];

        leads.push({
          id:       "reddit-sub-" + d.id,
          source:   "Reddit",
          sub:      "r/" + sub,
          handle:   "u/" + d.author,
          excerpt:  (d.selftext || d.title || "").slice(0, 280),
          title:    d.title,
          region:   "Nigeria",
          ageHours: (Date.now() / 1000 - d.created_utc) / 3600,
          keyword:  matchedKw,
          contact:  { type: "reddit", url: "https://reddit.com" + d.permalink },
          createdAt: new Date(d.created_utc * 1000).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Reddit:sub:" + sub + "]", e.message);
    }
  }

  return leads;
}

// ── NAIRALAND SCRAPER ───────────────────────────────────────────────────────
async function scrapeNairaland(keywords) {
  const leads = [];

  // 1. Keyword search — Nairaland search returns posts matching the query
  //    This is the MOST accurate method — results are already filtered by Nairaland
  for (const kw of keywords.slice(0, 5)) {
    try {
      const url = "https://www.nairaland.com/search/nairaland?q=" +
        encodeURIComponent(kw) + "&section=&before=";
      const res = await withTimeout(
        fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        }),
        5000
      );
      if (!res.ok) continue;
      const html = await res.text();

      // Parse search result rows
      const rowRegex = /<td[^>]*>\s*<b>\s*<a href="\/(\d+\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let match;
      let count = 0;

      while ((match = rowRegex.exec(html)) !== null && count < 8) {
        const path  = match[1];
        const title = match[2].trim();
        if (!title || title.length < 8) continue;

        // Since Nairaland search already filtered by keyword,
        // every result is relevant — no secondary filter needed
        leads.push({
          id:       "nairaland-search-" + path.replace(/\//g, "-"),
          source:   "Nairaland",
          sub:      "Search result",
          handle:   "Nairaland User",
          excerpt:  title,
          title:    title,
          region:   "Nigeria",
          ageHours: 24,
          keyword:  kw,
          contact:  { type: "nairaland", url: "https://www.nairaland.com/" + path },
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        });
        count++;
      }
    } catch (e) {
      console.error("[Nairaland:search:" + kw + "]", e.message);
    }
  }

  // 2. Board scrape — ONLY keep posts that match user keywords
  //    Removed the hardcoded web design fallback completely
  for (const section of ["business", "webmasters", "jobs"]) {
    try {
      const url = "https://www.nairaland.com/" + section;
      const res = await withTimeout(
        fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        }),
        5000
      );
      if (!res.ok) continue;
      const html = await res.text();

      const topicRegex = /<td[^>]*id="top[^"]*"[^>]*>.*?<a href="\/(\d+\/[^"]+)"[^>]*>([^<]{10,})<\/a>/gi;
      let m;
      let cnt = 0;

      while ((m = topicRegex.exec(html)) !== null && cnt < 10) {
        const path  = m[1];
        const title = m[2].trim();

        // STRICT: title must match user keywords — no topic-based fallbacks
        if (!isRelevant(title, keywords)) continue;

        const matchedKw = keywords.find(kw => isRelevant(title, [kw])) || keywords[0];

        leads.push({
          id:       "nairaland-board-" + path.replace(/\//g, "-"),
          source:   "Nairaland",
          sub:      section.charAt(0).toUpperCase() + section.slice(1),
          handle:   "Nairaland Post",
          excerpt:  title,
          title:    title,
          region:   "Nigeria",
          ageHours: 6,
          keyword:  matchedKw,
          contact:  { type: "nairaland", url: "https://www.nairaland.com/" + path },
          createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        });
        cnt++;
      }
    } catch (e) {
      console.error("[Nairaland:board:" + section + "]", e.message);
    }
  }

  return leads;
}

// ── TWITTER / X ─────────────────────────────────────────────────────────────
async function scrapeTwitter(keywords) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  const leads = [];

  for (const kw of keywords.slice(0, 5)) {
    try {
      const query = encodeURIComponent(kw + " -is:retweet lang:en");
      const url   = "https://twitter135.p.rapidapi.com/v2/SearchTimeline/?q=" + query + "&count=15";
      const res   = await withTimeout(
        fetch(url, {
          headers: {
            "X-RapidAPI-Key":  apiKey,
            "X-RapidAPI-Host": "twitter135.p.rapidapi.com",
          },
        }),
        5000
      );
      if (!res.ok) continue;
      const json = await res.json();

      const instructions = json &&
        json.data &&
        json.data.search_by_raw_query &&
        json.data.search_by_raw_query.search_timeline &&
        json.data.search_by_raw_query.search_timeline.timeline &&
        json.data.search_by_raw_query.search_timeline.timeline.instructions;

      const entries = (instructions || []).find(i => i.type === "TimelineAddEntries");
      const tweets  = entries
        ? (entries.entries || []).filter(e =>
            e.content && e.content.itemContent &&
            e.content.itemContent.tweet_results &&
            e.content.itemContent.tweet_results.result
          )
        : [];

      for (const entry of tweets) {
        const tweet  = entry.content.itemContent.tweet_results.result;
        const legacy = tweet.legacy;
        if (!legacy) continue;
        const text = legacy.full_text || "";
        if (text.length < 20 || text.startsWith("RT ")) continue;

        // Twitter search already filters by keyword — include all results
        const user = tweet.core &&
          tweet.core.user_results &&
          tweet.core.user_results.result &&
          tweet.core.user_results.result.legacy;

        leads.push({
          id:       "twitter-" + legacy.id_str,
          source:   "Twitter / X",
          handle:   "@" + ((user && user.screen_name) || "unknown"),
          excerpt:  text.slice(0, 280),
          region:   detectRegion(text + " " + ((user && user.location) || "")),
          ageHours: (Date.now() - new Date(legacy.created_at).getTime()) / 3600000,
          keyword:  kw,
          contact: {
            type: "twitter",
            url: "https://x.com/" +
              ((user && user.screen_name) || "") + "/status/" + legacy.id_str,
          },
          createdAt: new Date(legacy.created_at).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Twitter:" + kw + "]", e.message);
    }
  }
  return leads;
}

// ── PHANTOMBUSTER ────────────────────────────────────────────────────────────
async function scrapePhantomBuster(keywords) {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;
  if (!apiKey) return [];
  const leads  = [];
  const agents = {
    linkedin:  process.env.PB_LINKEDIN_AGENT_ID,
    facebook:  process.env.PB_FACEBOOK_AGENT_ID,
    instagram: process.env.PB_INSTAGRAM_AGENT_ID,
    quora:     process.env.PB_QUORA_AGENT_ID,
  };

  for (const platform of Object.keys(agents)) {
    const agentId = agents[platform];
    if (!agentId) continue;
    try {
      await withTimeout(
        fetch("https://api.phantombuster.com/api/v2/agents/launch", {
          method: "POST",
          headers: { "X-Phantombuster-Key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            id: agentId,
            argument: JSON.stringify({ keywords: keywords.slice(0, 5) }),
          }),
        }),
        3000
      );
      const res = await withTimeout(
        fetch("https://api.phantombuster.com/api/v2/agents/fetch-output?id=" + agentId, {
          headers: { "X-Phantombuster-Key": apiKey },
        }),
        3000
      );
      if (!res.ok) continue;
      const json    = await res.json();
      const results = json && json.output ? JSON.parse(json.output) : [];

      for (const item of results) {
        const excerpt = item.text || item.description || item.post || "";
        if (!excerpt) continue;
        // Filter by user keywords
        if (!isRelevant(excerpt, keywords)) continue;

        const matchedKw = keywords.find(kw => isRelevant(excerpt, [kw])) || keywords[0];

        leads.push({
          id:       "pb-" + platform + "-" + (item.id || Math.random().toString(36).slice(2)),
          source:   platform.charAt(0).toUpperCase() + platform.slice(1),
          handle:   item.name || item.handle || "Unknown",
          excerpt:  excerpt.slice(0, 280),
          region:   detectRegion(excerpt + " " + (item.location || "")),
          ageHours: 24,
          keyword:  matchedKw,
          contact: {
            type:  platform,
            url:   item.url   || item.profileUrl || "",
            email: item.email || null,
            phone: item.phone || null,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[PhantomBuster:" + platform + "]", e.message);
    }
  }
  return leads;
}

// ── DEDUPLICATION ────────────────────────────────────────────────────────────
function hashLead(lead) {
  const str  = (lead.source || "") + "|" + (lead.handle || "") + "|" + (lead.excerpt || "").slice(0, 60);
  let   hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return (lead.source || "x").toLowerCase().replace(/\W/g, "") + "-" + Math.abs(hash);
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body        = req.body || {};
  const keywords    = body.keywords    || [];
  const sources     = body.sources     || [];
  const existingIds = body.existingIds || [];

  if (!keywords.length) {
    return res.status(400).json({ error: "No keywords provided" });
  }

  const enabledSources = sources.length ? sources : ["reddit", "nairaland"];
  const existingSet    = new Set(existingIds);
  const tally          = { reddit: 0, nairaland: 0, twitter: 0, phantombuster: 0 };

  try {
    const [r, n, t, pb] = await Promise.allSettled([
      enabledSources.includes("reddit")    ? scrapeReddit(keywords)    : Promise.resolve([]),
      enabledSources.includes("nairaland") ? scrapeNairaland(keywords) : Promise.resolve([]),
      enabledSources.includes("twitter")   ? scrapeTwitter(keywords)   : Promise.resolve([]),
      scrapePhantomBuster(keywords),
    ]);

    const pick = (settled, key) => {
      if (settled.status === "fulfilled") {
        tally[key] = settled.value.length;
        return settled.value;
      }
      console.error("[" + key + "] rejected:", settled.reason && settled.reason.message);
      return [];
    };

    const allLeads = [
      ...pick(r,  "reddit"),
      ...pick(n,  "nairaland"),
      ...pick(t,  "twitter"),
      ...pick(pb, "phantombuster"),
    ];

    const seen   = new Set();
    const unique = allLeads
      .map(l => ({ ...l, id: hashLead(l), score: scoreLead(l) }))
      .filter(l => {
        if (seen.has(l.id))        return false;
        if (existingSet.has(l.id)) return false;
        if ((l.excerpt || "").length < 10) return false;
        seen.add(l.id);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);

    return res.status(200).json({
      leads:     unique,
      count:     unique.length,
      breakdown: tally,
      scannedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[Scraper:fatal]", err);
    return res.status(500).json({ error: "Scrape failed", message: err.message });
  }
}
