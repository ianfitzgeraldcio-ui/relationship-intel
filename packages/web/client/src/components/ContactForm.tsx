import { useState } from "react";
import type { FormEvent } from "react";

export interface ContactFormValues {
  name: string;
  title?: string;
  organization_id: string;
  role_category: string;
  decision_authority: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  is_current: boolean;
}

const ROLE_CATEGORIES = ["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"];
const DECISION_AUTHORITIES = ["decision_maker", "influencer", "gatekeeper", "unknown"];

export default function ContactForm({
  initial,
  fixedOrganizationId,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<ContactFormValues>;
  fixedOrganizationId?: string;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<ContactFormValues>({
    name: initial?.name ?? "",
    title: initial?.title ?? "",
    organization_id: fixedOrganizationId ?? initial?.organization_id ?? "",
    role_category: initial?.role_category ?? "other",
    decision_authority: initial?.decision_authority ?? "unknown",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    linkedin: initial?.linkedin ?? "",
    is_current: initial?.is_current ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        title: values.title || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        linkedin: values.linkedin || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input value={values.name} onChange={(e) => set("name", e.target.value)} required />
      </label>
      <label>
        Title
        <input value={values.title} onChange={(e) => set("title", e.target.value)} />
      </label>
      {!fixedOrganizationId && (
        <label>
          Organization ID
          <input
            value={values.organization_id}
            onChange={(e) => set("organization_id", e.target.value)}
            placeholder="org_..."
            required
          />
        </label>
      )}
      <div className="form-row">
        <label>
          Role category
          <select value={values.role_category} onChange={(e) => set("role_category", e.target.value)}>
            {ROLE_CATEGORIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Decision authority
          <select value={values.decision_authority} onChange={(e) => set("decision_authority", e.target.value)}>
            {DECISION_AUTHORITIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Email
          <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          Phone
          <input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
      </div>
      <label>
        LinkedIn URL
        <input value={values.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={values.is_current} onChange={(e) => set("is_current", e.target.checked)} />
        Currently at this organization
      </label>
      {error && <p className="login-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
