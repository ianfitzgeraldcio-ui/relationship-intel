import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Modal from "../components/Modal";
import ContactForm from "../components/ContactForm";
import type { ContactFormValues } from "../components/ContactForm";

const TEMPERATURES = ["cold", "cool", "warm", "hot"];
const RELATIONSHIP_TYPES = ["primary", "secondary", "historical", "introduced_by"];
const INTERACTION_TYPES = ["meeting", "call", "email", "event", "note"];
const CONNECTION_TYPES = ["colleague", "reports_to", "former_colleague", "friend", "family", "other"];
const REFERRAL_WILLINGNESS = ["unknown", "unlikely", "possible", "likely", "confirmed"];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [firmColleagues, setFirmColleagues] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    "edit" | "position" | "relationship" | "interaction" | "connection" | null
  >(null);

  async function load() {
    if (!id) return;
    try {
      const [profileData, connectionsData, colleaguesData] = await Promise.all([
        api.contacts.get(id),
        api.contacts.connections(id),
        api.firmColleagues.list(),
      ]);
      setProfile(profileData);
      setConnections(connectionsData);
      setFirmColleagues(colleaguesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(values: ContactFormValues) {
    if (!id) return;
    await api.contacts.update(id, values);
    setActiveModal(null);
    load();
  }

  async function handleDelete() {
    if (!id || !confirm(`Delete ${profile.contact.name}? This can't be undone.`)) return;
    try {
      await api.contacts.remove(id);
      navigate("/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleTemperatureChange(relationshipId: string, temperature: string) {
    await api.relationships.updateTemperature(relationshipId, temperature);
    load();
  }

  async function handleStrengthChange(relationshipId: string, strength: string) {
    await api.relationships.updateStrength(relationshipId, Number(strength));
    load();
  }

  if (error) return <p className="error-banner">{error}</p>;
  if (!profile) return <p className="muted">Loading…</p>;

  const { contact, position_history, relationships, recent_interactions } = profile;

  return (
    <div>
      <Link to="/contacts" className="back-link">
        ← Contacts
      </Link>
      <div className="page-header">
        <h2>{contact.name}</h2>
        <div className="button-row">
          <button className="secondary-button" onClick={() => setActiveModal("edit")}>
            Edit
          </button>
          <button className="danger-button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span className="field-label">Title</span>
          <span>{contact.title ?? "—"}</span>
        </div>
        <div>
          <span className="field-label">Organization</span>
          <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name}</Link>
        </div>
        <div>
          <span className="field-label">Role</span>
          <span>{contact.role_category}</span>
        </div>
        <div>
          <span className="field-label">Decision authority</span>
          <span>{contact.decision_authority}</span>
        </div>
        <div>
          <span className="field-label">Email</span>
          <span>{contact.email ?? "—"}</span>
        </div>
        <div>
          <span className="field-label">Phone</span>
          <span>{contact.phone ?? "—"}</span>
        </div>
      </div>

      <section>
        <div className="section-header">
          <h3>Relationships</h3>
          <button className="secondary-button" onClick={() => setActiveModal("relationship")}>
            + Add
          </button>
        </div>
        {relationships.length === 0 ? (
          <p className="muted">No relationships yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Firm colleague</th>
                <th>Type</th>
                <th>Strength</th>
                <th>Effective</th>
                <th>Temperature</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.firm_colleague_name}</td>
                  <td>{r.relationship_type}</td>
                  <td>
                    <select value={r.strength_score} onChange={(e) => handleStrengthChange(r.id, e.target.value)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{r.effective_strength}</td>
                  <td>
                    <select
                      value={r.temperature ?? ""}
                      onChange={(e) => handleTemperatureChange(r.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {TEMPERATURES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="section-header">
          <h3>Recent interactions</h3>
          <button
            className="secondary-button"
            onClick={() => setActiveModal("interaction")}
            disabled={relationships.length === 0}
          >
            + Log interaction
          </button>
        </div>
        {recent_interactions.length === 0 ? (
          <p className="muted">No interactions logged yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Summary</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {recent_interactions.map((i: any) => (
                <tr key={i.id}>
                  <td>{new Date(i.date).toLocaleDateString()}</td>
                  <td>{i.interaction_type}</td>
                  <td>{i.summary}</td>
                  <td>{i.sentiment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="section-header">
          <h3>Position history</h3>
          <button className="secondary-button" onClick={() => setActiveModal("position")}>
            + Add
          </button>
        </div>
        {position_history.length === 0 ? (
          <p className="muted">No history recorded.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Organization</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {position_history.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <Link to={`/organizations/${p.organization_id}`}>{p.organization_name}</Link>
                  </td>
                  <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"}</td>
                  <td>{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="section-header">
          <h3>Known connections</h3>
          <button className="secondary-button" onClick={() => setActiveModal("connection")}>
            + Add
          </button>
        </div>
        {connections.length === 0 ? (
          <p className="muted">No known connections.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Connection type</th>
                <th>Referral willingness</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contacts/${c.other_contact_id}`}>{c.other_contact_name}</Link>
                  </td>
                  <td>{c.connection_type}</td>
                  <td>{c.referral_willingness ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {activeModal === "edit" && (
        <Modal title={`Edit ${contact.name}`} onClose={() => setActiveModal(null)}>
          <ContactForm initial={contact} onSubmit={handleUpdate} onCancel={() => setActiveModal(null)} />
        </Modal>
      )}
      {activeModal === "position" && id && (
        <Modal title="Add position history" onClose={() => setActiveModal(null)}>
          <PositionHistoryForm
            contactId={id}
            defaultOrganizationId={contact.organization_id}
            onDone={() => {
              setActiveModal(null);
              load();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}
      {activeModal === "relationship" && id && (
        <Modal title="Add relationship" onClose={() => setActiveModal(null)}>
          <RelationshipCreateForm
            contactId={id}
            firmColleagues={firmColleagues}
            onDone={() => {
              setActiveModal(null);
              load();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}
      {activeModal === "interaction" && (
        <Modal title="Log interaction" onClose={() => setActiveModal(null)}>
          <InteractionForm
            relationships={relationships}
            onDone={() => {
              setActiveModal(null);
              load();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}
      {activeModal === "connection" && id && (
        <Modal title="Add known connection" onClose={() => setActiveModal(null)}>
          <ConnectionForm
            contactId={id}
            onDone={() => {
              setActiveModal(null);
              load();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function PositionHistoryForm({
  contactId,
  defaultOrganizationId,
  onDone,
  onCancel,
}: {
  contactId: string;
  defaultOrganizationId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.contacts.addPositionHistory(contactId, {
        organization_id: organizationId,
        title,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Organization ID
        <input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required />
      </label>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <div className="form-row">
        <label>
          Start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

function RelationshipCreateForm({
  contactId,
  firmColleagues,
  onDone,
  onCancel,
}: {
  contactId: string;
  firmColleagues: any[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [firmColleagueId, setFirmColleagueId] = useState(firmColleagues[0]?.id ?? "");
  const [relationshipType, setRelationshipType] = useState("primary");
  const [strengthScore, setStrengthScore] = useState(3);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firmColleagueId) {
      setError("Add a firm colleague first (via the API) before creating a relationship.");
      return;
    }
    try {
      await api.relationships.create({
        firm_colleague_id: firmColleagueId,
        contact_id: contactId,
        relationship_type: relationshipType,
        strength_score: strengthScore,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Firm colleague
        <select value={firmColleagueId} onChange={(e) => setFirmColleagueId(e.target.value)}>
          {firmColleagues.length === 0 && <option value="">No firm colleagues yet</option>}
          {firmColleagues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Relationship type
        <select value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)}>
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        Strength (1-5)
        <select value={strengthScore} onChange={(e) => setStrengthScore(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="login-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

function InteractionForm({
  relationships,
  onDone,
  onCancel,
}: {
  relationships: any[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [relationshipId, setRelationshipId] = useState(relationships[0]?.id ?? "");
  const [interactionType, setInteractionType] = useState("call");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.interactions.create({
        relationship_id: relationshipId,
        interaction_type: interactionType,
        date,
        summary,
        sentiment: sentiment || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Relationship
        <select value={relationshipId} onChange={(e) => setRelationshipId(e.target.value)}>
          {relationships.map((r) => (
            <option key={r.id} value={r.id}>
              {r.firm_colleague_name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Type
          <select value={interactionType} onChange={(e) => setInteractionType(e.target.value)}>
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      <label>
        Summary
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} required />
      </label>
      <label>
        Sentiment
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
          <option value="">—</option>
          <option value="positive">positive</option>
          <option value="neutral">neutral</option>
          <option value="negative">negative</option>
        </select>
      </label>
      {error && <p className="login-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

function ConnectionForm({
  contactId,
  onDone,
  onCancel,
}: {
  contactId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [otherContactId, setOtherContactId] = useState("");
  const [connectionType, setConnectionType] = useState("colleague");
  const [referralWillingness, setReferralWillingness] = useState("unknown");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.contactConnections.create({
        contact_id_a: contactId,
        contact_id_b: otherContactId,
        connection_type: connectionType,
        referral_willingness: referralWillingness,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Other contact ID
        <input
          value={otherContactId}
          onChange={(e) => setOtherContactId(e.target.value)}
          placeholder="contact_..."
          required
        />
      </label>
      <label>
        Connection type
        <select value={connectionType} onChange={(e) => setConnectionType(e.target.value)}>
          {CONNECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        Referral willingness
        <select value={referralWillingness} onChange={(e) => setReferralWillingness(e.target.value)}>
          {REFERRAL_WILLINGNESS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="login-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}
