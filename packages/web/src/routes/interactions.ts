import { Router } from "express";
import { interactions } from "../../../db/src/index.js";

export const interactionsRouter = Router();

interactionsRouter.post("/interactions", async (req, res) => {
  const interaction = await interactions.create(req.body);
  res.status(201).json(interaction);
});

interactionsRouter.get("/relationships/:id/interactions", async (req, res) => {
  const results = await interactions.findByRelationship(req.params.id);
  res.json(results);
});

interactionsRouter.get("/interactions/recent", async (req, res) => {
  const { relationship_id, contact_id, days, limit } = req.query;
  const results = await interactions.findRecent({
    relationship_id: relationship_id ? String(relationship_id) : undefined,
    contact_id: contact_id ? String(contact_id) : undefined,
    days: days ? Number(days) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(results);
});
