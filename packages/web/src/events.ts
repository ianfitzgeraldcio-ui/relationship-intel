import type { Request, Response } from "express";
import { listenForChanges } from "../../db/src/index.js";

// Streams "something changed" notifications to open browsers (Server-Sent
// Events) so pages can re-fetch their data. Writes made by the MCP server land
// in the same Postgres database; a trigger NOTIFYs on every change and this
// process listens for it.

const COALESCE_MS = 300;
const HEARTBEAT_MS = 25_000;

const clients = new Set<Response>();
const pendingTables = new Set<string>();
let flushTimer: NodeJS.Timeout | null = null;

function send(res: Response, chunk: string) {
  try {
    if (!res.writableEnded && !res.destroyed) res.write(chunk);
  } catch {
    clients.delete(res);
  }
}

// A bulk import fires hundreds of notifications; browsers get one message per
// short window listing the distinct tables that changed. "*" means "anything
// may have changed" (sent when the database listener reconnects).
function queue(table: string | null) {
  pendingTables.add(table ?? "*");
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const tables = [...pendingTables];
    pendingTables.clear();
    const frame = `data: ${JSON.stringify({ tables })}\n\n`;
    for (const res of clients) send(res, frame);
  }, COALESCE_MS);
}

export function startChangeFeed() {
  listenForChanges(queue);
}

export function eventsHandler(req: Request, res: Response) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  send(res, "retry: 3000\n\n");
  clients.add(res);

  // Idle connections get dropped by proxies, and the browser can't tell a silently dead
  // stream from a quiet one. An empty event every 25s fixes both: it keeps the connection
  // open and lets the client notice when the heartbeats stop.
  const heartbeat = setInterval(() => send(res, `data: ${JSON.stringify({ tables: [] })}\n\n`), HEARTBEAT_MS);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}
