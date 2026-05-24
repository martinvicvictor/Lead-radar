// Email finder — uses Hunter.io free tier (25 searches/month free)
// Dormant until HUNTER_API_KEY is added in Vercel Environment Variables

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ email: null, message: "HUNTER_API_KEY not configured" });
  }

  const { domain, firstName, lastName } = req.body || {};
  if (!domain) {
    return res.status(400).json({ error: "No domain provided" });
  }

  try {
    const url = "https://api.hunter.io/v2/email-finder?domain=" +
      encodeURIComponent(domain) +
      (firstName ? "&first_name=" + encodeURIComponent(firstName) : "") +
      (lastName  ? "&last_name="  + encodeURIComponent(lastName)  : "") +
      "&api_key=" + apiKey;

    const r = await fetch(url);
    const data = await r.json();

    if (data && data.data && data.data.email) {
      return res.status(200).json({
        email: data.data.email,
        confidence: data.data.score,
        firstName: data.data.first_name,
        lastName: data.data.last_name,
      });
    }

    return res.status(200).json({ email: null, message: "No email found" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
