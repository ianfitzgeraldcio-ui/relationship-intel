import { Router } from "express";
import { reports } from "../../../db/src/index.js";

export const reportsRouter = Router();

reportsRouter.get("/health-summary", async (_req, res) => {
  const summary = await reports.getRelationshipHealthSummary();
  res.json(summary);
});
