// AI Pitch Generator — supports Claude (Anthropic) and ChatGPT (OpenAI)
// Both are dormant until API key is added in Vercel Environment Variables

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lead, template, writingStyle, aiProvider, userInfo } = req.body || {};

  if (!lead) {
    return res.status(400).json({ error: "No lead provided" });
  }

  const prompt = buildPrompt(lead, template, writingStyle, userInfo);

  try {
    let pitch = "";

    if (aiProvider === "openai") {
      pitch = await generateWithOpenAI(prompt);
    } else {
      // Default to Claude
      pitch = await generateWithClaude(prompt);
    }

    return res.status(200).json({ pitch });
  } catch (err) {
    console.error("[AI Pitch]", err.message);
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt(lead, template, writingStyle, userInfo) {
  return [
    "You are writing a short outreach message on behalf of a web designer.",
    "",
    "ABOUT THE SENDER:",
    "Name: " + (userInfo.name || "Ike"),
    "Business: " + (userInfo.business || "martinvic.com.ng"),
    "Service: " + (userInfo.service || "Professional website design"),
    "Offering: " + (userInfo.offering || "Websites from 50,000 naira with installment payment for Nigerian clients, from $75 for international clients"),
    "WhatsApp: " + (userInfo.waNumber || ""),
    "",
    "THE LEAD:",
    "Platform: " + (lead.source || ""),
    "Handle: " + (lead.handle || ""),
    "Region: " + (lead.region || ""),
    "What they posted: " + (lead.excerpt || ""),
    "",
    writingStyle
      ? "WRITING STYLE — match this tone exactly, this is how the sender normally writes:\n" + writingStyle
      : "Write in a warm, professional but conversational Nigerian tone. Not too formal. Friendly and direct.",
    "",
    "TEMPLATE TO FOLLOW:\n" + (template || ""),
    "",
    "INSTRUCTIONS:",
    "- Write ONE outreach message of 80 to 150 words maximum",
    "- Sound exactly like the sender wrote it themselves — not like AI",
    "- Reference what the lead actually said in their post",
    "- Include a clear single call to action at the end",
    "- Do NOT use buzzwords like synergy, leverage, or paradigm",
    "- Do NOT start with I or Hello — start with something engaging",
    "- Output ONLY the message text, nothing else, no labels, no explanation",
  ].join("\n");
}

async function generateWithClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in Vercel Environment Variables");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error("Claude API error: " + (err.error && err.error.message ? err.error.message : res.status));
  }

  const data = await res.json();
  return (data.content && data.content[0] && data.content[0].text) || "";
}

async function generateWithOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set in Vercel Environment Variables");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        { role: "system", content: "You write short, human-sounding outreach messages for a web designer. Never sound like AI." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error("OpenAI API error: " + (err.error && err.error.message ? err.error.message : res.status));
  }

  const data = await res.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
}
