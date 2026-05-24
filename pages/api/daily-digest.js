// Daily digest — returns today's stats summary
// Called by the frontend DigestPage component

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { leads, pitched, outreachLog, dismissed } = req.body || {};
  const allLeads  = leads  || [];
  const allPitch  = pitched || [];
  const allLog    = outreachLog || [];

  const now       = Date.now();
  const DAY_MS    = 24 * 3600 * 1000;
  const WEEK_MS   = 7  * DAY_MS;

  // Today and this week
  const today     = allLeads.filter(l => now - new Date(l.createdAt).getTime() < DAY_MS);
  const thisWeek  = allLeads.filter(l => now - new Date(l.createdAt).getTime() < WEEK_MS);

  // Hot leads today
  const hotToday  = today.filter(l => l.score >= 78);

  // Pitches today
  const pitchToday = allLog.filter(e => now - new Date(e.sentAt).getTime() < DAY_MS);

  // Top keyword today
  const kwMap = {};
  today.forEach(l => { if (l.keyword) kwMap[l.keyword] = (kwMap[l.keyword] || 0) + 1; });
  const topKw = Object.entries(kwMap).sort((a, b) => b[1] - a[1])[0];

  // Top source today
  const srcMap = {};
  today.forEach(l => { if (l.source) srcMap[l.source] = (srcMap[l.source] || 0) + 1; });
  const topSrc = Object.entries(srcMap).sort((a, b) => b[1] - a[1])[0];

  // Top 5 hottest leads today (not yet pitched)
  const topLeads = today
    .filter(l => !allPitch.includes(l.id) && !(dismissed || []).includes(l.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Conversion rate this week
  const weekPitched  = allLog.filter(e => now - new Date(e.sentAt).getTime() < WEEK_MS).length;
  const convRate     = thisWeek.length ? Math.round((weekPitched / thisWeek.length) * 100) : 0;

  return res.status(200).json({
    today: {
      total:    today.length,
      hot:      hotToday.length,
      pitched:  pitchToday.length,
      topKw:    topKw  ? topKw[0]  : null,
      topSrc:   topSrc ? topSrc[0] : null,
    },
    week: {
      total:    thisWeek.length,
      pitched:  weekPitched,
      convRate,
    },
    topLeads,
  });
}
