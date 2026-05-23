// Keyword intent categories
export const INTENT = {
  informational: { label: "Informational", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", tip: "Great for blog posts and YouTube videos" },
  commercial:    { label: "Commercial",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", tip: "Good for comparison pages and case studies" },
  transactional: { label: "Transactional", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  tip: "High-converting — landing pages and service pages" },
  navigational:  { label: "Navigational",  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", tip: "Brand awareness searches" },
};

export const KEYWORD_DB = {
  "web design": [
    { keyword: "how to get a website for my small business in Nigeria", vol: 590, diff: 11, intent: "informational", contentIdea: "YouTube: Step by step guide to getting your first business website in Nigeria" },
    { keyword: "affordable website design Nigeria", vol: 880, diff: 14, intent: "transactional", contentIdea: "Blog: Affordable website design in Nigeria — what to expect for 50k to 200k" },
    { keyword: "how much does a website cost in Nigeria 2025", vol: 720, diff: 9, intent: "informational", contentIdea: "YouTube: Nigerian website pricing breakdown — what are you actually paying for" },
    { keyword: "website designer Lagos", vol: 1200, diff: 28, intent: "transactional", contentIdea: "Service landing page optimised for Lagos" },
    { keyword: "cheap website design Abuja", vol: 480, diff: 12, intent: "transactional", contentIdea: "Service landing page optimised for Abuja" },
    { keyword: "should my business have a website Nigeria", vol: 310, diff: 7, intent: "informational", contentIdea: "Blog: 7 reasons every Nigerian business needs a website in 2025" },
    { keyword: "website design Port Harcourt", vol: 390, diff: 10, intent: "transactional", contentIdea: "Service page for Port Harcourt" },
    { keyword: "wordpress designer Nigeria freelance", vol: 520, diff: 18, intent: "transactional", contentIdea: "Portfolio page targeting WordPress clients" },
    { keyword: "ecommerce website Nigeria", vol: 2100, diff: 38, intent: "commercial", contentIdea: "Blog: How to start selling online in Nigeria — ecommerce website guide" },
    { keyword: "why is my website losing customers", vol: 440, diff: 8, intent: "informational", contentIdea: "YouTube: 5 website mistakes killing your Nigerian business" },
  ],
  "freelance web developer": [
    { keyword: "hire freelance web developer Nigeria", vol: 680, diff: 16, intent: "transactional", contentIdea: "Service page: Hire a freelance web developer in Nigeria" },
    { keyword: "remote web developer for small business", vol: 940, diff: 21, intent: "commercial", contentIdea: "Blog: How to hire a remote web developer without getting burned" },
    { keyword: "web developer rates Nigeria", vol: 350, diff: 8, intent: "informational", contentIdea: "Blog: Freelance web developer rates in Nigeria — 2025 guide" },
    { keyword: "best web development agency Lagos", vol: 760, diff: 24, intent: "transactional", contentIdea: "Comparison page: Best web development agencies in Lagos" },
    { keyword: "website maintenance service Nigeria", vol: 290, diff: 6, intent: "commercial", contentIdea: "Service page: Website maintenance packages Nigeria" },
  ],
  "online business Nigeria": [
    { keyword: "how to get clients online as a Nigerian freelancer", vol: 510, diff: 9, intent: "informational", contentIdea: "YouTube: How I get clients online as a Nigerian freelancer" },
    { keyword: "digital marketing for small business Nigeria", vol: 1400, diff: 31, intent: "commercial", contentIdea: "Blog: Digital marketing guide for Nigerian small businesses" },
    { keyword: "how to sell online in Nigeria without a website", vol: 620, diff: 11, intent: "informational", contentIdea: "Blog: Selling online in Nigeria — website vs social media vs marketplace" },
    { keyword: "Nigerian business website examples", vol: 280, diff: 5, intent: "informational", contentIdea: "YouTube: 10 Nigerian business websites done right — case studies" },
    { keyword: "how to rank website on Google Nigeria", vol: 390, diff: 13, intent: "informational", contentIdea: "YouTube: Nigerian SEO guide — rank your business on Google in 2025" },
  ],
  "website redesign": [
    { keyword: "my website is not converting visitors", vol: 820, diff: 14, intent: "informational", contentIdea: "YouTube: Why your website visitors do not contact you — and how to fix it" },
    { keyword: "website redesign cost Nigeria", vol: 310, diff: 7, intent: "transactional", contentIdea: "Blog: How much does a website redesign cost in Nigeria" },
    { keyword: "website not showing on Google Nigeria", vol: 470, diff: 9, intent: "informational", contentIdea: "Blog: Why your Nigerian business website is not showing on Google" },
    { keyword: "improve website speed Nigeria", vol: 250, diff: 6, intent: "informational", contentIdea: "YouTube: Speed up your Nigerian website in 10 minutes" },
    { keyword: "mobile friendly website Nigeria", vol: 580, diff: 12, intent: "commercial", contentIdea: "Blog: Why mobile-first matters for Nigerian business websites" },
  ],
  "default": [
    { keyword: "how to attract clients online Nigeria", vol: 670, diff: 10, intent: "informational", contentIdea: "YouTube: 5 ways to attract clients online as a Nigerian business" },
    { keyword: "web design portfolio Nigeria", vol: 390, diff: 8, intent: "navigational", contentIdea: "Portfolio showcase and case studies page" },
    { keyword: "business website Nigeria 2025", vol: 540, diff: 11, intent: "commercial", contentIdea: "Blog: Everything you need to know about getting a business website in Nigeria 2025" },
    { keyword: "how to make money web design Nigeria", vol: 420, diff: 9, intent: "informational", contentIdea: "YouTube: How I make money as a web designer in Nigeria" },
    { keyword: "landing page design Nigeria", vol: 330, diff: 7, intent: "transactional", contentIdea: "Service page: Landing page design Nigeria" },
  ],
};

export function getKeywords(seed) {
  if (!seed) return KEYWORD_DB["default"];
  const s = seed.toLowerCase();
  for (const [key, data] of Object.entries(KEYWORD_DB)) {
    if (s.includes(key) || key.includes(s)) return data;
  }
  return [
    ...KEYWORD_DB["default"].slice(0, 3),
    ...(KEYWORD_DB["web design"] || []).slice(0, 4),
    ...(KEYWORD_DB["website redesign"] || []).slice(0, 3),
  ];
}

export function diffColor(diff) {
  if (diff <= 15) return "#22c55e";
  if (diff <= 30) return "#f59e0b";
  return "#ef4444";
}

export function diffLabel(diff) {
  if (diff <= 15) return "Low";
  if (diff <= 30) return "Medium";
  return "High";
}
