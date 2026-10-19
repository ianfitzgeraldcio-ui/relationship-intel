import { api } from "./api";

// One shared Server-Sent Events connection to /api/events. The server sends
// {"tables": [...]} whenever data changes (including changes the MCP server
// made); "*" means "anything may have changed". Pages subscribe through
// useLiveRefresh rather than using this directly.

type Listener = (tables: string[]) => void;

const RESYNC_AFTER_HIDDEN_MS = 15_000;
const RETRY_MS = 5_000;
// The server sends a heartbeat every 25s; this much silence means the connection is dead.
const SILENCE_LIMIT_MS = 70_000;
const WATCHDOG_INTERVAL_MS = 15_000;

const listeners = new Set<Listener>();
let authLostHandler: (() => void) | null = null;
let source: EventSource | null = null;
let interrupted = false;
let retryTimer: number | undefined;
let hiddenAt: number | null = null;
let lastHeard = 0;
let watchdog: number | undefined;

function emit(tables: string[]) {
  for (const listener of listeners) listener(tables);
}

// Called once the session is gone (e.g. the server restarted after a deploy), so
// the app can show the login screen instead of a page that silently stopped updating.
export function onAuthLost(handler: () => void): () => void {
  authLostHandler = handler;
  return () => {
    if (authLostHandler === handler) authLostHandler = null;
  };
}

async function recover() {
  try {
    const session = await api.session();
    if (!session.authenticated) {
      authLostHandler?.();
      return;
    }
  } catch {
    // server unreachable right now - keep trying
  }
  retryTimer = window.setTimeout(connect, RETRY_MS);
}

// A connection can die without the browser noticing (laptop sleep, a dropped network, a
// proxy that never reports the close). If the heartbeats stop, start over.
function startWatchdog() {
  if (watchdog !== undefined) return;
  watchdog = window.setInterval(() => {
    if (!source || Date.now() - lastHeard < SILENCE_LIMIT_MS) return;
    source.close();
    source = null;
    interrupted = true;
    connect();
  }, WATCHDOG_INTERVAL_MS);
}

function connect() {
  if (source || listeners.size === 0) return;
  const es = new EventSource("/api/events");
  source = es;
  lastHeard = Date.now();
  startWatchdog();

  es.onopen = () => {
    lastHeard = Date.now();
    // Anything that changed while the connection was down was missed.
    if (interrupted) {
      interrupted = false;
      emit(["*"]);
    }
  };

  es.onmessage = (event) => {
    lastHeard = Date.now();
    try {
      const { tables } = JSON.parse(event.data);
      if (Array.isArray(tables) && tables.length === 0) return; // heartbeat
      emit(Array.isArray(tables) ? tables : ["*"]);
    } catch {
      emit(["*"]);
    }
  };

  es.onerror = () => {
    interrupted = true;
    // CONNECTING means the browser is already retrying on its own.
    if (es.readyState !== EventSource.CLOSED) return;
    // The browser gave up (the server answered 401, e.g. the session ended).
    es.close();
    source = null;
    void recover();
  };
}

function disconnect() {
  source?.close();
  source = null;
  interrupted = false;
  window.clearTimeout(retryTimer);
  window.clearInterval(watchdog);
  watchdog = undefined;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) disconnect();
  };
}

// A laptop that slept or a tab that sat in the background can miss events
// without the connection noticing, so refresh once when it comes back.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    hiddenAt = Date.now();
    return;
  }
  const wasHiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
  hiddenAt = null;
  if (listeners.size === 0) return;
  connect();
  if (wasHiddenFor >= RESYNC_AFTER_HIDDEN_MS) emit(["*"]);
});
