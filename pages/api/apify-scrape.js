// Apify scraper — Facebook, LinkedIn, Instagram, Quora, TikTok, Google Maps
// Needs APIFY_API_TOKEN in Vercel Environment Variables

const APIFY_ACTORS = {
  facebook:         "apify/facebook-groups-scraper",
  linkedin:         "apimaestro/linkedin-profile-scraper",
  instagram:        "apify/instagram-hashtag-scraper",
  quora:            "tri_angle/quora-scraper",
  gmaps:            "apify/google-maps-scraper",
  tiktok_comments:  "clockworks/tiktok-comments-scraper",
  tiktok_hashtag:   "clockworks/tiktok-hashtag-scraper",
};

function detectRegion(text) {
  const t = (text || "").toLowerCase();
  const ng = ["nigeria", "lagos", "abuja", "port harcourt", "kano", "enugu", "naira", "nairaland"];
  return ng.some(w => t.includes(w)) ? "Nigeria" : "International";
}

function buildInput(platform, keywords, location) {
  const query = keywords.slice(0, 3).join(" OR ");
  switch (platform) {
    case "facebook":
      return { searchQuery: query, maxPosts: 20 };
    case "linkedin":
      return { searchQuery: query, location: location, maxResults: 20 };
    case "instagram":
      return { hashtags: keywords.map(k => k.replace(/\s+/g, "")), resultsLimit: 20 };
    case "quora":
      return { query: query, maxResults: 20 };
    case "gmaps":
      // location is now passed in from config — works for any city or country
      return { searchStringsArray: [query + (location ? " " + location : "")], maxCrawledPlaces: 20 };
    case "tiktok_comments":
      // Search for videos in the niche then grab comments asking for services
      return { hashtags: keywords.map(k => k.replace(/\s+/g, "")), maxComments: 50, maxVideos: 5 };
    case "tiktok_hashtag":
      return { hashtags: keywords.map(k => k.replace(/\s+/g, "")), resultsLimit: 30 };
    default:
      return { query };
  }
}

function normaliseItem(item, platform, keywords) {
  // Each Apify actor returns slightly different field names — normalise all
  const text =
    item.text || item.commentText || item.description ||
    item.post || item.snippet || item.title ||
    item.caption || item.content || "";

  const handle =
    item.name || item.profileName || item.username ||
    item.author || item.authorMeta && item.authorMeta.name ||
    item.ownerUsername || "Unknown";

  const url =
    item.url || item.profileUrl || item.link ||
    item.authorMeta && item.authorMeta.profileUrl ||
    item.webUrl || "";

  const location =
    item.location || item.country ||
    item.city || item.state || "";

  return {
    handle,
    excerpt: text.slice(0, 280),
    region:  detectRegion(location + " " + text),
    url,
    email:   item.email || null,
    phone:   item.phone || null,
  };
}

async function runApifyActor(actorId, input, apiToken) {
  // Start the run
  const startRes = await fetch(
    "https://api.apify.com/v2/acts/" + actorId + "/runs?token=" + apiToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    }
  );
  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}));
    throw new Error("Apify launch error: " + (err.error && err.error.message ? err.error.message : startRes.status));
  }
  const startData = await startRes.json();
  const runId = startData && startData.data && startData.data.id;
  if (!runId) throw new Error("No run ID from Apify");

  // Poll up to 25 seconds
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes  = await fetch("https://api.apify.com/v2/acts/" + actorId + "/runs/" + runId + "?token=" + apiToken);
    const statusData = await statusRes.json();
    const status     = statusData && statusData.data && statusData.data.status;
    if (status === "SUCCEEDED") {
      const datasetId = statusData.data.defaultDatasetId;
      const itemsRes  = await fetch("https://api.apify.com/v2/datasets/" + datasetId + "/items?token=" + apiToken + "&limit=30");
      return await itemsRes.json();
    }
    if (status === "FAILED" || status === "ABORTED") return [];
  }
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) return res.status(200).json({ leads: [], message: "APIFY_API_TOKEN not configured" });

  const { platform, keywords, location } = req.body || {};
  if (!platform || !APIFY_ACTORS[platform]) {
    return res.status(400).json({ error: "Invalid platform. Valid: " + Object.keys(APIFY_ACTORS).join(", ") });
  }

  const actorId = APIFY_ACTORS[platform];
  const input   = buildInput(platform, keywords || [], location || "");

  try {
    const results = await runApifyActor(actorId, input, apiToken);
    const raw     = Array.isArray(results) ? results : [];

    const leads = raw
      .map((item, idx) => {
        const n = normaliseItem(item, platform, keywords);
        if (!n.excerpt || n.excerpt.length < 10) return null;
        return {
          id:      "apify-" + platform + "-" + idx + "-" + Date.now(),
          source:  platform === "tiktok_comments" ? "TikTok" :
                   platform === "tiktok_hashtag"  ? "TikTok" :
                   platform === "gmaps"            ? "Google Maps" :
                   platform.charAt(0).toUpperCase() + platform.slice(1),
          handle:  n.handle,
          excerpt: n.excerpt,
          region:  n.region,
          ageHours: 12,
          keyword: (keywords || [])[0] || "",
          contact: { type: platform, url: n.url, email: n.email, phone: n.phone },
          createdAt: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return res.status(200).json({ leads, count: leads.length, platform });
  } catch (err) {
    console.error("[Apify:" + platform + "]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
