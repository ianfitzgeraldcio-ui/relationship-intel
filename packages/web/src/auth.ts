import type { Request, Response, NextFunction } from "express";
import { Router } from "express";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: "Not authenticated" });
}

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const expected = process.env.WEB_AUTH_PASSWORD;
  const { password } = req.body ?? {};
  if (!expected || typeof password !== "string" || password !== expected) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  req.session.authenticated = true;
  res.json({ success: true });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

authRouter.get("/session", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});
