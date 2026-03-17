import { Router, type IRouter, type Request, type Response } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const ADMIN_TOKEN = "Almanegra";
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "visitors.json";
const GITHUB_BRANCH = "main";
const MAX_VISITORS = 500;

export type VisitorEntry = {
  id: string;
  timestamp: number;
  country: string;
  countryCode: string;
  city: string;
  flag: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  language: string;
  referrer: string;
  ctaClicked: boolean;
  paymentClicked: boolean;
};

async function getVisitors(): Promise<{ content: VisitorEntry[]; sha: string | null }> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (res.status === 404) return { content: [], sha: null };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"));
  return { content: Array.isArray(decoded) ? decoded : [], sha: data.sha };
}

async function saveVisitors(visitors: VisitorEntry[], sha: string | null, message: string): Promise<void> {
  const connectors = new ReplitConnectors();
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(JSON.stringify(visitors, null, 2)).toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
}

// GET /api/visitors — admin only
router.get("/api/visitors", async (req: Request, res: Response) => {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { content } = await getVisitors();
    return res.json(content);
  } catch (e) {
    console.error("GET visitors error:", e);
    return res.json([]);
  }
});

// POST /api/visitors — public (landing page)
router.post("/api/visitors", async (req: Request, res: Response) => {
  try {
    const { id, timestamp, country, countryCode, city, flag, ip, device, browser, os, language, referrer } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });

    const visitor: VisitorEntry = {
      id: String(id).slice(0, 64),
      timestamp: timestamp || Date.now(),
      country: country || "Desconhecido",
      countryCode: countryCode || "",
      city: city || "—",
      flag: flag || "🌍",
      ip: ip || "—",
      device: device || "Desktop",
      browser: browser || "Outro",
      os: os || "Outro",
      language: language || "—",
      referrer: referrer || "Direto",
      ctaClicked: false,
      paymentClicked: false,
    };

    const { content, sha } = await getVisitors();
    if (content.some(v => v.id === visitor.id)) return res.status(200).json(visitor);
    const updated = [visitor, ...content].slice(0, MAX_VISITORS);
    await saveVisitors(updated, sha, `chore: new visitor ${visitor.id.slice(0, 8)}`);
    return res.status(201).json(visitor);
  } catch (e) {
    console.error("POST visitor error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// PATCH /api/visitors/:id — public (update ctaClicked, paymentClicked, geo)
router.patch("/api/visitors/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { content, sha } = await getVisitors();
    const idx = content.findIndex(v => v.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    const allowed: (keyof VisitorEntry)[] = ["ctaClicked", "paymentClicked", "country", "countryCode", "city", "flag", "ip"];
    for (const key of allowed) {
      if ((req.body as Record<string, unknown>)[key] !== undefined) {
        (content[idx] as Record<string, unknown>)[key] = (req.body as Record<string, unknown>)[key];
      }
    }

    await saveVisitors(content, sha, `chore: update visitor ${id.slice(0, 8)}`);
    return res.json(content[idx]);
  } catch (e) {
    console.error("PATCH visitor error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
