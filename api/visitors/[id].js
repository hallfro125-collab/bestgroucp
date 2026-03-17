const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "visitors.json";
const GITHUB_API = "https://api.github.com";

async function getFile() {
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (res.status === 404) return { content: [], sha: null };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"));
  return { content: Array.isArray(decoded) ? decoded : [], sha: data.sha };
}

async function saveFile(content, sha, message) {
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
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "PATCH") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id required" });

    try {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
      }

      const { content, sha } = await getFile();
      const idx = content.findIndex(v => v.id === id);
      if (idx === -1) return res.status(404).json({ error: "Visitor not found" });

      const allowed = ["ctaClicked", "paymentClicked", "country", "countryCode", "city", "flag", "ip"];
      for (const key of allowed) {
        if (body[key] !== undefined) content[idx][key] = body[key];
      }

      await saveFile(content, sha, `chore: update visitor ${String(id).slice(0, 8)}`);
      return res.status(200).json(content[idx]);
    } catch (e) {
      console.error("PATCH visitor error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
