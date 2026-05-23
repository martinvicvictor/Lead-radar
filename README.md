# 📡 Lead Radar v2.0 — by martinvic.com.ng

---

## ⚠️ IMPORTANT — Why you got 404 and how to fix it

The 404 error happens when GitHub receives the files inside a subfolder instead of at the root. Vercel then can't find `package.json` and shows 404.

**The correct structure Vercel needs to see:**
```
your-repo/
├── package.json          ← must be HERE at root
├── next.config.js        ← must be HERE at root
├── pages/
│   ├── index.js
│   └── _app.js
├── components/
├── lib/
├── public/
└── styles/
```

**The wrong structure (causes 404):**
```
your-repo/
└── lead-radar/           ← ❌ extra folder = 404
    ├── package.json
    ├── pages/
    └── ...
```

---

## ✅ Correct way to upload to GitHub (3 methods — pick one)

### Method A — GitHub website drag & drop (easiest)
1. Go to github.com → your `lead-radar` repository
2. Click **"uploading an existing file"** (or the "Add file" button if repo already exists)
3. **Open the unzipped folder** on your computer
4. Select ALL files inside the folder (Ctrl+A on Windows, Cmd+A on Mac)
5. Drag them into the GitHub upload area
6. You should see `package.json`, `next.config.js`, `pages/`, etc. listed — NOT a folder called `lead-radar`
7. Scroll down → click **"Commit changes"**

### Method B — GitHub Desktop (most reliable)
1. Download GitHub Desktop from desktop.github.com
2. File → **"Add Local Repository"** → choose the unzipped folder
3. It will say "This folder is not a Git repository" → click **"create a repository"**
4. Fill in the name → **Create Repository**
5. Click **"Publish repository"** → tick **Keep this code private** → Publish
6. Done — structure is always correct with this method

### Method C — If you already deployed with wrong structure
1. Go to your GitHub repo
2. If you see a `lead-radar` folder at the top level, the files are one level too deep
3. You need to delete the repo and re-upload using Method A or B above
4. Or in Vercel: go to your project → Settings → General → **Root Directory** → type `lead-radar` → Save → Redeploy

---

## 🚀 Vercel deployment steps

1. Go to vercel.com → sign up free with your GitHub account
2. Click **Add New Project**
3. Find `lead-radar` in the list → click **Import**
4. **IMPORTANT:** Under "Root Directory" — leave it blank (should say `.`)
5. Framework Preset should auto-detect as **Next.js**
6. Click **Deploy** → wait ~2 minutes
7. You get a URL like `https://lead-radar-flax.vercel.app`

---

## 🌐 Attach your custom domain

1. Vercel dashboard → your project → **Settings** → **Domains**
2. Type `radar.martinvic.com.ng` → click **Add**
3. Vercel gives you: **Type: CNAME, Name: radar, Value: cname.vercel-dns.com**
4. Log in to wherever you manage martinvic.com.ng's DNS
5. Add that exact CNAME record → save
6. Wait 5–30 minutes → live at `https://radar.martinvic.com.ng` with free HTTPS

---

## 📱 Install as Phone App

**Android (Chrome):**
Open your URL in Chrome → tap ⋮ → "Add to Home Screen" → Add

**iPhone (Safari only):**
Open your URL in Safari → tap Share button → "Add to Home Screen" → Add

---

## 🔑 Add API keys for more sources

Vercel → your project → **Settings** → **Environment Variables** → add:

| Key | Unlocks | Where to get |
|---|---|---|
| `RAPIDAPI_KEY` | Twitter / X | rapidapi.com → search "Twitter135" |
| `PHANTOMBUSTER_API_KEY` | LinkedIn, Facebook, Instagram, Quora | phantombuster.com |
| `PB_LINKEDIN_AGENT_ID` | LinkedIn agent ID | PhantomBuster dashboard |
| `PB_FACEBOOK_AGENT_ID` | Facebook agent ID | PhantomBuster dashboard |
| `PB_INSTAGRAM_AGENT_ID` | Instagram agent ID | PhantomBuster dashboard |
| `PB_QUORA_AGENT_ID` | Quora agent ID | PhantomBuster dashboard |

After adding keys → Vercel → Deployments → ⋯ → Redeploy

---

## ✅ What works immediately (no keys needed)

- Reddit live scraping
- Nairaland live scraping  
- Lead scoring (0–100)
- Lead deduplication across scans
- Auto-scan on schedule
- Pitch modal + 3 templates
- Follow-up reminders
- CSV export
- WhatsApp one-click pitch
- Keyword research + YouTube/blog content ideas
- Outreach log
- Analytics dashboard
- Phone PWA (installable)
- Custom domain support

---

Built for Ike · martinvic.com.ng · v2.0
