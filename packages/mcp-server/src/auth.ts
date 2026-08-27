import type { IncomingMessage } from "node:http";

// Fails closed: no token configured means no request is authorized.
export function isAuthorized(req: IncomingMessage): boolean {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) return false;

  const header = req.headers["authorization"];
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;

  const token = header.slice("Bearer ".length);
  return token === expected;
}
