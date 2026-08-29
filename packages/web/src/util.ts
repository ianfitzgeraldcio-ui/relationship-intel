import type { Response } from "express";

// Postgres error code for a foreign-key violation.
export const FOREIGN_KEY_VIOLATION = "23503";

export function handleDbError(err: any, res: Response, fkMessage: string) {
  if (err?.code === FOREIGN_KEY_VIOLATION) {
    res.status(409).json({ error: fkMessage });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
