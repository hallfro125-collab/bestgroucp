import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const KV_KEY = "vip_settings";
const ADMIN_TOKEN = "Almanegra";
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_SETTINGS_FILE = "settings.json";
const GITHUB_BRANCH = "main";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

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

async function githubGetSha(connectors: ReplitConnectors, path: string): Promise<string | undefined> {
  const res = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${path}`, { method: "GET" });
  if (res.ok) {
    const data = await res.json() as { sha?: string };
    return data.sha;
  }
  return undefined;
}

async function githubPutFile(
  connectors: ReplitConnectors,
  path: string,
  contentBase64: string,
  message: string,
): Promise<string> {
  const sha = await githubGetSha(connectors, path);
  const body: Record<string, unknown> = { message, content: contentBase64, branch: GITHUB_BRANCH };
  if (sha) body["sha"] = sha;

  const res = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub put ${path} failed: ${res.status} - ${err.slice(0, 200)}`);
  }

  return `${GITHUB_RAW_BASE}/${path}`;
}

function dataUriToBase64(dataUri: string): { base64: string; ext: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error("Invalid data URI");
  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return { base64, ext };
}

async function uploadBase64ToGitHub(
  connectors: ReplitConnectors,
  dataUri: string,
  path: string,
): Promise<string> {
  const { base64, ext } = dataUriToBase64(dataUri);
  const fullPath = path.endsWith(`.${ext}`) ? path : `${path}.${ext}`;
  return githubPutFile(connectors, fullPath, base64, `chore: upload asset ${fullPath}`);
}

async function processAndPushSettings(settings: Record<string, unknown>): Promise<void> {
  const connectors = new ReplitConnectors();
  const processed = { ...settings };

  // Upload video if it's a data URI
  if (typeof processed["videoUrl"] === "string" && processed["videoUrl"].startsWith("data:")) {
    try {
      const url = await uploadBase64ToGitHub(connectors, processed["videoUrl"], "assets/gallery-video");
      processed["videoUrl"] = url;
      console.log("[settings] Video uploaded to GitHub:", url);
    } catch (err) {
      console.error("[settings] Failed to upload video to GitHub:", err);
      processed["videoUrl"] = "";
    }
  }

  // Upload proof images if they are data URIs
  if (Array.isArray(processed["proofs"])) {
    const proofs = processed["proofs"] as Array<Record<string, unknown>>;
    processed["proofs"] = await Promise.all(
      proofs.map(async (proof, i) => {
        if (typeof proof["image"] === "string" && proof["image"].startsWith("data:")) {
          try {
            const url = await uploadBase64ToGitHub(connectors, proof["image"], `assets/proof-${i}`);
            console.log(`[settings] Proof ${i} uploaded to GitHub:`, url);
            return { ...proof, image: url };
          } catch (err) {
            console.error(`[settings] Failed to upload proof ${i} to GitHub:`, err);
            return { ...proof, image: "" };
          }
        }
        return proof;
      })
    );
  }

  // Update KV with processed settings (using GitHub raw URLs instead of data URIs)
  await kvSet(KV_KEY, processed);

  // Push settings.json to GitHub
  const jsonBase64 = Buffer.from(JSON.stringify(processed, null, 2)).toString("base64");
  await githubPutFile(connectors, GITHUB_SETTINGS_FILE, jsonBase64, "chore: update vip settings");
  console.log("[settings] settings.json pushed to GitHub");
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
    // Save to KV immediately for fast response
    await kvSet(KV_KEY, req.body);
    res.json({ ok: true });

    // Then asynchronously process and push to GitHub (may take a few seconds)
    processAndPushSettings(req.body).catch((err) =>
      console.error("[settings] Background GitHub push failed:", err)
    );
  } catch (err) {
    console.error("POST /settings error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
