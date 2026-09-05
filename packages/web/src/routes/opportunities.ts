import { Router } from "express";
import { opportunities } from "../../../db/src/index.js";

export const opportunitiesRouter = Router();

opportunitiesRouter.get("/opportunities", async (req, res) => {
  const { organization_id, stage } = req.query;
  const results = await opportunities.search({
    organization_id: organization_id ? String(organization_id) : undefined,
    stage: stage ? String(stage) : undefined,
  });
  res.json(results);
});

opportunitiesRouter.post("/opportunities", async (req, res) => {
  const opportunity = await opportunities.create(req.body);
  res.status(201).json(opportunity);
});

opportunitiesRouter.patch("/opportunities/:id", async (req, res) => {
  const opportunity = await opportunities.update(req.params.id, req.body);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(opportunity);
});

opportunitiesRouter.delete("/opportunities/:id", async (req, res) => {
  const opportunity = await opportunities.remove(req.params.id);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(opportunity);
});

opportunitiesRouter.post("/opportunities/:id/contacts", async (req, res) => {
  const link = await opportunities.addContact({ ...req.body, opportunity_id: req.params.id });
  res.status(201).json(link);
});

opportunitiesRouter.get("/revenue-forecast", async (req, res) => {
  const groupBy = req.query.group_by === "quarter" ? "quarter" : "month";
  const forecast = await opportunities.getRevenueForecast(groupBy);
  res.json(forecast);
});
