import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const KV_KEY = "vip_settings";
const ADMIN_TOKEN = "Almanegra";
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_BRANCH = "main";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const GITHUB_API = "https://api.github.com";

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

// ── GitHub helpers (direct API, no proxy size limit) ───────────────────────

async function getGitHubToken(): Promise<string> {
  const connectors = new ReplitConnectors();
  const connections = await connectors.listConnections({ connector_names: "github", refresh_policy: "stale" });
  const github = connections.find((c: Record<string, unknown>) => {
    const settings = c["settings"] as Record<string, unknown> | undefined;
    return settings && typeof settings["access_token"] === "string";
  });
  if (!github) throw new Error("GitHub connection not found");
  return ((github["settings"] as Record<string, unknown>)["access_token"]) as string;
}

async function ghFetch(token: string, path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

async function githubGetSha(token: string, filePath: string): Promise<string | undefined> {
  const res = await ghFetch(token, `/repos/${GITHUB_REPO}/contents/${filePath}`);
  if (res.ok) {
    const data = await res.json() as { sha?: string };
    return data.sha;
  }
  return undefined;
}

// Push a file to GitHub using contents API (works for files up to ~100MB)
async function githubPutFile(
  token: string,
  filePath: string,
  contentBase64: string,
  message: string,
): Promise<string> {
  const sha = await githubGetSha(token, filePath);
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  };
  if (sha) body["sha"] = sha;

  const res = await ghFetch(token, `/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT ${filePath} failed: ${res.status} - ${err.slice(0, 300)}`);
  }

  return `${GITHUB_RAW_BASE}/${filePath}?t=${Date.now()}`;
}

// Push a LARGE file using Git Data API (blob → tree → commit → ref)
async function githubPutLargeFile(
  token: string,
  filePath: string,
  contentBase64: string,
  message: string,
): Promise<string> {
  // 1. Create blob
  const blobRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: contentBase64, encoding: "base64" }),
  });
  if (!blobRes.ok) {
    const err = await blobRes.text();
    throw new Error(`GitHub blob creation failed: ${blobRes.status} - ${err.slice(0, 200)}`);
  }
  const { sha: blobSha } = await blobRes.json() as { sha: string };

  // 2. Get current ref
  const refRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`);
  if (!refRes.ok) throw new Error(`GitHub get ref failed: ${refRes.status}`);
  const { object: { sha: commitSha } } = await refRes.json() as { object: { sha: string } };

  // 3. Get current tree
  const commitRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/commits/${commitSha}`);
  if (!commitRes.ok) throw new Error(`GitHub get commit failed: ${commitRes.status}`);
  const { tree: { sha: treeSha } } = await commitRes.json() as { tree: { sha: string } };

  // 4. Create new tree
  const treeRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: treeSha,
      tree: [{ path: filePath, mode: "100644", type: "blob", sha: blobSha }],
    }),
  });
  if (!treeRes.ok) throw new Error(`GitHub create tree failed: ${treeRes.status}`);
  const { sha: newTreeSha } = await treeRes.json() as { sha: string };

  // 5. Create commit
  const newCommitRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTreeSha, parents: [commitSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`GitHub create commit failed: ${newCommitRes.status}`);
  const { sha: newCommitSha } = await newCommitRes.json() as { sha: string };

  // 6. Update ref
  const updateRes = await ghFetch(token, `/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommitSha }),
  });
  if (!updateRes.ok) throw new Error(`GitHub update ref failed: ${updateRes.status}`);

  return `${GITHUB_RAW_BASE}/${filePath}?t=${Date.now()}`;
}

function dataUriToBase64(dataUri: string): { base64: string; ext: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error("Invalid data URI");
  const mime = match[1];
  const base64 = match[2];
  const extMap: Record<string, string> = { "jpeg": "jpg", "quicktime": "mov" };
  const rawExt = mime.split("/")[1] ?? "bin";
  const ext = extMap[rawExt] ?? rawExt;
  return { base64, ext };
}

async function uploadAsset(
  token: string,
  dataUri: string,
  pathWithoutExt: string,
): Promise<string> {
  const { base64, ext } = dataUriToBase64(dataUri);
  const filePath = `${pathWithoutExt}.${ext}`;

  // Files > 500KB use the Git Data API to avoid size limits
  const sizeBytes = Math.ceil(base64.length * 0.75);
  const useLargeApi = sizeBytes > 500_000;

  console.log(`[settings] Uploading ${filePath} (${Math.round(sizeBytes / 1024)}KB, method=${useLargeApi ? "git-data" : "contents"})`);

  if (useLargeApi) {
    return githubPutLargeFile(token, filePath, base64, `chore: upload asset ${filePath}`);
  } else {
    return githubPutFile(token, filePath, base64, `chore: upload asset ${filePath}`);
  }
}

async function processAndPushSettings(settings: Record<string, unknown>): Promise<void> {
  let token: string;
  try {
    token = await getGitHubToken();
  } catch (err) {
    console.error("[settings] Cannot get GitHub token:", err);
    return;
  }

  const processed = { ...settings };

  // Upload video if it's a data URI
  if (typeof processed["videoUrl"] === "string" && processed["videoUrl"].startsWith("data:")) {
    try {
      const url = await uploadAsset(token, processed["videoUrl"], "assets/gallery-video");
      processed["videoUrl"] = url;
      console.log("[settings] Video uploaded to GitHub:", url.slice(0, 80));
    } catch (err) {
      console.error("[settings] Failed to upload video to GitHub:", err);
      // Keep the original data URI in KV only; GitHub gets empty
      processed["videoUrl"] = processed["videoUrl"]; // keep for KV
    }
  }

  // Upload proof images if they are data URIs
  if (Array.isArray(processed["proofs"])) {
    const proofs = processed["proofs"] as Array<Record<string, unknown>>;
    processed["proofs"] = await Promise.all(
      proofs.map(async (proof, i) => {
        if (typeof proof["image"] === "string" && proof["image"].startsWith("data:")) {
          try {
            const url = await uploadAsset(token, proof["image"], `assets/proof-${i}`);
            console.log(`[settings] Proof ${i} uploaded to GitHub:`, url.slice(0, 80));
            return { ...proof, image: url };
          } catch (err) {
            console.error(`[settings] Failed to upload proof ${i}:`, err);
            return { ...proof, image: "" };
          }
        }
        return proof;
      })
    );
  }

  // Update KV with processed settings (GitHub raw URLs replace data URIs)
  await kvSet(KV_KEY, processed);

  // Push settings.json
  const jsonBase64 = Buffer.from(JSON.stringify(processed, null, 2)).toString("base64");
  await githubPutFile(token, "settings.json", jsonBase64, "chore: update vip settings");
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
    // Save to KV immediately (with original data URIs for the KV store)
    await kvSet(KV_KEY, req.body);
    res.json({ ok: true });

    // Async: upload assets to GitHub and update settings.json
    processAndPushSettings(req.body).catch((err) =>
      console.error("[settings] Background GitHub push failed:", err)
    );
  } catch (err) {
    console.error("POST /settings error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
