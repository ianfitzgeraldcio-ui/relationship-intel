import { useEffect, useRef } from "react";
import { subscribe } from "./liveUpdates";

const MIN_GAP_MS = 2000;

// Re-runs `refresh` when the database changes, so the page shows records added
// elsewhere (MCP tools, another tab) without a manual reload.
//   tables: only refresh for changes to these tables (omit to refresh on any change).
// Refreshes are spaced at least 2s apart, and the last change in a burst always
// gets a final refresh. `refresh` should fail quietly - an automatic refresh must
// never replace a page that is already showing data with an error.
export function useLiveRefresh(refresh: () => unknown, tables?: readonly string[]) {
  const latest = useRef(refresh);
  latest.current = refresh;
  const key = tables ? tables.join(",") : "";

  useEffect(() => {
    const watched = key ? key.split(",") : null;
    let timer: number | undefined;
    let lastRun = 0;

    const unsubscribe = subscribe((changed) => {
      if (watched && !changed.includes("*") && !changed.some((t) => watched.includes(t))) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        lastRun = Date.now();
        void latest.current();
      }, Math.max(0, lastRun + MIN_GAP_MS - Date.now()));
    });

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [key]);
}
