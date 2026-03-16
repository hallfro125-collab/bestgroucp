import { Router, type IRouter } from "express";

const router: IRouter = Router();
const KV_KEY = "vip_settings";
const ADMIN_TOKEN = "Almanegra";

async function kvGet(key: string): Promise<unknown | null> {
  const dbUrl = process.env["REPLIT_DB_URL"];
  if (!dbUrl) return null;
  const res = await fetch(`${dbUrl}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  const text = await res.text();
  try {
    return JSON.parse(decodeURIComponent(text));
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const dbUrl = process.env["REPLIT_DB_URL"];
  if (!dbUrl) throw new Error("REPLIT_DB_URL not set");
  const body = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
  await fetch(dbUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await kvGet(KV_KEY);
    res.json(settings ?? {});
  } catch (err) {
    console.error("GET /settings error:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.post("/settings", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await kvSet(KV_KEY, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /settings error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
