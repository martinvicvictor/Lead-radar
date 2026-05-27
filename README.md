# 📡 Lead Radar v3.0 — by martinvic.com.ng

AI-powered lead generation, keyword research, and business finder. Scrapes Reddit and Nairaland live (free, no keys needed). Finds businesses by keyword and location. Generates AI pitches in your voice. Installable as a phone app.

---

## 🚀 Your live URL
https://lead-radar-flax.vercel.app (or your custom domain)

---

## 📱 Install as Phone App (no App Store needed)

**Android — Chrome browser:**
1. Open your live URL in Chrome
2. Tap the three-dot menu (top right) → "Add to Home Screen" → Add
3. Lead Radar appears on your home screen like a native app

**iPhone — Safari only (must be Safari, not Chrome):**
1. Open your live URL in Safari
2. Tap the Share button (box with arrow, bottom of screen)
3. Scroll down → "Add to Home Screen" → Add

---

## 🌐 Custom domain (e.g. radar.martinvic.com.ng)

1. Vercel dashboard → your project → Settings → Domains
2. Type `radar.martinvic.com.ng` → click Add
3. Vercel gives you a CNAME record, e.g.:
   - Type: CNAME
   - Name: radar
   - Value: cname.vercel-dns.com
4. Go to your domain registrar → DNS settings → add that CNAME record
5. Wait 5–30 minutes → live at https://radar.martinvic.com.ng with free HTTPS

---

## ⚙️ How to add API keys (unlock more features)

Go to Vercel → your project → Settings → Environment Variables.
Add each key as Name + Value, then click Save. After adding all keys,
go to Deployments → click the three dots on the latest → Redeploy.

### FREE sources (work right now, no key needed)
- Reddit live scraping — already active
- Nairaland live scraping — already active

### Paid sources — add keys to activate

| Key Name | What it unlocks | Where to get it | Cost |
|---|---|---|---|
| RAPIDAPI_KEY | Twitter / X scraping | rapidapi.com → search "Twitter135" → Subscribe | Free tier available |
| APIFY_API_TOKEN | Facebook, LinkedIn, Instagram, Quora, TikTok | apify.com → Settings → Integrations | Free tier, then ~$5/mo |
| OUTSCRAPER_API_KEY | Business Finder + Google Maps leads | outscraper.com → Dashboard → API Key | Pay per result, free credits on signup |
| GOOGLE_PLACES_API_KEY | Business Finder (alternative to Outscraper) | console.cloud.google.com → APIs → Places API → Credentials | $200 free credit per month |
| HUNTER_API_KEY | Email finder on lead cards | hunter.io → Dashboard → API | Free: 25 searches/month |
| ANTHROPIC_API_KEY | Claude AI pitch generation | console.anthropic.com → API Keys | ~$0.001 per pitch |
| OPENAI_API_KEY | ChatGPT pitch generation | platform.openai.com/api-keys | ~$0.002 per pitch |
| PHANTOMBUSTER_API_KEY | LinkedIn + Facebook (alternative to Apify) | phantombuster.com | ~$30/month |
| PB_LINKEDIN_AGENT_ID | LinkedIn PhantomBuster agent ID | PhantomBuster dashboard | Included with above |
| PB_FACEBOOK_AGENT_ID | Facebook PhantomBuster agent ID | PhantomBuster dashboard | Included with above |

---

## 🔑 Setting up Outscraper (recommended for Business Finder)

Outscraper is the simplest option — it also returns email addresses which Google Places does not.

1. Go to outscraper.com and sign up (free credits included on signup, no card required initially)
2. Once logged in, go to Profile → API Keys → copy your key
3. In Vercel → Environment Variables → add:
   - Name: OUTSCRAPER_API_KEY
   - Value: (paste your key)
4. Save → Redeploy
5. Go to Business Finder page → search any keyword + location

---

## 🔑 Setting up Google Places API (alternative for Business Finder)

Google gives $200 free credit per month — enough for ~540 full searches.

1. Go to console.cloud.google.com and sign in with your Google account
2. Click "Select a project" → New Project → name it "Lead Radar" → Create
3. Go to APIs and Services → Library → search "Places API" → click Enable
4. Go to APIs and Services → Credentials → Create Credentials → API Key
5. Copy the key shown
6. IMPORTANT — restrict the key for safety:
   - Click "Edit API Key"
   - Under API restrictions → select "Restrict key" → choose "Places API"
   - Under Application restrictions → select "HTTP referrers"
   - Add your Vercel URL: https://your-app.vercel.app/*
   - Click Save
7. In Vercel → Environment Variables → add:
   - Name: GOOGLE_PLACES_API_KEY
   - Value: (paste your key)
8. Save → Redeploy

Note: Google requires a credit card to enable billing, but you will NOT be charged
unless you exceed $200 worth of usage in a single month. You can set a spending cap:
Billing → Budgets and alerts → Create budget → set $5/month max to be completely safe.

---

## 🔑 Setting up Apify (for TikTok, Facebook, LinkedIn, Instagram, Quora)

Apify covers all social platforms with one API key.

1. Go to apify.com → Sign Up (free plan includes some credits)
2. Go to Settings → Integrations → copy your API Token
3. In Vercel → Environment Variables → add APIFY_API_TOKEN
4. Redeploy
5. Go to Config page → enable whichever Apify sources you want
6. The scan will now include those platforms automatically

---

## 🔑 Setting up AI Pitch Generation (Claude or ChatGPT)

### Claude (Anthropic) — recommended, ~$0.001 per pitch
1. Go to console.anthropic.com → Sign Up
2. Go to API Keys → Create Key → copy it
3. In Vercel → add ANTHROPIC_API_KEY → Redeploy

### ChatGPT (OpenAI) — ~$0.002 per pitch
1. Go to platform.openai.com → Sign Up
2. Go to API Keys → Create new secret key → copy it
3. In Vercel → add OPENAI_API_KEY → Redeploy

Once a key is added:
- Go to Config page → AI Pitch Generator → select Claude or ChatGPT
- Paste examples of your real messages in "Your writing style"
- Now when you click "Generate pitch" it writes in your voice
- Also works in Auto-pitch mode (the red "Auto-pitch hot leads" button)

---

## 🔑 Setting up Email Finder (Hunter.io)

1. Go to hunter.io → Sign Up (free: 25 email searches per month)
2. Go to Dashboard → API → copy your API key
3. In Vercel → add HUNTER_API_KEY → Redeploy
4. Each lead card now has a "Find email" button that works automatically

---

## 📋 How to use each feature

### Live Leads
- Click "Scan now" to pull fresh leads from Reddit and Nairaland
- All results are filtered by YOUR keywords from the Config page
- Click "Auto-pitch hot leads" for AI-assisted pitching of hot leads
- "Cold Storage" shows leads older than your set days that were not pitched
- Each lead card has "How to reach this person" with platform-specific links

### Business Finder (new)
- Go to "Business Finder" in the sidebar
- Type a keyword (e.g. "restaurants") and a location (e.g. "Victoria Island Lagos")
- Click "Find businesses"
- Use "No website" filter to see businesses that need your services immediately
- Download as CSV or copy all phone numbers in one click

### Keyword Research
- Goes to your first scraper keyword automatically on load
- Click any of your config keywords as quick-search buttons
- Type any topic — results are specific to that topic (not just web design)
- Save keywords you want to write about → they appear in your saved list
- "Add to radar" adds the keyword to your scraper config

### Config page
- Set your WhatsApp number, email, name, and service details
- Paste examples of your writing style for AI pitch personalisation
- Add keywords — these control what the scraper searches for
- Enable/disable sources — free sources work immediately, paid sources need keys
- Set cold storage days — leads older than this move to Cold Storage tab
- Set Google Maps location — used by Business Finder and Maps scraper

### Auto-pitch hot leads
- Click the red "Auto-pitch hot leads" button on the Leads page
- AI generates a personalised pitch for each hot lead (score 78+)
- You review each pitch (edit if needed) and click Send
- For social media leads: pitch is copied to clipboard, their profile opens
- For WhatsApp/email leads: opens app pre-filled with the pitch
- Session shows progress dots — skip or send each lead in seconds

### Referral Tracker
- Log every client: name, source, deal value, service, stage
- Tracks total revenue from converted clients
- Shows which lead source is performing best

### Daily Digest
- Shows today's stats vs this week
- Lists your top unpitched hot leads right now
- Refresh anytime — auto-loads when you open the page

---

## 🔄 How to update the system when new versions are available

1. Download the new zip
2. Unzip it on your computer
3. Go to your GitHub repo
4. Update the files that changed (open each, paste new content, commit)
5. Vercel auto-deploys within 2 minutes

---

## 🛠 Local development (optional)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Environment variables for local development: create a file called `.env.local`
in the project root and add your keys there (same names as Vercel env variables).

---

Built for Ike · martinvic.com.ng · v3.0
