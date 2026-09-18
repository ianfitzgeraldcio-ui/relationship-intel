import { useEffect, useState } from "react";
import { api } from "../api";
import SignalsTable, { categoryLabel } from "../components/SignalsTable";
import type { Signal } from "../components/SignalsTable";
import { todayInPacific } from "../timezone";

const CATEGORIES = [
  "rfp_procurement",
  "capital_project",
  "regulatory",
  "leadership_change",
  "technology",
  "financial",
  "merger_acquisition",
  "competitor",
  "other",
];

function daysAgo(n: number): string {
  const [y, m, d] = todayInPacific().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

export default function SignalsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minScore, setMinScore] = useState("");
  const [days, setDays] = useState("30");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const results = await api.signals.list({
        query,
        category,
        min_score: minScore ? Number(minScore) : undefined,
        since: days === "all" ? undefined : daysAgo(Number(days)),
        limit: 300,
      });
      setSignals(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, minScore, days]);

  return (
    <div>
      <div className="page-header">
        <h2>Current Signals</h2>
      </div>
      <input
        className="search-input"
        placeholder="Search by organization or summary text…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="filter-row">
        <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Time range">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="all">All time</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        <select value={minScore} onChange={(e) => setMinScore(e.target.value)} aria-label="Minimum score">
          <option value="">Any score</option>
          <option value="3">Score 3+</option>
          <option value="4">Score 4+</option>
          <option value="5">Score 5</option>
        </select>
      </div>
      {error && <p className="error-banner">{error}</p>}
      {signals.length > 0 && <SignalsTable signals={signals} onChanged={load} />}
      {!loading && signals.length === 0 && !error && <p className="muted">No signals match these filters.</p>}
      <p className="muted signal-footnote">
        Signals expire automatically unless pinned: score 1–2 after 90 days, score 3 after 1 year, score 4–5 after 2 years.
      </p>
    </div>
  );
}
