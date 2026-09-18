import { Link } from "react-router-dom";
import { api } from "../api";
import { formatDate } from "../timezone";

export interface Signal {
  id: string;
  organization_id: string;
  organization_name: string;
  signal_date: string;
  category: string;
  score: number;
  summary: string;
  source_url: string | null;
  briefing_date: string;
  pinned: boolean;
}

export function categoryLabel(category: string): string {
  return category.replace(/_/g, " ");
}

// Source URLs come from an automated task, so only ever render http(s)
// links - anything else (e.g. a javascript: URL) is shown as plain text.
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default function SignalsTable({
  signals,
  showOrganization = true,
  onChanged,
}: {
  signals: Signal[];
  showOrganization?: boolean;
  onChanged: () => void;
}) {
  async function togglePin(signal: Signal) {
    try {
      await api.signals.update(signal.id, { pinned: !signal.pinned });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(signal: Signal) {
    if (!confirm("Delete this signal?")) return;
    try {
      await api.signals.remove(signal.id);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Score</th>
          <th>Date</th>
          {showOrganization && <th>Organization</th>}
          <th>Category</th>
          <th>Summary</th>
          <th>Source</th>
          <th>Briefing</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {signals.map((s) => (
          <tr key={s.id}>
            <td>
              <span className={`score-badge score-${s.score}`}>{s.score}</span>
            </td>
            <td>{formatDate(s.signal_date)}</td>
            {showOrganization && (
              <td>
                <Link to={`/organizations/${s.organization_id}`}>{s.organization_name}</Link>
              </td>
            )}
            <td>{categoryLabel(s.category)}</td>
            <td className="signal-summary">{s.summary}</td>
            <td>
              {s.source_url && isSafeUrl(s.source_url) ? (
                <a href={s.source_url} target="_blank" rel="noopener noreferrer">
                  Source ↗
                </a>
              ) : (
                "—"
              )}
            </td>
            <td>{formatDate(s.briefing_date)}</td>
            <td className="signal-actions">
              <button
                className="link-button"
                onClick={() => togglePin(s)}
                title={s.pinned ? "Pinned - won't auto-expire. Click to unpin." : "Pin so this never auto-expires"}
              >
                {s.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="link-button" onClick={() => remove(s)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
