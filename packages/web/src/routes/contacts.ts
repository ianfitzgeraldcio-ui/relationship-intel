import { Router } from "express";
import { contacts, contactConnections, firmColleagues } from "../../../db/src/index.js";

export const contactsRouter = Router();

contactsRouter.get("/contacts", async (req, res) => {
  const { query = "", organization_id, role_category, is_current } = req.query;
  const results = await contacts.search(String(query), {
    organization_id: organization_id ? String(organization_id) : undefined,
    role_category: role_category ? String(role_category) : undefined,
    is_current: is_current !== undefined ? is_current === "true" : undefined,
  });
  res.json(results);
});

contactsRouter.get("/contacts/:id", async (req, res) => {
  const profile = await contacts.getProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(profile);
});

contactsRouter.post("/contacts", async (req, res) => {
  const contact = await contacts.create(req.body);
  res.status(201).json(contact);
});

contactsRouter.patch("/contacts/:id", async (req, res) => {
  const contact = await contacts.update(req.params.id, req.body);
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(contact);
});

contactsRouter.delete("/contacts/:id", async (req, res) => {
  const contact = await contacts.remove(req.params.id);
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(contact);
});

contactsRouter.post("/contacts/:id/position-history", async (req, res) => {
  const position = await contacts.addPositionHistory({ ...req.body, contact_id: req.params.id });
  res.status(201).json(position);
});

contactsRouter.delete("/position-history/:id", async (req, res) => {
  const position = await contacts.removePositionHistory(req.params.id);
  if (!position) {
    res.status(404).json({ error: "Position history entry not found" });
    return;
  }
  res.json(position);
});

contactsRouter.get("/contacts/:id/connections", async (req, res) => {
  const connections = await contactConnections.findForContact(req.params.id);
  res.json(connections);
});

contactsRouter.get("/contacts/:id/warm-intro", async (req, res) => {
  const paths = await contactConnections.findWarmIntroPath(req.params.id);
  res.json(paths);
});

export const contactConnectionsRouter = Router();

contactConnectionsRouter.post("/contact-connections", async (req, res) => {
  const connection = await contactConnections.create(req.body);
  res.status(201).json(connection);
});

contactConnectionsRouter.delete("/contact-connections/:id", async (req, res) => {
  const connection = await contactConnections.remove(req.params.id);
  if (!connection) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  res.json(connection);
});

export const firmColleaguesRouter = Router();

firmColleaguesRouter.get("/firm-colleagues", async (_req, res) => {
  const results = await firmColleagues.findAll();
  res.json(results);
});

firmColleaguesRouter.post("/firm-colleagues", async (req, res) => {
  const colleague = await firmColleagues.create(req.body);
  res.status(201).json(colleague);
});
