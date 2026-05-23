import { scoreLead, detectRegion } from "../../lib/scoring";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms || 8000)
    ),
  ]);
}

async function scrapeReddit(keywords) {
  const leads = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const url = "https://www.reddit.com/search.json?q=" + encodeURIComponent(kw) + "&sort=new&t=week&limit=15";
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "LeadRadar/2.0" } }),
        4000
      );
      if (!res.ok) continue;
      const json = await res.json();
      const posts = (json && json.data && json.data.children) || [];
      for (const post of posts) {
        const d = post.data;
        const text = (d.selftext || "").trim();
        const title = (d.title || "").trim();
        const combined = title + " " + text;
        if (combined.length < 20) continue;
        if (!/need|want|looking|hire|build|design|help|website|developer|designer/i.test(combined)) continue;
        const excerpt = text.length > 50 ? text.slice(0, 280) : title.slice(0, 280);
        leads.push({
          id: "reddit-" + d.id,
          source: "Reddit",
          sub: "r/" + d.subreddit,
          handle: "u/" + d.author,
          excerpt: excerpt,
          title: title,
          region: detectRegion(combined),
          ageHours: (Date.now() / 1000 - d.created_utc) / 3600,
          keyword: kw,
          contact: { type: "reddit", url: "https://reddit.com" + d.permalink },
          createdAt: new Date(d.created_utc * 1000).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Reddit:search]", e.message);
    }
  }
  for (const sub of ["Nigeria", "naija"]) {
    try {
      const url = "https://www.reddit.com/r/" + sub + "/new.json?limit=20";
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "LeadRadar/2.0" } }),
        4000
      );
      if (!res.ok) continue;
      const json = await res.json();
      const posts = (json && json.data && json.data.children) || [];
      for (const post of posts) {
        const d = post.data;
        const combined = d.title + " " + (d.selftext || "");
        const hasKeyword = keywords.some((kw) =>
          combined.toLowerCase().includes(kw.toLowerCase().split(" ")[0])
        );
        if (!hasKeyword) continue;
        leads.push({
          id: "reddit-sub-" + d.id,
          source: "Reddit",
          sub: "r/" + sub,
          handle: "u/" + d.author,
          excerpt: (d.selftext || d.title || "").slice(0, 280),
          title: d.title,
          region: "Nigeria",
          ageHours: (Date.now() / 1000 - d.created_utc) / 3600,
          keyword: keywords[0] || "web design",
          contact: { type: "reddit", url: "https://reddit.com" + d.permalink },
          createdAt: new Date(d.created_utc * 1000).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Reddit:sub]", e.message);
    }
  }
  return leads;
}

async function scrapeNairaland(keywords) {
  const leads = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const url = "https://www.nairaland.com/search/nairaland?q=" + encodeURIComponent(kw);
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }),
        5000
      );
      if (!res.ok) continue;
      const html = await res.text();
      const rowRegex = /<td[^>]*>\s*<b>\s*<a href="\/(\d+\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let match;
      let count = 0;
      while ((match = rowRegex.exec(html)) !== null && count < 5) {
        const path = match[1];
        const title = match[2].trim();
        if (!title || title.length < 10) continue;
        const relevant = keywords.some((k) =>
          title.toLowerCase().includes(k.toLowerCase().split(" ")[0])
        ) || /website|web|designer|developer|design|online/i.test(title);
        if (!relevant) continue;
        leads.push({
          id: "nairaland-" + path.replace(/\//g, "-"),
          source: "Nairaland",
          sub: "Business / Webmasters",
          handle: "Nairaland User",
          excerpt: title,
          title: title,
          region: "Nigeria",
          ageHours: 12,
          keyword: kw,
          contact: { type: "nairaland", url: "https://www.nairaland.com/" + path },
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        });
        count++;
      }
    } catch (e) {
      console.error("[Nairaland:search]", e.message);
    }
  }
  for (const section of ["webmasters", "business"]) {
    try {
      const url = "https://www.nairaland.com/" + section;
      const res = await withTimeout(
        fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }),
        5000
      );
      if (!res.ok) continue;
      const html = await res.text();
      const topicRegex = /<td[^>]*id="top[^"]*"[^>]*>.*?<a href="\/(\d+\/[^"]+)"[^>]*>([^<]{15,})<\/a>/gi;
      let m;
      let cnt = 0;
      while ((m = topicRegex.exec(html)) !== null && cnt < 6) {
        const path = m[1];
        const title = m[2].trim();
        const relevant = keywords.some((kw) =>
          title.toLowerCase().includes(kw.toLowerCase().split(" ")[0])
        ) || /website|web design|developer|online business|ecommerce/i.test(title);
        if (!relevant) continue;
        leads.push({
          id: "nairaland-board-" + path.replace(/\//g, "-"),
          source: "Nairaland",
          sub: section.charAt(0).toUpperCase() + section.slice(1),
          handle: "Nairaland Post",
          excerpt: title,
          title: title,
          region: "Nigeria",
          ageHours: 6,
          keyword: keywords[0] || "web design",
          contact: { type: "nairaland", url: "https://www.nairaland.com/" + path },
          createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        });
        cnt++;
      }
    } catch (e) {
      console.error("[Nairaland:board]", e.message);
    }
  }
  return leads;
}

async function scrapeTwitter(keywords) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  const leads = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const query = encodeURIComponent(kw + " -is:retweet lang:en");
      const url = "https://twitter135.p.rapidapi.com/v2/SearchTimeline/?q=" + query + "&count=10";
      const res = await withTimeout(
        fetch(url, {
          headers: {
            "X-RapidAPI-Key": apiKey,
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
      const entries = (instructions || [])
        .find((i) => i.type === "TimelineAddEntries");
      const tweets = entries ? (entries.entries || []).filter((e) =>
        e.content && e.content.itemContent && e.content.itemContent.tweet_results && e.content.itemContent.tweet_results.result
      ) : [];
      for (const entry of tweets) {
        const tweet  = entry.content.itemContent.tweet_results.result;
        const legacy = tweet.legacy;
        if (!legacy) continue;
        const text = legacy.full_text || "";
        if (text.length < 20 || text.startsWith("RT ")) continue;
        const user = tweet.core && tweet.core.user_results && tweet.core.user_results.result && tweet.core.user_results.result.legacy;
        leads.push({
          id: "twitter-" + legacy.id_str,
          source: "Twitter / X",
          handle: "@" + ((user && user.screen_name) || "unknown"),
          excerpt: text.slice(0, 280),
          region: detectRegion(text + " " + ((user && user.location) || "")),
          ageHours: (Date.now() - new Date(legacy.created_at).getTime()) / 3600000,
          keyword: kw,
          contact: {
            type: "twitter",
            url: "https://x.com/" + ((user && user.screen_name) || "") + "/status/" + legacy.id_str,
          },
          createdAt: new Date(legacy.created_at).toISOString(),
        });
      }
    } catch (e) {
      console.error("[Twitter]", e.message);
    }
  }
  return leads;
}

async function scrapePhantomBuster(keywords) {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;
  if (!apiKey) return [];
  const leads = [];
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
          body: JSON.stringify({ id: agentId, argument: JSON.stringify({ keywords: keywords.slice(0, 3) }) }),
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
      const json = await res.json();
      const results = json && json.output ? JSON.parse(json.output) : [];
      for (const item of results) {
        const excerpt = item.text || item.description || item.post || "";
        if (!excerpt) continue;
        leads.push({
          id: "pb-" + platform + "-" + (item.id || Math.random().toString(36).slice(2)),
          source: platform.charAt(0).toUpperCase() + platform.slice(1),
          handle: item.name || item.handle || "Unknown",
          excerpt: excerpt.slice(0, 280),
          region: detectRegion(excerpt + " " + (item.location || "")),
          ageHours: 24,
          keyword: keywords[0],
          contact: {
            type: platform,
            url: item.url || item.profileUrl || "",
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

function hashLead(lead) {
  const str = (lead.source || "") + "|" + (lead.handle || "") + "|" + (lead.excerpt || "").slice(0, 60);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return (lead.source || "x").toLowerCase().replace(/\W/g, "") + "-" + Math.abs(hash);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body || {};
  const keywords = body.keywords || [];
  const sources  = body.sources  || [];
  const existingIds = body.existingIds || [];

  if (!keywords.length) {
    return res.status(400).json({ error: "No keywords provided" });
  }

  const enabledSources = sources.length ? sources : ["reddit", "nairaland"];
  const existingSet = new Set(existingIds);
  const tally = { reddit: 0, nairaland: 0, twitter: 0, phantombuster: 0 };

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
      return [];
    };

    const allLeads = [
      ...pick(r,  "reddit"),
      ...pick(n,  "nairaland"),
      ...pick(t,  "twitter"),
      ...pick(pb, "phantombuster"),
    ];

    const seen = new Set();
    const unique = allLeads
      .map((l) => ({ ...l, id: hashLead(l), score: scoreLead(l) }))
      .filter((l) => {
        if (seen.has(l.id))        return false;
        if (existingSet.has(l.id)) return false;
        if ((l.excerpt || "").length < 15) return false;
        seen.add(l.id);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return res.status(200).json({
      leads: unique,
      count: unique.length,
      breakdown: tally,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Scraper:fatal]", err);
    return res.status(500).json({ error: "Scrape failed", message: err.message });
  }
}
