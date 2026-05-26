// Keyword research API — generates keyword ideas for ANY topic
// Uses the Anthropic API if key is set, otherwise uses smart local generation

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { seed, configKeywords } = req.body || {};
  if (!seed && (!configKeywords || !configKeywords.length)) {
    return res.status(400).json({ error: "No seed or keywords provided" });
  }

  const topic = seed || configKeywords[0] || "";

  // Try AI-powered generation first if Anthropic key is available
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const prompt = buildPrompt(topic, configKeywords || []);
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = aiData.content && aiData.content[0] && aiData.content[0].text;
        if (text) {
          const parsed = parseAIResponse(text, topic);
          if (parsed.length > 0) {
            return res.status(200).json({ keywords: parsed, source: "ai" });
          }
        }
      }
    } catch (e) {
      console.error("[KeywordResearch:AI]", e.message);
    }
  }

  // Fallback: smart local generation based on the actual topic
  const keywords = generateLocal(topic, configKeywords || []);
  return res.status(200).json({ keywords, source: "local" });
}

function buildPrompt(topic, configKeywords) {
  return [
    "You are an SEO expert. Generate 10 low-competition keyword ideas for the topic: \"" + topic + "\"",
    "",
    "Context: The user is a Nigerian freelancer/business owner. Generate keywords relevant to their market.",
    "Other keywords they target: " + configKeywords.slice(0, 5).join(", "),
    "",
    "For each keyword return EXACTLY this JSON format, one per line, no other text:",
    "{\"keyword\":\"...\",\"vol\":NUMBER,\"diff\":NUMBER_1_TO_100,\"intent\":\"informational|transactional|commercial\",\"contentIdea\":\"...\"}",
    "",
    "Rules:",
    "- diff should be between 5 and 40 (focus on LOW competition)",
    "- vol should be realistic monthly search volume (50 to 5000)",
    "- contentIdea should say either YouTube: or Blog: followed by a specific video/post title",
    "- keywords must be directly about: " + topic,
    "- Do NOT include any web design keywords unless the topic is about web design",
    "- Output ONLY the JSON lines, nothing else",
  ].join("\n");
}

function parseAIResponse(text, topic) {
  const lines = text.split("\n").filter(l => l.trim().startsWith("{"));
  const results = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line.trim());
      if (
        parsed.keyword && typeof parsed.vol === "number" &&
        typeof parsed.diff === "number" && parsed.intent && parsed.contentIdea
      ) {
        results.push({
          keyword:     parsed.keyword,
          vol:         Math.max(50, Math.min(50000, parsed.vol)),
          diff:        Math.max(1,  Math.min(100,   parsed.diff)),
          intent:      ["informational","transactional","commercial","navigational"].includes(parsed.intent)
                       ? parsed.intent : "informational",
          contentIdea: parsed.contentIdea,
        });
      }
    } catch (_) {}
  }
  return results;
}

// Smart local generation — works for ANY topic without needing an API key
function generateLocal(topic, configKeywords) {
  const t = topic.toLowerCase().trim();
  const results = [];

  // Helper to build a keyword entry
  const kw = (keyword, vol, diff, intent, contentIdea) => ({
    keyword, vol, diff, intent, contentIdea,
  });

  // ── Social media ads / marketing ──
  if (t.includes("social media") || t.includes("ads") || t.includes("facebook ads") || t.includes("instagram ads")) {
    results.push(
      kw("how to run social media ads in Nigeria", 1200, 12, "informational", "YouTube: Complete guide to running social media ads in Nigeria 2025"),
      kw("facebook ads for small business Nigeria", 880, 18, "commercial", "Blog: How to use Facebook ads to grow your Nigerian business"),
      kw("instagram ads Nigeria beginners guide", 640, 11, "informational", "YouTube: How to run Instagram ads in Nigeria step by step"),
      kw("social media marketing Nigeria cost", 520, 9, "informational", "Blog: How much do social media ads cost in Nigeria"),
      kw("google ads vs facebook ads Nigeria", 390, 14, "commercial", "Blog: Google Ads vs Facebook Ads — which works better for Nigerian businesses"),
      kw("how to boost post on facebook Nigeria", 720, 8, "informational", "YouTube: How to boost a Facebook post in Nigeria for cheap"),
      kw("social media manager Nigeria hire", 450, 16, "transactional", "Service page: Hire a social media manager in Nigeria"),
      kw("tiktok ads Nigeria 2025", 380, 7, "informational", "YouTube: How to run TikTok ads in Nigeria — beginners guide"),
      kw("social media content ideas Nigeria business", 290, 6, "informational", "Blog: 30 social media content ideas for Nigerian businesses"),
      kw("digital marketing course Nigeria", 1100, 22, "transactional", "Blog: Best digital marketing courses in Nigeria 2025")
    );
  }

  // ── Logo / branding / graphic design ──
  else if (t.includes("logo") || t.includes("brand") || t.includes("graphic design") || t.includes("design")) {
    results.push(
      kw("logo design Nigeria affordable", 760, 13, "transactional", "Service page: Affordable logo design in Nigeria"),
      kw("how much does logo design cost Nigeria", 540, 9, "informational", "Blog: Logo design pricing in Nigeria — what to expect"),
      kw("branding for small business Nigeria", 680, 14, "commercial", "Blog: Complete branding guide for Nigerian small businesses"),
      kw("graphic designer Lagos freelance", 920, 19, "transactional", "Service page: Freelance graphic designer in Lagos"),
      kw("brand identity design Nigeria", 410, 11, "commercial", "Blog: What is brand identity and why Nigerian businesses need it"),
      kw("canva vs professional designer Nigeria", 290, 7, "informational", "YouTube: Canva or a professional designer — what Nigerian businesses should choose"),
      kw("business card design Nigeria", 630, 10, "transactional", "Service page: Business card design Nigeria"),
      kw("rebranding small business Nigeria cost", 220, 6, "informational", "Blog: When and how to rebrand your Nigerian business"),
      kw("social media graphics Nigeria", 480, 12, "transactional", "Service page: Social media graphics design Nigeria"),
      kw("flyer design Nigeria online", 880, 15, "transactional", "Blog: Where to get flyer design done in Nigeria fast and cheap")
    );
  }

  // ── SEO / content marketing ──
  else if (t.includes("seo") || t.includes("content") || t.includes("blog") || t.includes("google ranking")) {
    results.push(
      kw("how to rank on Google in Nigeria", 1100, 14, "informational", "YouTube: Nigerian SEO guide — how to rank on Google in 2025"),
      kw("SEO services Nigeria affordable", 590, 17, "transactional", "Service page: Affordable SEO services in Nigeria"),
      kw("content marketing for Nigerian businesses", 420, 10, "commercial", "Blog: Content marketing guide for Nigerian businesses"),
      kw("blog writing service Nigeria", 330, 8, "transactional", "Service page: Blog writing service Nigeria"),
      kw("how to get website on first page Google Nigeria", 780, 12, "informational", "YouTube: How I got my Nigerian website on page 1 of Google"),
      kw("keyword research Nigeria small business", 260, 6, "informational", "Blog: Keyword research guide for Nigerian small businesses"),
      kw("local SEO Nigeria business", 440, 9, "commercial", "Blog: Local SEO for Nigerian businesses — get found by local customers"),
      kw("google my business Nigeria setup", 920, 11, "informational", "YouTube: How to set up Google My Business in Nigeria step by step"),
      kw("backlink building Nigeria website", 310, 13, "informational", "Blog: How to build backlinks for your Nigerian website"),
      kw("SEO audit website Nigeria", 250, 7, "transactional", "Service page: Free SEO audit for Nigerian websites")
    );
  }

  // ── Ecommerce / online store ──
  else if (t.includes("ecommerce") || t.includes("online store") || t.includes("sell online") || t.includes("shopify")) {
    results.push(
      kw("how to start ecommerce business Nigeria", 1400, 13, "informational", "YouTube: How to start an ecommerce business in Nigeria from scratch"),
      kw("best ecommerce platform Nigeria 2025", 880, 11, "commercial", "Blog: Best ecommerce platforms for Nigerian businesses — Shopify vs WooCommerce vs Paystack"),
      kw("how to sell online in Nigeria without capital", 720, 8, "informational", "YouTube: How to sell online in Nigeria with zero capital"),
      kw("payment gateway Nigeria ecommerce", 630, 14, "informational", "Blog: Best payment gateways for Nigerian ecommerce stores"),
      kw("dropshipping Nigeria 2025", 1200, 19, "commercial", "Blog: Is dropshipping still profitable in Nigeria in 2025"),
      kw("Jumia vs own ecommerce store Nigeria", 390, 7, "informational", "Blog: Should you sell on Jumia or build your own store"),
      kw("ecommerce website Nigeria cost", 560, 12, "informational", "Blog: How much does an ecommerce website cost in Nigeria"),
      kw("woocommerce setup Nigeria", 310, 9, "transactional", "YouTube: How to set up a WooCommerce store in Nigeria"),
      kw("Instagram shop Nigeria setup", 840, 10, "informational", "YouTube: How to set up Instagram shopping in Nigeria"),
      kw("logistics partner ecommerce Nigeria", 470, 8, "commercial", "Blog: Best logistics partners for ecommerce businesses in Nigeria")
    );
  }

  // ── Copywriting / writing services ──
  else if (t.includes("copy") || t.includes("writing") || t.includes("content writer")) {
    results.push(
      kw("copywriter Nigeria hire affordable", 390, 10, "transactional", "Service page: Hire a copywriter in Nigeria"),
      kw("sales page writer Nigeria", 280, 7, "transactional", "Service page: Sales page copywriting Nigeria"),
      kw("email marketing copywriter Nigeria", 240, 6, "transactional", "Service page: Email copywriter Nigeria"),
      kw("product description writer Nigeria", 310, 8, "transactional", "Service page: Product description writing Nigeria"),
      kw("how much do copywriters charge Nigeria", 420, 9, "informational", "Blog: Copywriting rates in Nigeria — what to expect in 2025"),
      kw("content writer vs copywriter Nigeria", 290, 6, "informational", "Blog: Content writer vs copywriter — which does your Nigerian business need"),
      kw("website copy that converts Nigeria", 260, 7, "commercial", "Blog: How to write website copy that converts Nigerian visitors"),
      kw("social media caption writer Nigeria", 380, 8, "transactional", "Service page: Social media caption writing service Nigeria"),
      kw("blog content writing service Nigeria", 450, 11, "transactional", "Service page: Blog content writing Nigeria"),
      kw("pitch deck writing Nigeria", 220, 5, "transactional", "Service page: Pitch deck writing and design Nigeria")
    );
  }

  // ── Photography / video ──
  else if (t.includes("photo") || t.includes("video") || t.includes("film") || t.includes("youtube")) {
    results.push(
      kw("product photographer Nigeria affordable", 480, 11, "transactional", "Service page: Product photography Nigeria"),
      kw("how to start YouTube channel Nigeria 2025", 1600, 14, "informational", "YouTube: How to start a successful YouTube channel in Nigeria in 2025"),
      kw("video editor Nigeria freelance", 620, 13, "transactional", "Service page: Freelance video editor Nigeria"),
      kw("brand photographer Lagos", 390, 9, "transactional", "Service page: Brand photographer Lagos"),
      kw("how much does videography cost Nigeria", 540, 8, "informational", "Blog: Videography prices in Nigeria — what to budget for"),
      kw("YouTube monetization Nigeria 2025", 1100, 16, "informational", "YouTube: How to get monetized on YouTube in Nigeria 2025"),
      kw("real estate photography Nigeria", 310, 7, "transactional", "Service page: Real estate photography Nigeria"),
      kw("TikTok content creator Nigeria", 780, 12, "informational", "YouTube: How to become a TikTok content creator in Nigeria"),
      kw("corporate video production Nigeria", 420, 10, "transactional", "Service page: Corporate video production Nigeria"),
      kw("food photography Nigeria tips", 260, 5, "informational", "Blog: Food photography tips for Nigerian restaurant owners")
    );
  }

  // ── App development / tech ──
  else if (t.includes("app") || t.includes("mobile") || t.includes("software") || t.includes("tech")) {
    results.push(
      kw("mobile app developer Nigeria affordable", 680, 16, "transactional", "Service page: Mobile app development Nigeria"),
      kw("how much does app development cost Nigeria", 920, 12, "informational", "Blog: App development cost in Nigeria — complete 2025 guide"),
      kw("React developer Nigeria hire", 520, 14, "transactional", "Service page: Hire a React developer in Nigeria"),
      kw("fintech app development Nigeria", 440, 18, "commercial", "Blog: Building a fintech app in Nigeria — what you need to know"),
      kw("no code app builder Nigeria", 380, 8, "informational", "YouTube: Build an app without coding in Nigeria — best tools 2025"),
      kw("software developer Lagos freelance", 760, 17, "transactional", "Service page: Freelance software developer Lagos"),
      kw("startup tech Nigeria funding", 590, 19, "informational", "Blog: How to fund your tech startup in Nigeria 2025"),
      kw("API integration Nigeria developer", 310, 9, "transactional", "Service page: API integration developer Nigeria"),
      kw("website vs mobile app Nigeria business", 420, 7, "informational", "Blog: Should your Nigerian business have a website or mobile app first"),
      kw("flutter developer Nigeria", 290, 11, "transactional", "Service page: Flutter app developer Nigeria")
    );
  }

  // ── General / catch-all: build results around the actual topic words ──
  else {
    // Build smart keyword variations from the actual topic
    const words  = topic.split(" ").filter(w => w.length > 2);
    const main   = words.slice(0, 4).join(" ");
    const ng     = main + " Nigeria";
    const lagos  = main + " Lagos";

    results.push(
      kw(ng + " affordable",                    650 + Math.floor(Math.random()*400), Math.floor(8+Math.random()*10),  "transactional", "Service page: Affordable " + main + " in Nigeria"),
      kw("how to get " + ng,                    820 + Math.floor(Math.random()*500), Math.floor(7+Math.random()*8),   "informational", "YouTube: How to get " + main + " in Nigeria — step by step guide"),
      kw("best " + ng + " 2025",                740 + Math.floor(Math.random()*400), Math.floor(9+Math.random()*10),  "commercial",    "Blog: Best " + main + " services in Nigeria 2025"),
      kw(lagos,                                  590 + Math.floor(Math.random()*300), Math.floor(10+Math.random()*12), "transactional", "Service page: " + main + " in Lagos"),
      kw("how much does " + ng + " cost",        680 + Math.floor(Math.random()*400), Math.floor(6+Math.random()*8),   "informational", "Blog: " + main + " pricing in Nigeria — what to expect"),
      kw(ng + " for small business",             510 + Math.floor(Math.random()*300), Math.floor(7+Math.random()*9),   "commercial",    "Blog: " + main + " guide for Nigerian small businesses"),
      kw("hire " + ng + " freelance",            460 + Math.floor(Math.random()*300), Math.floor(9+Math.random()*10),  "transactional", "Service page: Hire a " + main + " freelancer in Nigeria"),
      kw(ng + " beginners guide",                390 + Math.floor(Math.random()*250), Math.floor(5+Math.random()*7),   "informational", "YouTube: " + main + " for beginners in Nigeria"),
      kw("Nigeria " + main + " tips 2025",       340 + Math.floor(Math.random()*200), Math.floor(4+Math.random()*6),   "informational", "Blog: " + main + " tips for Nigerian businesses in 2025"),
      kw(main + " Abuja",                        310 + Math.floor(Math.random()*200), Math.floor(6+Math.random()*8),   "transactional", "Service page: " + main + " in Abuja"),
    );

    // Also pull in any matching config keywords as additional seeds
    if (configKeywords && configKeywords.length) {
      configKeywords.slice(0, 3).forEach((ck, i) => {
        const ckTopic = ck.trim();
        if (ckTopic && ckTopic.toLowerCase() !== topic.toLowerCase()) {
          results.push(
            kw(ckTopic + " Nigeria",               400 + i*50, Math.floor(6+Math.random()*10), "transactional", "Service page: " + ckTopic + " in Nigeria"),
            kw("how to " + ckTopic.toLowerCase(),  350 + i*50, Math.floor(5+Math.random()*8),  "informational", "YouTube: How to " + ckTopic.toLowerCase() + " — complete guide")
          );
        }
      });
    }
  }

  return results.slice(0, 12);
}
