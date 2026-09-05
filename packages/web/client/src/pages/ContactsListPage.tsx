import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Modal from "../components/Modal";
import ContactForm from "../components/ContactForm";
import type { ContactFormValues } from "../components/ContactForm";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  organization_id: string;
  role_category: string;
  email: string | null;
  is_current: boolean;
}

export default function ContactsListPage() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    try {
      const results = await api.contacts.list({ query });
      setContacts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate(values: ContactFormValues) {
    await api.contacts.create(values);
    setShowCreate(false);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Contacts</h2>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          + New Contact
        </button>
      </div>
      <input
        className="search-input"
        placeholder="Search contacts by name, title, role, or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="error-banner">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Role</th>
            <th>Email</th>
            <th>Current</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/contacts/${c.id}`}>{c.name}</Link>
              </td>
              <td>{c.title ?? "—"}</td>
              <td>{c.role_category}</td>
              <td>{c.email ?? "—"}</td>
              <td>{c.is_current ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {contacts.length === 0 && !error && <p className="muted">No contacts found.</p>}

      {showCreate && (
        <Modal title="New Contact" onClose={() => setShowCreate(false)}>
          <ContactForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create" />
        </Modal>
      )}
    </div>
  );
}
