import { Router } from "express";
import { pool } from "../../../db/src/index.js";

export const adminRouter = Router();

adminRouter.post("/admin/backfill-relationships", async (req, res) => {
  const { firm_colleague_id, strength_score, created_on, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO relationships (id, firm_colleague_id, contact_id, relationship_type, strength_score, notes)
     SELECT 'rel_' || gen_random_uuid(), $1, c.id, 'primary', $2, $3
     FROM contacts c
     WHERE c.created_at::date = $4::date
       AND NOT EXISTS (SELECT 1 FROM relationships r WHERE r.contact_id = c.id)
     RETURNING id`,
    [firm_colleague_id, strength_score, notes, created_on]
  );
  res.json({ inserted: rows.length });
});
