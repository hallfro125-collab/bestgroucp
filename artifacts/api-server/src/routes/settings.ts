import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const KV_KEY = "vip_settings";
const ADMIN_TOKEN = "Almanegra";
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "settings.json";
const GITHUB_BRANCH = "main";

// ── KV helpers ─────────────────────────────────────────────────────────────

async function kvGet(key: string): Promise<unknown | null> {
  const dbUrl = process.env["REPLIT_DB_URL"];
  if (!dbUrl) return null;
  const res = await fetch(`${dbUrl}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  const text = await res.text();
  try { return JSON.parse(decodeURIComponent(text)); } catch { return null; }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const dbUrl = process.env["REPLIT_DB_URL"];
  if (!dbUrl) throw new Error("REPLIT_DB_URL not set");
  const body = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
  await fetch(dbUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
}

// ── GitHub push via connectors proxy ─────────────────────────────────────

function stripLargeBase64(settings: Record<string, unknown>): Record<string, unknown> {
  const out = { ...settings };
  // Replace data URI videos with empty string — videos should be URLs (YouTube/Vimeo/Catbox)
  if (typeof out["videoUrl"] === "string" && out["videoUrl"].startsWith("data:")) {
    out["videoUrl"] = "";
  }
  // For proof images: if they're data URIs, try to keep them (small screenshots usually < 500KB)
  // They'll be sent as-is to GitHub. If too large, the proxy returns 413 and we skip.
  return out;
}

async function pushToGitHub(settings: Record<string, unknown>): Promise<void> {
  const connectors = new ReplitConnectors();
  const stripped = stripLargeBase64(settings);

  // Get current file SHA
  let sha: string | undefined;
  try {
    const getRes = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, { method: "GET" });
    if (getRes.ok) {
      const data = await getRes.json() as { sha?: string };
      sha = data.sha;
    }
  } catch { /* file may not exist yet */ }

  const content = Buffer.from(JSON.stringify(stripped, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "chore: update vip settings",
    content,
    branch: GITHUB_BRANCH,
  };
  if (sha) body["sha"] = sha;

  const putRes = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub push failed: ${putRes.status} - ${err.slice(0, 200)}`);
  }
  console.log("[settings] settings.json pushed to GitHub ✓");
}

// ── Routes ─────────────────────────────────────────────────────────────────

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

    // Push to GitHub async (makes settings visible to Vercel visitors)
    pushToGitHub(req.body).catch((err) =>
      console.error("[settings] GitHub push failed:", err)
    );
  } catch (err) {
    console.error("POST /settings error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
