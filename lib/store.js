import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_KEYWORDS = [
  "need a website",
  "web designer Nigeria",
  "redesign my website",
  "website for my business",
  "no website yet",
  "slow website",
  "affordable web design",
  "I need a web developer",
];

export const DEFAULT_SOURCES = [
  { id: "reddit",    label: "Reddit",          enabled: true,  free: true,  provider: "builtin",       note: "Free — active now" },
  { id: "nairaland", label: "Nairaland",        enabled: true,  free: true,  provider: "builtin",       note: "Free — Nigeria specific" },
  { id: "twitter",   label: "Twitter / X",      enabled: false, free: false, provider: "rapidapi",      note: "Needs RAPIDAPI_KEY" },
  { id: "facebook",  label: "Facebook Groups",  enabled: false, free: false, provider: "apify",         note: "Needs APIFY_API_TOKEN" },
  { id: "linkedin",  label: "LinkedIn",          enabled: false, free: false, provider: "apify",         note: "Needs APIFY_API_TOKEN" },
  { id: "instagram", label: "Instagram",         enabled: false, free: false, provider: "apify",         note: "Needs APIFY_API_TOKEN" },
  { id: "quora",     label: "Quora",             enabled: false, free: false, provider: "apify",         note: "Needs APIFY_API_TOKEN" },
  { id: "gmaps",     label: "Google Maps",       enabled: false, free: false, provider: "outscraper",    note: "Needs OUTSCRAPER_API_KEY" },
  { id: "pb-linkedin",  label: "LinkedIn (PB)",  enabled: false, free: false, provider: "phantombuster", note: "Needs PHANTOMBUSTER_API_KEY" },
  { id: "pb-facebook",  label: "Facebook (PB)",  enabled: false, free: false, provider: "phantombuster", note: "Needs PHANTOMBUSTER_API_KEY" },
];

export const DEFAULT_TEMPLATES = [
  {
    id: "wa-ng",
    name: "WhatsApp Nigerian client",
    channel: "whatsapp",
    body: "Hi {name}! I came across your post on {platform} where you mentioned: {excerpt}\n\nI am Ike, a web designer at {businessName}. I help Nigerian businesses get fast, mobile-ready websites that bring in customers — and you can pay in installments starting from just 50,000 naira.\n\nI recorded a quick 2-min video showing what your business could look like online. Can I send it?",
  },
  {
    id: "email-intl",
    name: "Email International client",
    channel: "email",
    body: "Hi {name},\n\nI came across your post on {platform} and it sounds like you are looking for exactly what I do.\n\nI am a web designer who builds fast, conversion-focused websites for small businesses. My starter plans begin at $75 with flexible installment payments.\n\nI would love to share a few examples relevant to your industry. Would a quick 10-min call work this week?\n\nBest,\nIke\n{businessName}",
  },
  {
    id: "video-audit",
    name: "Video audit pitch",
    channel: "any",
    body: "Hey {name}! I just recorded a free 2-min personalised video audit for your business after seeing your post on {platform}.\n\nIn the video I cover:\n- What potential customers currently see when they search for you\n- 3 quick fixes that would get you more enquiries immediately\n- What a proper website would change for your revenue\n\nWant me to send it over? Completely free, no obligation.",
  },
];

const useStore = create(
  persist(
    (set) => ({
      // ── Config ──
      config: {
        waNumber: "+2348012345678",
        email: "ike@martinvic.com.ng",
        businessName: "martinvic.com.ng",
        yourName: "Ike",
        yourService: "Professional website design",
        yourOffering: "Websites from 50,000 naira with installments for Nigerian clients, from $75 for international clients",
        writingStyle: "",
        aiProvider: "claude",
        scanInterval: 6,
        minScore: 40,
        locationFilter: "both",
        keywords: DEFAULT_KEYWORDS,
        sources: DEFAULT_SOURCES,
        lastScan: null,
      },

      // ── Leads ──
      leads: [],
      dismissed: [],
      pitched: [],

      // ── Lead notes (id -> note text) ──
      leadNotes: {},

      // ── Pipeline stages (id -> stage) ──
      leadStages: {},

      // ── Outreach ──
      outreachLog: [],
      followUps: [],

      // ── Keywords ──
      savedKeywords: [],

      // ── Templates ──
      templates: DEFAULT_TEMPLATES,

      // ── UI ──
      activeTab: "leads",
      isScanning: false,
      scanProgress: 0,

      // ── Actions: Config ──
      setConfig: (updates) =>
        set((s) => ({ config: { ...s.config, ...updates } })),

      addKeyword: (kw) =>
        set((s) => ({
          config: {
            ...s.config,
            keywords: s.config.keywords.includes(kw)
              ? s.config.keywords
              : [...s.config.keywords, kw],
          },
        })),

      removeKeyword: (kw) =>
        set((s) => ({
          config: {
            ...s.config,
            keywords: s.config.keywords.filter((k) => k !== kw),
          },
        })),

      toggleSource: (id) =>
        set((s) => ({
          config: {
            ...s.config,
            sources: s.config.sources.map((src) =>
              src.id === id ? { ...src, enabled: !src.enabled } : src
            ),
          },
        })),

      // ── Actions: Leads ──
      addLeads: (newLeads) =>
        set((s) => {
          const existingIds = new Set(s.leads.map((l) => l.id));
          const fresh = newLeads.filter((l) => !existingIds.has(l.id));
          return {
            leads: [...fresh, ...s.leads].slice(0, 500),
            config: { ...s.config, lastScan: new Date().toISOString() },
          };
        }),

      dismissLead: (id) =>
        set((s) => ({ dismissed: [...s.dismissed, id] })),

      pitchLead: (id) =>
        set((s) => ({
          pitched: s.pitched.includes(id) ? s.pitched : [...s.pitched, id],
        })),

      setLeadNote: (id, note) =>
        set((s) => ({ leadNotes: { ...s.leadNotes, [id]: note } })),

      setLeadStage: (id, stage) =>
        set((s) => ({ leadStages: { ...s.leadStages, [id]: stage } })),

      clearLeads: () =>
        set({ leads: [], dismissed: [], pitched: [], leadNotes: {}, leadStages: {} }),

      // ── Actions: Outreach ──
      addOutreach: (entry) =>
        set((s) => ({ outreachLog: [entry, ...s.outreachLog].slice(0, 200) })),

      addFollowUp: (followUp) =>
        set((s) => ({ followUps: [...s.followUps, followUp] })),

      completeFollowUp: (id) =>
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.id === id ? { ...f, done: true } : f
          ),
        })),

      deleteFollowUp: (id) =>
        set((s) => ({ followUps: s.followUps.filter((f) => f.id !== id) })),

      // ── Actions: Keywords ──
      saveKeywordIdea: (kw) =>
        set((s) => ({
          savedKeywords: s.savedKeywords.find((k) => k.keyword === kw.keyword)
            ? s.savedKeywords
            : [kw, ...s.savedKeywords],
        })),

      removeSavedKeyword: (keyword) =>
        set((s) => ({
          savedKeywords: s.savedKeywords.filter((k) => k.keyword !== keyword),
        })),

      // ── Actions: Templates ──
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      addTemplate: (tpl) =>
        set((s) => ({ templates: [...s.templates, tpl] })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      // ── Actions: UI ──
      setActiveTab: (tab) => set({ activeTab: tab }),
      setScanning:  (val) => set({ isScanning: val }),
      setScanProgress: (val) => set({ scanProgress: val }),
    }),
    {
      name: "lead-radar-store",
      partialize: (state) => ({
        config:      state.config,
        leads:       state.leads,
        dismissed:   state.dismissed,
        pitched:     state.pitched,
        leadNotes:   state.leadNotes,
        leadStages:  state.leadStages,
        outreachLog: state.outreachLog,
        followUps:   state.followUps,
        savedKeywords: state.savedKeywords,
        templates:   state.templates,
      }),
    }
  )
);

export default useStore;
