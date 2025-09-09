import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();
        const res = await fetch("/api/livescores", { signal: controllerRef.current.signal });
        if (!res.ok) throw new Error("API " + res.status);
        const json = await res.json();
        const fixtures = Array.isArray(json?.data) ? json.data : [];

        const mapped = fixtures.map((f) => {
          const parts = Array.isArray(f?.participants?.data) ? f.participants.data : [];
          const homeTeam = parts.find(p => p?.meta?.location === "home")?.name || parts[0]?.name || "Home";
          const awayTeam = parts.find(p => p?.meta?.location === "away")?.name || parts[1]?.name || "Away";

          const stats = Array.isArray(f?.statistics?.data) ? f.statistics.data : [];
          const getStat = (typeId, periodId, participantId) => {
            const hit = stats.find(s => {
              const t = s?.type_id ?? s?.type?.id;
              const pid = s?.participant_id ?? s?.participant?.id;
              const per = s?.period_id ?? s?.period?.id;
              if (t !== typeId) return false;
              if (typeof periodId === "number" && Number(per) !== periodId) return false;
              if (participantId && String(pid) !== String(participantId)) return false;
              return true;
            });
            const val = hit?.value ?? hit?.data?.value ?? hit?.attributes?.value;
            return Number.isFinite(Number(val)) ? Number(val) : 0;
          };

          const homeId = parts[0]?.id;
          const awayId = parts[1]?.id;

          const cornersHome = getStat(34, null, homeId);
          const cornersAway = getStat(34, null, awayId);

          const da1Home = getStat(44, 1, homeId);
          const da1Away = getStat(44, 1, awayId);
          const da2Home = getStat(44, 2, homeId);
          const da2Away = getStat(44, 2, awayId);

          return ({
            id: f.id || Math.random().toString(36).slice(2),
            match: `${homeTeam} – ${awayTeam}`,
            time: f?.time?.minute ? `${f.time.minute}'` : (f?.time?.status === "HT" ? "HT" : "–"),
            corners: `${cornersHome}–${cornersAway}`,
            da1: `${da1Home}–${da1Away}`,
            da2: `${da2Home}–${da2Away}`,
            delta: `${(da2Home - da1Home)}–${(da2Away - da1Away)}`
          });
        });

        if (alive) {
          setRows(mapped);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || String(e));
          setLoading(false);
        }
      }
    }

    load();
    const id = setInterval(load, 3000);
    return () => { alive = false; clearInterval(id); if (controllerRef.current) controllerRef.current.abort(); };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Live Dangerous Attacks</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>Refreshes every 3 seconds. Columns: Match, Time, Corners, D. Attack 1HT, D. Attack 2HT, Delta D. Attack.</p>
      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <div style={{ overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ minWidth: 800, width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Match</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Time</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Corners</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>D. Attack 1HT</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>D. Attack 2HT</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Delta D. Attack</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: 12 }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 12, color: "#6b7280" }}>No live fixtures</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px" }}>{r.match}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{r.time}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{r.corners}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{r.da1}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{r.da2}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{r.delta}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
