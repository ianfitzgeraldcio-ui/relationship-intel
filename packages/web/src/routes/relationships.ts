import { Router } from "express";
import { relationships } from "../../../db/src/index.js";

export const relationshipsRouter = Router();

relationshipsRouter.post("/relationships", async (req, res) => {
  const relationship = await relationships.create(req.body);
  res.status(201).json(relationship);
});

relationshipsRouter.patch("/relationships/:id/strength", async (req, res) => {
  const relationship = await relationships.updateStrength(req.params.id, req.body.strength_score);
  if (!relationship) {
    res.status(404).json({ error: "Relationship not found" });
    return;
  }
  res.json(relationship);
});

relationshipsRouter.patch("/relationships/:id/temperature", async (req, res) => {
  const relationship = await relationships.updateTemperature(req.params.id, req.body.temperature);
  if (!relationship) {
    res.status(404).json({ error: "Relationship not found" });
    return;
  }
  res.json(relationship);
});

relationshipsRouter.get("/drifting-relationships", async (req, res) => {
  const multiplier = req.query.multiplier ? Number(req.query.multiplier) : undefined;
  const drifting = await relationships.findDrifting(multiplier);
  res.json(drifting);
});

relationshipsRouter.delete("/relationships/:id", async (req, res) => {
  const relationship = await relationships.remove(req.params.id);
  if (!relationship) {
    res.status(404).json({ error: "Relationship not found" });
    return;
  }
  res.json(relationship);
});
