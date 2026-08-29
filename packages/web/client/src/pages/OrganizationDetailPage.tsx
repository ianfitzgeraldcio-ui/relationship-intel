import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Modal from "../components/Modal";
import OrganizationForm from "../components/OrganizationForm";
import type { OrganizationFormValues } from "../components/OrganizationForm";
import OpportunityForm from "../components/OpportunityForm";
import type { OpportunityFormValues } from "../components/OpportunityForm";

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const [orgData, contactsData, relationshipsData] = await Promise.all([
        api.organizations.get(id),
        api.contacts.list({ organization_id: id }),
        api.organizations.relationships(id),
      ]);
      setOrg(orgData);
      setContacts(contactsData);
      setRelationships(relationshipsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(values: OrganizationFormValues) {
    if (!id) return;
    await api.organizations.update(id, values);
    setShowEdit(false);
    load();
  }

  async function handleCreateOpportunity(values: OpportunityFormValues) {
    await api.opportunities.create(values);
    setShowNewOpportunity(false);
    load();
  }

  async function handleDelete() {
    if (!id || !confirm(`Delete ${org.name}? This can't be undone.`)) return;
    try {
      await api.organizations.remove(id);
      navigate("/organizations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (error) return <p className="error-banner">{error}</p>;
  if (!org) return <p className="muted">Loading…</p>;

  return (
    <div>
      <Link to="/organizations" className="back-link">
        ← Organizations
      </Link>
      <div className="page-header">
        <h2>{org.name}</h2>
        <div className="button-row">
          <button className="secondary-button" onClick={() => setShowEdit(true)}>
            Edit
          </button>
          <button className="danger-button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span className="field-label">Type</span>
          <span>{org.org_type}</span>
        </div>
        <div>
          <span className="field-label">Sector</span>
          <span>{org.sector ?? "—"}</span>
        </div>
        <div>
          <span className="field-label">Ownership</span>
          <span>{org.ownership_category ?? "—"}</span>
        </div>
        <div>
          <span className="field-label">State</span>
          <span>{org.state ?? "—"}</span>
        </div>
        <div>
          <span className="field-label">Website</span>
          <span>
            {org.website ? (
              <a href={org.website} target="_blank" rel="noreferrer">
                {org.website}
              </a>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
      {org.notes && <p className="muted">{org.notes}</p>}

      <section className="card-grid">
        <div className="stat-card">
          <span className="stat-label">Contacts</span>
          <span className="stat-value">{org.summary.contact_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Relationships</span>
          <span className="stat-value">{org.summary.relationship_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Interactions (90d)</span>
          <span className="stat-value">{org.summary.interactions_last_90_days}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Won revenue</span>
          <span className="stat-value">${Number(org.summary.won_revenue_to_date).toLocaleString()}</span>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h3>Open opportunities</h3>
          <button className="secondary-button" onClick={() => setShowNewOpportunity(true)}>
            + Add
          </button>
        </div>
        {org.summary.open_opportunities.length === 0 ? (
          <p className="muted">None.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Probability</th>
              </tr>
            </thead>
            <tbody>
              {org.summary.open_opportunities.map((o: any) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.stage}</td>
                  <td>${Number(o.estimated_value).toLocaleString()}</td>
                  <td>{o.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Relationships</h3>
        {relationships.length === 0 ? (
          <p className="muted">No relationships yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Firm colleague</th>
                <th>Strength</th>
                <th>Temperature</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((r: any) => (
                <tr key={r.relationship_id}>
                  <td>
                    <Link to={`/contacts/${r.contact_id}`}>{r.contact_name}</Link>
                  </td>
                  <td>{r.firm_colleague_name}</td>
                  <td>{r.strength_score}</td>
                  <td>{r.temperature ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Contacts</h3>
        {contacts.length === 0 ? (
          <p className="muted">No contacts at this organization yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Role</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contacts/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>{c.title ?? "—"}</td>
                  <td>{c.role_category}</td>
                  <td>{c.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showEdit && (
        <Modal title={`Edit ${org.name}`} onClose={() => setShowEdit(false)}>
          <OrganizationForm initial={org} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
      {showNewOpportunity && id && (
        <Modal title="New Opportunity" onClose={() => setShowNewOpportunity(false)}>
          <OpportunityForm
            fixedOrganizationId={id}
            onSubmit={handleCreateOpportunity}
            onCancel={() => setShowNewOpportunity(false)}
            submitLabel="Create"
          />
        </Modal>
      )}
    </div>
  );
}
