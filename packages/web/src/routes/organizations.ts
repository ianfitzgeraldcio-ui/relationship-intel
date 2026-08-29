import { Router } from "express";
import { organizations, relationships, reports } from "../../../db/src/index.js";
import { handleDbError } from "../util.js";

export const organizationsRouter = Router();

organizationsRouter.get("/organizations", async (req, res) => {
  const { query = "", state, org_type, sector, min_revenue } = req.query;
  const results = await organizations.search(String(query), {
    state: state ? String(state) : undefined,
    org_type: org_type ? String(org_type) : undefined,
    sector: sector ? String(sector) : undefined,
    min_revenue: min_revenue ? Number(min_revenue) : undefined,
  });
  res.json(results);
});

organizationsRouter.get("/organizations/:id", async (req, res) => {
  const org = await organizations.findById(req.params.id);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const summary = await reports.getOrganizationSummary(req.params.id);
  res.json({ ...org, summary });
});

organizationsRouter.get("/organizations/:id/relationships", async (req, res) => {
  const map = await relationships.getMapForOrg(req.params.id);
  res.json(map);
});

organizationsRouter.post("/organizations", async (req, res) => {
  const org = await organizations.create(req.body);
  res.status(201).json(org);
});

organizationsRouter.patch("/organizations/:id", async (req, res) => {
  const org = await organizations.update(req.params.id, req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(org);
});

organizationsRouter.delete("/organizations/:id", async (req, res) => {
  try {
    const org = await organizations.remove(req.params.id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json(org);
  } catch (err) {
    handleDbError(err, res, "Cannot delete: one or more contacts still reference this organization. Delete or reassign them first.");
  }
});
