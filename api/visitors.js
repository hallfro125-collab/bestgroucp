const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "visitors.json";
const GITHUB_API = "https://api.github.com";
const ADMIN_TOKEN = "Almanegra";
const MAX_VISITORS = 500;

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — admin only
  if (req.method === "GET") {
    if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { content } = await getFile();
      return res.status(200).json(content);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  // POST — public (landing page creates visitor)
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
      }

      const { id, timestamp, country, countryCode, city, flag, ip, device, browser, os, language, referrer } = body || {};
      if (!id) return res.status(400).json({ error: "id required" });

      const visitor = {
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

      const { content, sha } = await getFile();
      // Avoid duplicates
      if (content.some(v => v.id === visitor.id)) {
        return res.status(200).json(visitor);
      }
      const updated = [visitor, ...content].slice(0, MAX_VISITORS);
      await saveFile(updated, sha, `chore: new visitor ${visitor.id.slice(0, 8)}`);
      return res.status(201).json(visitor);
    } catch (e) {
      console.error("POST visitor error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
