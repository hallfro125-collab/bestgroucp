const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "comments.json";
const GITHUB_API = "https://api.github.com";

async function getFileFromGitHub() {
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (res.status === 404) return { content: [], sha: null };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"));
  return { content: decoded, sha: data.sha };
}

async function saveFileToGitHub(content, sha, message) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const body = {
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    branch: "main",
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} ${err}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const { content } = await getFileFromGitHub();
      return res.status(200).json(Array.isArray(content) ? content : []);
    } catch (e) {
      console.error("GET comments error:", e.message);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
      }

      const { name, text, flag, initials, color, lang } = body || {};
      if (!name || !text) return res.status(400).json({ error: "name and text are required" });

      const comment = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: String(name).slice(0, 50),
        text: String(text).slice(0, 500),
        flag: flag || "🌍",
        initials: String(initials || name.slice(0, 2)).toUpperCase().slice(0, 2),
        color: color || "#6366f1",
        lang: lang || "en",
        likes: 0,
        createdAt: new Date().toISOString(),
        isUser: true,
      };

      const { content, sha } = await getFileFromGitHub();
      const comments = Array.isArray(content) ? content : [];
      const updated = [comment, ...comments].slice(0, 100);
      await saveFileToGitHub(updated, sha, `chore: add visitor comment from ${comment.name}`);

      return res.status(201).json(comment);
    } catch (e) {
      console.error("POST comments error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
