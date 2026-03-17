// Vercel Serverless Function: /api/videos
// GET  – return all videos from videos.json (public GitHub read, no token needed)
// POST – add a new video to videos.json (requires GITHUB_TOKEN + x-admin-token)

const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "videos.json";
const ADMIN_TOKEN = "Almanegra";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
}

async function readGitHub(token) {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
    { headers }
  );
  if (res.status === 404) return { videos: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(
    Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")
  );
  return { videos: decoded.videos || [], sha: data.sha };
}

async function writeGitHub(token, videos, sha) {
  const content = Buffer.from(
    JSON.stringify({ videos }, null, 2)
  ).toString("base64");
  const body = { message: "chore: update videos", content, branch: "main" };
  if (sha) body.sha = sha;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${res.status} – ${err.slice(0, 300)}`);
  }
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

  // ── GET ─────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { videos } = await readGitHub(GITHUB_TOKEN);
      res.status(200).json(videos);
    } catch (err) {
      console.error("GET /api/videos error:", err);
      res.status(500).json({ error: String(err) });
    }
    return;
  }

  // ── POST ────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!GITHUB_TOKEN) {
      res.status(500).json({
        error:
          "GITHUB_TOKEN is not set. Add it in Vercel → Project Settings → Environment Variables.",
      });
      return;
    }
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== "string" || !url.trim()) {
        res.status(400).json({ error: "url is required" });
        return;
      }
      const { videos, sha } = await readGitHub(GITHUB_TOKEN);
      const entry = {
        id: Date.now().toString(),
        url: url.trim(),
        addedAt: new Date().toISOString(),
      };
      videos.unshift(entry);
      await writeGitHub(GITHUB_TOKEN, videos, sha);
      res.status(200).json({ ok: true, video: entry });
    } catch (err) {
      console.error("POST /api/videos error:", err);
      res.status(500).json({ error: String(err) });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
