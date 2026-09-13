import { useEffect, useRef, useState } from "react";
import { api } from "../api";

export interface ContactOption {
  id: string;
  name: string;
  title?: string | null;
}

export default function ContactSearchInput({
  selected,
  onSelect,
  onClear,
  excludeId,
  placeholder = "Search contacts by name…",
}: {
  selected: ContactOption | null;
  onSelect: (contact: ContactOption) => void;
  onClear: () => void;
  excludeId?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactOption[]>([]);
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
        const rows = await api.contacts.list({ query });
        if (!cancelled) setResults(rows.filter((r: ContactOption) => r.id !== excludeId));
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, excludeId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selected) {
    return (
      <div className="contact-search-selected">
        <span>{selected.name}</span>
        <button type="button" className="link-button" onClick={onClear}>
          Change
        </button>
      </div>
    );
  }

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
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && query.trim() && (
        <ul className="contact-search-results">
          {results.length === 0 ? (
            <li className="contact-search-empty">No matches</li>
          ) : (
            results.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => {
                  onSelect(c);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {c.name}
                {c.title ? <span className="muted"> — {c.title}</span> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
