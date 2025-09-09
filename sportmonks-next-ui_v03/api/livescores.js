export default async function handler(req, res) {
  try {
    const token = process.env.SPORTMONKS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing SPORTMONKS_TOKEN" });
    }

    const url =
      "https://api.sportmonks.com/v3/football/livescores/inplay" +
      "?api_token=" + encodeURIComponent(token) +
      "&include=periods;scores;trends;participants;statistics" +
      "&filters=" + encodeURIComponent("fixtureStatisticTypes:34,42,43,44,45,52,58,83,98,99;trendTypes:34,42,43,44,45,52,58,83,98,99") +
      "&timezone=Europe/London&populate=400";

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: "Upstream error", status: upstream.status, body: text });
    }
    const data = await upstream.json();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}
