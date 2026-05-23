export function detectRegion(text) {
  const t = (text || "").toLowerCase();
  const ngTerms = [
    "nigeria", "nigerian", "lagos", "abuja", "port harcourt",
    "kano", "ibadan", "enugu", "benin city", "kaduna", "naira",
    "nairaland", "naij",
  ];
  if (ngTerms.some((term) => t.includes(term))) return "Nigeria";
  return "International";
}

export function scoreLead(lead) {
  let score = 45;
  const text = ((lead.excerpt || "") + " " + (lead.title || "")).toLowerCase();

  const hotPhrases = [
    "need a website", "want a website", "looking for a web designer",
    "need web developer", "build my website", "redesign my website",
    "website for my business", "no website", "do not have a website",
    "dont have a website", "how much does a website cost", "urgent",
    "asap", "immediately", "this week", "budget", "hire a developer",
    "need someone to build", "i need a designer", "looking for designer",
    "recommend a web", "web developer needed",
  ];
  const warmPhrases = [
    "website", "web design", "online presence", "landing page",
    "ecommerce", "online store", "web developer", "slow website",
    "website broken", "update my site", "website not working",
    "my website", "our website",
  ];
  const weakPhrases = [
    "wondering", "someday", "maybe eventually", "thinking about",
    "in the future", "not sure", "general question",
  ];
  const spamPhrases = [
    "click here", "earn money fast", "work from home", "pyramid",
    "investment opportunity",
  ];

  score += hotPhrases.filter((p) => text.includes(p)).length * 13;
  score += warmPhrases.filter((p) => text.includes(p)).length * 5;
  score -= weakPhrases.filter((p) => text.includes(p)).length * 8;
  score -= spamPhrases.filter((p) => text.includes(p)).length * 20;

  const sourceWeights = {
    reddit: 7, twitter: 6, linkedin: 11, facebook: 8,
    quora: 6, nairaland: 10, google: 9, instagram: 5,
  };
  const src = (lead.source || "").toLowerCase();
  for (const [key, val] of Object.entries(sourceWeights)) {
    if (src.includes(key)) { score += val; break; }
  }

  if (lead.contact && lead.contact.email) score += 12;
  if (lead.contact && lead.contact.phone) score += 10;
  if (lead.contact && lead.contact.url)   score += 4;

  const age = lead.ageHours || 0;
  if (age < 1)        score += 18;
  else if (age < 6)   score += 10;
  else if (age < 24)  score += 4;
  else if (age > 72)  score -= 10;
  else if (age > 168) score -= 20;

  if ((lead.region || "") === "Nigeria") score += 5;

  const len = (lead.excerpt || "").length;
  if (len > 200)      score += 6;
  else if (len > 100) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function heatLevel(score) {
  if (score >= 78) return "hot";
  if (score >= 55) return "warm";
  return "cold";
}

export function heatColor(score) {
  if (score >= 78) return "#ef4444";
  if (score >= 55) return "#f59e0b";
  return "#3b82f6";
}

export function heatLabel(score) {
  if (score >= 78) return "Hot";
  if (score >= 55) return "Warm";
  return "Cold";
}
