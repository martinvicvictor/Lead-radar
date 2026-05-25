// Builds platform-specific outreach links from a lead
// So every "reach the person" action takes you to the right place

export function getReachLinks(lead) {
  const src     = (lead.source || "").toLowerCase();
  const handle  = lead.handle || "";
  const url     = (lead.contact && lead.contact.url) || "";
  const links   = [];

  // ── Reddit ──
  if (src.includes("reddit")) {
    const username = handle.replace("u/", "").replace("@", "");

    // Direct post link (may be dead if deleted)
    if (url && url.includes("/comments/")) {
      links.push({
        label:   "View original post",
        href:    url,
        icon:    "📄",
        note:    "Opens the exact Reddit post",
        primary: true,
      });
    }

    // User profile (always works if account exists)
    links.push({
      label: "View Reddit profile",
      href:  "https://www.reddit.com/user/" + username,
      icon:  "👤",
      note:  "Opens their Reddit profile to send a DM",
    });

    // Google search for their username
    links.push({
      label: "Find on Google",
      href:  "https://www.google.com/search?q=reddit+" + encodeURIComponent(username),
      icon:  "🔍",
      note:  "Find their other posts if the original was deleted",
    });
  }

  // ── Nairaland ──
  else if (src.includes("nairaland")) {
    const username = handle.replace("@", "").trim();

    if (url && url.includes("nairaland.com")) {
      links.push({
        label:   "View thread",
        href:    url,
        icon:    "📄",
        note:    "Opens the Nairaland thread",
        primary: true,
      });
    }

    if (username && username !== "Nairaland User" && username !== "Nairaland Post") {
      links.push({
        label: "View profile",
        href:  "https://www.nairaland.com/" + username.toLowerCase().replace(/\s+/g, ""),
        icon:  "👤",
        note:  "Opens their Nairaland profile",
      });
    }
  }

  // ── Twitter / X ──
  else if (src.includes("twitter") || src.includes("x.com")) {
    const username = handle.replace("@", "").trim();

    if (username) {
      links.push({
        label:   "View X profile",
        href:    "https://x.com/" + username,
        icon:    "👤",
        note:    "Opens their X profile — DM them from here",
        primary: true,
      });

      // Pre-compose a reply mentioning them
      links.push({
        label: "Reply on X",
        href:  "https://x.com/intent/tweet?text=" + encodeURIComponent("@" + username + " "),
        icon:  "✉️",
        note:  "Opens X compose window with their handle tagged",
      });
    }

    if (url && url.includes("/status/")) {
      links.push({
        label: "View original tweet",
        href:  url,
        icon:  "📄",
        note:  "May be deleted if tweet is old",
      });
    }
  }

  // ── LinkedIn ──
  else if (src.includes("linkedin")) {
    if (url && url.includes("linkedin.com")) {
      links.push({
        label:   "View LinkedIn profile",
        href:    url,
        icon:    "👤",
        note:    "Opens their LinkedIn profile — send a connection + note",
        primary: true,
      });
    }

    const name = handle.split(" - ")[0].trim();
    links.push({
      label: "Search LinkedIn",
      href:  "https://www.linkedin.com/search/results/people/?keywords=" + encodeURIComponent(name),
      icon:  "🔍",
      note:  "Search for them by name if profile link fails",
    });
  }

  // ── TikTok ──
  else if (src.includes("tiktok")) {
    const username = handle.replace("@", "").trim();

    if (username) {
      links.push({
        label:   "View TikTok profile",
        href:    "https://www.tiktok.com/@" + username,
        icon:    "👤",
        note:    "Opens their TikTok profile — DM them or reply to their video",
        primary: true,
      });
    }

    links.push({
      label: "Search TikTok",
      href:  "https://www.tiktok.com/search?q=" + encodeURIComponent(handle + " web design"),
      icon:  "🔍",
      note:  "Find their recent videos about web design",
    });
  }

  // ── Facebook ──
  else if (src.includes("facebook")) {
    if (url && url.includes("facebook.com")) {
      links.push({
        label:   "View on Facebook",
        href:    url,
        icon:    "📄",
        note:    "Opens the Facebook group or post",
        primary: true,
      });
    }

    links.push({
      label: "Search Facebook",
      href:  "https://www.facebook.com/search/people/?q=" + encodeURIComponent(handle),
      icon:  "🔍",
      note:  "Search for them by name on Facebook",
    });
  }

  // ── Quora ──
  else if (src.includes("quora")) {
    if (url && url.includes("quora.com")) {
      links.push({
        label:   "View question",
        href:    url,
        icon:    "📄",
        note:    "Opens the Quora question — post your answer there",
        primary: true,
      });
    }
  }

  // ── Instagram ──
  else if (src.includes("instagram")) {
    const username = handle.replace("@", "").trim();

    if (username) {
      links.push({
        label:   "View Instagram profile",
        href:    "https://www.instagram.com/" + username,
        icon:    "👤",
        note:    "Opens their Instagram profile — DM them directly",
        primary: true,
      });
    }
  }

  // ── Google Maps ──
  else if (src.includes("google") || src.includes("maps")) {
    if (url) {
      links.push({
        label:   "View on Google Maps",
        href:    url,
        icon:    "📍",
        note:    "Opens their Google Maps listing — get their phone number",
        primary: true,
      });
    }
  }

  // ── Fallback: generic Google search ──
  if (links.length === 0) {
    links.push({
      label:   "Find this person",
      href:    "https://www.google.com/search?q=" + encodeURIComponent(handle + " " + lead.source),
      icon:    "🔍",
      note:    "Search Google for this person",
      primary: true,
    });
  }

  return links;
}

// Build a WhatsApp deeplink pre-filled with a message
export function buildWhatsAppLink(phone, message) {
  const num = (phone || "").replace(/\D/g, "");
  if (!num) return null;
  return "https://wa.me/" + num + (message ? "?text=" + encodeURIComponent(message) : "");
}

// Build an email mailto link
export function buildEmailLink(email, subject, body) {
  if (!email) return null;
  return "mailto:" + email +
    "?subject=" + encodeURIComponent(subject || "Website Design for Your Business") +
    "&body=" + encodeURIComponent(body || "");
}
