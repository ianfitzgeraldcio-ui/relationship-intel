import { useEffect, useState } from "react";
import { api } from "../api";

interface HealthSummary {
  temperature_distribution: { temperature: string; count: string }[];
  open_pipeline_by_stage: { stage: string; count: string; total_value: string }[];
  drifting_relationship_count: number;
  drifting_relationships: {
    relationship_id: string;
    contact_name: string;
    strength_score: number;
    temperature: string | null;
    days_since_last_interaction: string;
    baseline_gap_days: string;
  }[];
}

export default function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .healthSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  async function handleLogout() {
    await api.logout();
    onLogout();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Relationship Intel</h1>
        <button className="link-button" onClick={handleLogout}>
          Sign out
        </button>
      </header>
      <main className="dashboard">
        {error && <p className="error-banner">{error}</p>}
        {!summary && !error && <p className="muted">Loading dashboard…</p>}
        {summary && (
          <>
            <section className="card-grid">
              {summary.temperature_distribution.map((t) => (
                <div key={t.temperature} className="stat-card">
                  <span className="stat-label">{t.temperature}</span>
                  <span className="stat-value">{t.count}</span>
                </div>
              ))}
              <div className="stat-card stat-card-warn">
                <span className="stat-label">Drifting relationships</span>
                <span className="stat-value">{summary.drifting_relationship_count}</span>
              </div>
            </section>

            <section>
              <h2>Open pipeline by stage</h2>
              {summary.open_pipeline_by_stage.length === 0 ? (
                <p className="muted">No open opportunities.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Count</th>
                      <th>Total value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.open_pipeline_by_stage.map((s) => (
                      <tr key={s.stage}>
                        <td>{s.stage}</td>
                        <td>{s.count}</td>
                        <td>${Number(s.total_value).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2>Drifting relationships</h2>
              {summary.drifting_relationships.length === 0 ? (
                <p className="muted">Nothing drifting right now.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Strength</th>
                      <th>Temperature</th>
                      <th>Days silent</th>
                      <th>Normal cadence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.drifting_relationships.map((r) => (
                      <tr key={r.relationship_id}>
                        <td>{r.contact_name}</td>
                        <td>{r.strength_score}</td>
                        <td>{r.temperature ?? "—"}</td>
                        <td>{r.days_since_last_interaction}</td>
                        <td>{Math.round(Number(r.baseline_gap_days))} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
