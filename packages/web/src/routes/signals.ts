import { Router } from "express";
import { signals } from "../../../db/src/index.js";

export const signalsRouter = Router();

signalsRouter.get("/signals", async (req, res) => {
  const { query, organization_id, category, min_score, since, limit } = req.query;
  const results = await signals.search({
    query: query ? String(query) : undefined,
    organization_id: organization_id ? String(organization_id) : undefined,
    category: category ? String(category) : undefined,
    min_score: min_score ? Number(min_score) : undefined,
    since: since ? String(since) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(results);
});

signalsRouter.patch("/signals/:id", async (req, res) => {
  const signal = await signals.update(req.params.id, req.body);
  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  res.json(signal);
});

signalsRouter.delete("/signals/:id", async (req, res) => {
  const signal = await signals.remove(req.params.id);
  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  res.json(signal);
});
