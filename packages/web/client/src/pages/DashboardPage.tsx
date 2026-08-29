import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

interface HealthSummary {
  temperature_distribution: { temperature: string; count: string }[];
  open_pipeline_by_stage: { stage: string; count: string; total_value: string }[];
  open_opportunities: {
    id: string;
    name: string;
    organization_name: string;
    stage: string;
    estimated_value: string | null;
    probability: number | null;
  }[];
  drifting_relationship_count: number;
  drifting_relationships: {
    relationship_id: string;
    contact_id: string;
    contact_name: string;
    strength_score: number;
    temperature: string | null;
    days_since_last_interaction: string;
    baseline_gap_days: string;
  }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .healthSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  return (
    <div className="dashboard">
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
              <h2>Open pipeline</h2>
              {summary.open_opportunities.length === 0 ? (
                <p className="muted">No open opportunities.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th>Organization</th>
                      <th>Stage</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.open_opportunities.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link to={`/opportunities?open=${o.id}`}>{o.name}</Link>
                        </td>
                        <td>{o.organization_name}</td>
                        <td>{o.stage}</td>
                        <td>{o.estimated_value ? `$${Number(o.estimated_value).toLocaleString()}` : "—"}</td>
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
                        <td>
                          <Link to={`/contacts/${r.contact_id}`}>{r.contact_name}</Link>
                        </td>
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
    </div>
  );
}
