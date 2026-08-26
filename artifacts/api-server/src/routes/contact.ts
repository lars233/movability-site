import { Router, type Request, type Response } from "express";
import { getDb } from "../lib/cms-db";

const router = Router();

router.post("/contact", (req: Request, res: Response): void => {
  const b = req.body as Record<string, unknown>;
  const name = String(b["name"] ?? "").trim();
  const email = String(b["email"] ?? "").trim();
  const company = String(b["company"] ?? "").trim();
  const country = String(b["country"] ?? "").trim();
  const industry = String(b["industry"] ?? "").trim();
  const primary_objective = String(b["primary_objective"] ?? "").trim();
  const project_overview = String(b["project_overview"] ?? "").trim();

  if (!name || !email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO contact_submissions (name, email, company, country, industry, primary_objective, project_overview)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, company, country, industry, primary_objective, project_overview);

    res.status(201).json({ ok: true, id: result.lastInsertRowid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
