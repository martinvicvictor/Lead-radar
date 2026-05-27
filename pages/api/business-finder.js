// Business Finder API
// Searches Google Maps via Outscraper or falls back to Google Places API
// Returns: business name, phone, email, website, address, rating, category

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { keyword, location, limit } = req.body || {};
  if (!keyword || !location) {
    return res.status(400).json({ error: "keyword and location are required" });
  }

  const query    = keyword.trim() + " " + location.trim();
  const maxItems = Math.min(parseInt(limit) || 20, 40);

  // ── Try Outscraper first (best data quality) ──────────────────────────────
  const outscraperKey = process.env.OUTSCRAPER_API_KEY;
  if (outscraperKey) {
    try {
      const url = "https://api.app.outscraper.com/maps/search-v3" +
        "?query=" + encodeURIComponent(query) +
        "&limit=" + maxItems +
        "&async=false";

      const r = await fetch(url, {
        headers: {
          "X-API-KEY": outscraperKey,
          "Content-Type": "application/json",
        },
      });

      if (r.ok) {
        const data    = await r.json();
        const results = (data.data && data.data[0]) || data.results || [];

        const businesses = results
          .filter(b => b && b.name)
          .map(b => ({
            name:     b.name                                || "",
            phone:    b.phone                              || b.phone_international || "",
            email:    b.email                              || b.emails_from_website || "",
            website:  b.site                               || b.website || "",
            address:  b.full_address                       || b.address || "",
            city:     b.city                               || "",
            country:  b.country                            || "",
            rating:   b.rating                             || null,
            reviews:  b.reviews                            || 0,
            category: b.category                           || b.type || "",
            gmapsUrl: b.place_id
              ? "https://www.google.com/maps/place/?q=place_id:" + b.place_id
              : b.url || "",
            hasWebsite:  !!(b.site || b.website),
            hasPhone:    !!(b.phone || b.phone_international),
            source:   "Outscraper",
          }));

        return res.status(200).json({
          businesses,
          count:    businesses.length,
          query,
          source:   "outscraper",
        });
      }
    } catch (e) {
      console.error("[BusinessFinder:Outscraper]", e.message);
    }
  }

  // ── Try Google Places API ─────────────────────────────────────────────────
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (googleKey) {
    try {
      const searchUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json" +
        "?query=" + encodeURIComponent(query) +
        "&key=" + googleKey;

      const r    = await fetch(searchUrl);
      const data = await r.json();

      if (data.results && data.results.length) {
        // Fetch details for each place (phone, website)
        const businesses = await Promise.all(
          data.results.slice(0, maxItems).map(async (place) => {
            let phone   = "";
            let website = "";
            try {
              const detailUrl = "https://maps.googleapis.com/maps/api/place/details/json" +
                "?place_id=" + place.place_id +
                "&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,types" +
                "&key=" + googleKey;
              const dr   = await fetch(detailUrl);
              const dd   = await dr.json();
              const d    = dd.result || {};
              phone   = d.formatted_phone_number || "";
              website = d.website                || "";
            } catch (_) {}

            return {
              name:       place.name            || "",
              phone,
              email:      "",
              website,
              address:    place.formatted_address || "",
              city:       location,
              country:    "",
              rating:     place.rating           || null,
              reviews:    place.user_ratings_total || 0,
              category:   (place.types && place.types[0]) || "",
              gmapsUrl:   "https://www.google.com/maps/place/?q=place_id:" + place.place_id,
              hasWebsite: !!website,
              hasPhone:   !!phone,
              source:     "Google Places",
            };
          })
        );

        return res.status(200).json({
          businesses: businesses.filter(b => b.name),
          count:      businesses.length,
          query,
          source:     "google-places",
        });
      }
    } catch (e) {
      console.error("[BusinessFinder:GooglePlaces]", e.message);
    }
  }

  // ── No API key configured ─────────────────────────────────────────────────
  return res.status(200).json({
    businesses: [],
    count:      0,
    query,
    source:     "none",
    message:
      "No API key configured. Add OUTSCRAPER_API_KEY or GOOGLE_PLACES_API_KEY " +
      "in Vercel Environment Variables to enable business finder.",
  });
}
