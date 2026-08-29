import { useState } from "react";
import type { FormEvent } from "react";

export interface OrganizationFormValues {
  name: string;
  org_type: string;
  ownership_category?: string;
  sector?: string;
  state?: string;
  meter_count?: number;
  annual_revenue?: number;
  website?: string;
  notes?: string;
}

const ORG_TYPES = ["utility", "regulator", "rto_iso", "firm", "other"];
const OWNERSHIP_CATEGORIES = ["IOU", "Cooperative", "Municipal", "PUD", "Crown Corp"];
const SECTORS = ["electric", "gas", "water", "multi"];

export default function OrganizationForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<OrganizationFormValues>;
  onSubmit: (values: OrganizationFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<OrganizationFormValues>({
    name: initial?.name ?? "",
    org_type: initial?.org_type ?? "utility",
    ownership_category: initial?.ownership_category ?? "",
    sector: initial?.sector ?? "",
    state: initial?.state ?? "",
    meter_count: initial?.meter_count,
    annual_revenue: initial?.annual_revenue,
    website: initial?.website ?? "",
    notes: initial?.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof OrganizationFormValues>(key: K, value: OrganizationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const cleaned: OrganizationFormValues = {
        ...values,
        ownership_category: values.ownership_category || undefined,
        sector: values.sector || undefined,
        state: values.state || undefined,
        website: values.website || undefined,
        notes: values.notes || undefined,
        meter_count: values.meter_count || undefined,
        annual_revenue: values.annual_revenue || undefined,
      };
      await onSubmit(cleaned);
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
      <div className="form-row">
        <label>
          Type
          <select value={values.org_type} onChange={(e) => set("org_type", e.target.value)}>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sector
          <select value={values.sector} onChange={(e) => set("sector", e.target.value)}>
            <option value="">—</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Ownership
          <select value={values.ownership_category} onChange={(e) => set("ownership_category", e.target.value)}>
            <option value="">—</option>
            {OWNERSHIP_CATEGORIES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          State
          <input value={values.state} onChange={(e) => set("state", e.target.value)} maxLength={2} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Meter count
          <input
            type="number"
            value={values.meter_count ?? ""}
            onChange={(e) => set("meter_count", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
        <label>
          Annual revenue ($)
          <input
            type="number"
            value={values.annual_revenue ?? ""}
            onChange={(e) => set("annual_revenue", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
      </div>
      <label>
        Website
        <input value={values.website} onChange={(e) => set("website", e.target.value)} />
      </label>
      <label>
        Notes
        <textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
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
