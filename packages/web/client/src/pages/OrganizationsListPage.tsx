import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Modal from "../components/Modal";
import OrganizationForm from "../components/OrganizationForm";
import type { OrganizationFormValues } from "../components/OrganizationForm";

interface Organization {
  id: string;
  name: string;
  org_type: string;
  sector: string | null;
  state: string | null;
  annual_revenue: string | null;
}

export default function OrganizationsListPage() {
  const [query, setQuery] = useState("");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    try {
      const results = await api.organizations.list({ query });
      setOrgs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate(values: OrganizationFormValues) {
    await api.organizations.create(values);
    setShowCreate(false);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Organizations</h2>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          + New Organization
        </button>
      </div>
      <input
        className="search-input"
        placeholder="Search organizations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="error-banner">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Sector</th>
            <th>State</th>
            <th>Annual revenue</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((org) => (
            <tr key={org.id}>
              <td>
                <Link to={`/organizations/${org.id}`}>{org.name}</Link>
              </td>
              <td>{org.org_type}</td>
              <td>{org.sector ?? "—"}</td>
              <td>{org.state ?? "—"}</td>
              <td>{org.annual_revenue ? `$${Number(org.annual_revenue).toLocaleString()}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orgs.length === 0 && !error && <p className="muted">No organizations found.</p>}

      {showCreate && (
        <Modal title="New Organization" onClose={() => setShowCreate(false)}>
          <OrganizationForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create" />
        </Modal>
      )}
    </div>
  );
}
