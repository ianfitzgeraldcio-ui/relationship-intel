import { useEffect, useState } from "react";
import { api } from "../api";
import Modal from "../components/Modal";
import OpportunityForm from "../components/OpportunityForm";
import type { OpportunityFormValues } from "../components/OpportunityForm";

const STAGES = ["identified", "qualifying", "proposal", "negotiation", "won", "lost"];
const STAGE_LABELS: Record<string, string> = {
  identified: "Identified",
  qualifying: "Qualifying",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

interface Opportunity {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  stage: string;
  estimated_value: string | null;
  probability: number | null;
  expected_close_date: string | null;
  notes: string | null;
}

export default function OpportunitiesBoardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  async function load() {
    try {
      const [oppData, forecastData] = await Promise.all([api.opportunities.list({}), api.opportunities.revenueForecast()]);
      setOpportunities(oppData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(values: OpportunityFormValues) {
    await api.opportunities.create(values);
    setShowCreate(false);
    load();
  }

  async function handleUpdate(values: OpportunityFormValues) {
    if (!editing) return;
    await api.opportunities.update(editing.id, values);
    setEditing(null);
    load();
  }

  async function handleDelete() {
    if (!editing || !confirm(`Delete "${editing.name}"?`)) return;
    await api.opportunities.remove(editing.id);
    setEditing(null);
    load();
  }

  async function moveToStage(id: string, stage: string) {
    const current = opportunities.find((o) => o.id === id);
    if (!current || current.stage === stage) return;
    // optimistic update so the drop feels instant
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    try {
      await api.opportunities.update(id, { stage } as any);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move");
      load();
    }
  }

  const weightedTotal = forecast?.forecast_by_period?.reduce(
    (sum: number, p: any) => sum + Number(p.weighted_value),
    0
  );

  return (
    <div>
      <div className="page-header">
        <h2>Opportunities</h2>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          + New Opportunity
        </button>
      </div>

      {forecast && (
        <section className="card-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <span className="stat-label">Weighted open pipeline</span>
            <span className="stat-value">${Math.round(weightedTotal ?? 0).toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Won revenue</span>
            <span className="stat-value">${Number(forecast.closed_won.total_won_revenue).toLocaleString()}</span>
          </div>
        </section>
      )}

      {error && <p className="error-banner">{error}</p>}

      <div className="kanban-board">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className={`kanban-column ${dragOverStage === stage ? "kanban-column-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (draggedId) moveToStage(draggedId, stage);
            }}
          >
            <h3 className="kanban-column-title">{STAGE_LABELS[stage]}</h3>
            {opportunities
              .filter((o) => o.stage === stage)
              .map((o) => (
                <div
                  key={o.id}
                  className="kanban-card"
                  draggable
                  onDragStart={() => setDraggedId(o.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onClick={() => setEditing(o)}
                >
                  <div className="kanban-card-name">{o.name}</div>
                  <div className="kanban-card-org">{o.organization_name}</div>
                  <div className="kanban-card-value">
                    {o.estimated_value ? `$${Number(o.estimated_value).toLocaleString()}` : "—"}
                    {o.probability !== null && <span className="muted"> · {o.probability}%</span>}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="New Opportunity" onClose={() => setShowCreate(false)}>
          <OpportunityForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create" />
        </Modal>
      )}
      {editing && (
        <Modal title={editing.name} onClose={() => setEditing(null)}>
          <OpportunityForm
            initial={editing}
            fixedOrganizationId={editing.organization_id}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
          <button className="danger-button" style={{ marginTop: 12 }} onClick={handleDelete}>
            Delete opportunity
          </button>
        </Modal>
      )}
    </div>
  );
}
