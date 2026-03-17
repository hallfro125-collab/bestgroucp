// Vercel Serverless Function: /api/videos/:id
// DELETE – remove a video by id from videos.json (requires GITHUB_TOKEN + x-admin-token)

const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "videos.json";
const ADMIN_TOKEN = "Almanegra";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
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

  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
  if (!GITHUB_TOKEN) {
    res.status(500).json({
      error:
        "GITHUB_TOKEN is not set. Add it in Vercel → Project Settings → Environment Variables.",
    });
    return;
  }

  try {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }
    const { videos, sha } = await readGitHub(GITHUB_TOKEN);
    const filtered = videos.filter((v) => v.id !== id);
    await writeGitHub(GITHUB_TOKEN, filtered, sha);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/videos/:id error:", err);
    res.status(500).json({ error: String(err) });
  }
};
