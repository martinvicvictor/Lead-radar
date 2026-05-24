// Apify scraper — cheaper alternative to PhantomBuster
// Supports: Facebook Groups, LinkedIn, Instagram, Quora, Google Maps
// Dormant until APIFY_API_TOKEN is set in Vercel Environment Variables

const APIFY_ACTORS = {
  facebook:  "apify/facebook-groups-scraper",
  linkedin:  "apimaestro/linkedin-profile-scraper",
  instagram: "apify/instagram-hashtag-scraper",
  quora:     "tri_angle/quora-scraper",
  gmaps:     "apify/google-maps-scraper",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    return res.status(200).json({ leads: [], message: "APIFY_API_TOKEN not configured" });
  }

  const { platform, keywords, location } = req.body || {};
  if (!platform || !APIFY_ACTORS[platform]) {
    return res.status(400).json({ error: "Invalid platform. Use: facebook, linkedin, instagram, quora, gmaps" });
  }

  const actorId = APIFY_ACTORS[platform];
  const input   = buildInput(platform, keywords || [], location || "Nigeria");

  try {
    // Start the actor run
    const startRes = await fetch(
      "https://api.apify.com/v2/acts/" + actorId + "/runs?token=" + apiToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, options: { maxItems: 20 } }),
      }
    );

    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({}));
      throw new Error("Apify start error: " + (err.error && err.error.message ? err.error.message : startRes.status));
    }

    const startData = await startRes.json();
    const runId = startData && startData.data && startData.data.id;
    if (!runId) throw new Error("No run ID returned from Apify");

    // Poll for completion (max 25 seconds)
    let results = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(
        "https://api.apify.com/v2/acts/" + actorId + "/runs/" + runId + "?token=" + apiToken
      );
      const statusData = await statusRes.json();
      const status = statusData && statusData.data && statusData.data.status;

      if (status === "SUCCEEDED") {
        const datasetId = statusData.data.defaultDatasetId;
        const itemsRes = await fetch(
          "https://api.apify.com/v2/datasets/" + datasetId + "/items?token=" + apiToken + "&limit=20"
        );
        results = await itemsRes.json();
        break;
      }
      if (status === "FAILED" || status === "ABORTED") break;
    }

    // Normalise results into our lead format
    const leads = (Array.isArray(results) ? results : []).map((item, idx) => ({
      id: "apify-" + platform + "-" + idx + "-" + Date.now(),
      source: platform.charAt(0).toUpperCase() + platform.slice(1),
      handle: item.name || item.profileName || item.username || item.author || "Unknown",
      excerpt: (item.text || item.description || item.post || item.snippet || item.title || "").slice(0, 280),
      region: detectRegion((item.location || item.country || "") + " " + (item.text || "")),
      ageHours: 24,
      keyword: (keywords || [])[0] || "",
      contact: {
        type: platform,
        url:   item.url || item.profileUrl || item.link || "",
        email: item.email || null,
        phone: item.phone || null,
      },
      createdAt: new Date().toISOString(),
    })).filter(l => l.excerpt.length > 10);

    return res.status(200).json({ leads, count: leads.length, platform, runId });
  } catch (err) {
    console.error("[Apify:" + platform + "]", err.message);
    return res.status(500).json({ error: err.message });
  }
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
      return { searchStringsArray: [query + " " + location], maxCrawledPlaces: 20 };
    default:
      return { query };
  }
}

function detectRegion(text) {
  const t = (text || "").toLowerCase();
  const ngTerms = ["nigeria", "lagos", "abuja", "port harcourt", "kano", "enugu", "naira"];
  return ngTerms.some(term => t.includes(term)) ? "Nigeria" : "International";
}
