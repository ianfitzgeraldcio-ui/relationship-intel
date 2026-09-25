import { useEffect, useRef, useState } from "react";
import { api } from "../api";

export interface OrganizationOption {
  id: string;
  name: string;
  org_type?: string | null;
  state?: string | null;
}

const MAX_RESULTS = 8;

function describe(org: OrganizationOption): string {
  return [org.org_type, org.state].filter(Boolean).join(" · ");
}

export default function OrganizationSearchInput({
  selected,
  onSelect,
  onClear,
  onCreateNew,
  placeholder = "Search organizations by name…",
}: {
  selected: OrganizationOption | null;
  onSelect: (organization: OrganizationOption) => void;
  onClear: () => void;
  onCreateNew: (suggestedName: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrganizationOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const rows = await api.organizations.list({ query: query.trim() });
        if (!cancelled) setResults(rows);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choose(org: OrganizationOption) {
    onSelect(org);
    setQuery("");
    setOpen(false);
  }

  function createNew() {
    const suggestion = query.trim();
    setQuery("");
    setOpen(false);
    onCreateNew(suggestion);
  }

  if (selected) {
    return (
      <div className="contact-search-selected">
        <span>
          {selected.name}
          {describe(selected) ? <span className="muted"> — {describe(selected)}</span> : null}
        </span>
        <button type="button" className="link-button" onClick={onClear}>
          Change
        </button>
      </div>
    );
  }

  const shown = results.slice(0, MAX_RESULTS);

  return (
    <div className="contact-search" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          // Enter in a search box shouldn't submit the surrounding form.
          if (e.key === "Enter") {
            e.preventDefault();
            if (shown.length > 0) choose(shown[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus
      />
      {open && query.trim() && (
        <ul className="contact-search-results">
          {shown.length === 0 ? (
            <li className="contact-search-empty">No matching organizations</li>
          ) : (
            shown.map((org) => (
              <li key={org.id} onMouseDown={() => choose(org)}>
                {org.name}
                {describe(org) ? <span className="muted"> — {describe(org)}</span> : null}
              </li>
            ))
          )}
          {results.length > MAX_RESULTS && (
            <li className="contact-search-empty">
              Showing {MAX_RESULTS} of {results.length} — keep typing to narrow
            </li>
          )}
          <li className="org-search-create" onMouseDown={createNew}>
            + Create new organization “{query.trim()}”
          </li>
        </ul>
      )}
    </div>
  );
}
