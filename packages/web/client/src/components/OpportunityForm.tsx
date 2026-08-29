import { useState } from "react";
import type { FormEvent } from "react";

export interface OpportunityFormValues {
  name: string;
  organization_id: string;
  stage: string;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
}

const STAGES = ["identified", "qualifying", "proposal", "negotiation", "won", "lost"];

export default function OpportunityForm({
  initial,
  fixedOrganizationId,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<OpportunityFormValues>;
  fixedOrganizationId?: string;
  onSubmit: (values: OpportunityFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<OpportunityFormValues>({
    name: initial?.name ?? "",
    organization_id: fixedOrganizationId ?? initial?.organization_id ?? "",
    stage: initial?.stage ?? "identified",
    estimated_value: initial?.estimated_value,
    probability: initial?.probability,
    expected_close_date: initial?.expected_close_date ? String(initial.expected_close_date).slice(0, 10) : "",
    notes: initial?.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof OpportunityFormValues>(key: K, value: OpportunityFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        expected_close_date: values.expected_close_date || undefined,
        notes: values.notes || undefined,
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
          Stage
          <select value={values.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Probability (%)
          <input
            type="number"
            min={0}
            max={100}
            value={values.probability ?? ""}
            onChange={(e) => set("probability", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Estimated value ($)
          <input
            type="number"
            value={values.estimated_value ?? ""}
            onChange={(e) => set("estimated_value", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
        <label>
          Expected close date
          <input
            type="date"
            value={values.expected_close_date}
            onChange={(e) => set("expected_close_date", e.target.value)}
          />
        </label>
      </div>
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
