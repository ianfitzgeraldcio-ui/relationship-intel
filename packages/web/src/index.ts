import express from "express";
import session from "express-session";
import { runMigrations } from "../../db/src/index.js";
import { authRouter, requireAuth } from "./auth.js";
import { organizationsRouter } from "./routes/organizations.js";
import { contactsRouter, contactConnectionsRouter, firmColleaguesRouter } from "./routes/contacts.js";
import { relationshipsRouter } from "./routes/relationships.js";
import { interactionsRouter } from "./routes/interactions.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { reportsRouter } from "./routes/reports.js";

async function main() {
  console.log("Relationship Intelligence Web UX v0.1.0");

  try {
    await runMigrations();
    console.log("Database schema is up to date");
  } catch (err) {
    console.error("Failed to run database migrations:", err);
    process.exit(1);
  }

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-only-insecure-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  app.get("/healthz", (_req, res) => {
    res.status(200).send("ok");
  });

  app.use("/api", authRouter);

  const apiRouter = express.Router();
  apiRouter.use(requireAuth);
  apiRouter.use(organizationsRouter);
  apiRouter.use(contactsRouter);
  apiRouter.use(contactConnectionsRouter);
  apiRouter.use(firmColleaguesRouter);
  apiRouter.use(relationshipsRouter);
  apiRouter.use(interactionsRouter);
  apiRouter.use(opportunitiesRouter);
  apiRouter.use(reportsRouter);
  app.use("/api", apiRouter);

  // Stage 1: no frontend build yet. Replaced with the built React app's
  // static files + SPA fallback in Stage 2.
  app.get("/", (_req, res) => {
    res.send("Relationship Intel web backend is running. Frontend arrives in Stage 2.");
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
