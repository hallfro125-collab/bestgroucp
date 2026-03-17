import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const KV_KEY = "vip_videos";
const ADMIN_TOKEN = "Almanegra";
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "videos.json";
const GITHUB_BRANCH = "main";

export type VideoEntry = {
  id: string;
  url: string;
  addedAt: string;
};

type VideoDB = { videos: VideoEntry[] };

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

async function getVideoDB(): Promise<VideoDB> {
  const data = await kvGet(KV_KEY) as VideoDB | null;
  if (!data || !Array.isArray(data.videos)) return { videos: [] };
  return data;
}

// ── GitHub push ─────────────────────────────────────────────────────────────

async function pushToGitHub(db: VideoDB): Promise<void> {
  const connectors = new ReplitConnectors();
  let sha: string | undefined;
  try {
    const getRes = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, { method: "GET" });
    if (getRes.ok) {
      const data = await getRes.json() as { sha?: string };
      sha = data.sha;
    }
  } catch { /* file may not exist yet */ }

  const content = Buffer.from(JSON.stringify(db, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "chore: update videos",
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
  console.log("[videos] videos.json pushed to GitHub ✓");
}

// ── Routes ─────────────────────────────────────────────────────────────────

router.get("/videos", async (_req, res) => {
  try {
    const db = await getVideoDB();
    res.json(db.videos);
  } catch (err) {
    console.error("GET /videos error:", err);
    res.status(500).json({ error: "Failed to load videos" });
  }
});

router.post("/videos", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    const db = await getVideoDB();
    const entry: VideoEntry = {
      id: Date.now().toString(),
      url: url.trim(),
      addedAt: new Date().toISOString(),
    };
    db.videos.unshift(entry);

    await kvSet(KV_KEY, db);
    res.json({ ok: true, video: entry });

    pushToGitHub(db).catch((err) =>
      console.error("[videos] GitHub push failed:", err)
    );
  } catch (err) {
    console.error("POST /videos error:", err);
    res.status(500).json({ error: "Failed to save video" });
  }
});

router.delete("/videos/:id", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const db = await getVideoDB();
    db.videos = db.videos.filter((v) => v.id !== req.params["id"]);
    await kvSet(KV_KEY, db);
    res.json({ ok: true });
    pushToGitHub(db).catch((err) =>
      console.error("[videos] GitHub push failed:", err)
    );
  } catch (err) {
    console.error("DELETE /videos error:", err);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

export default router;
