import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const GITHUB_REPO = "hallfro125-collab/bestgroucp";
const GITHUB_FILE = "comments.json";
const GITHUB_BRANCH = "main";

export type CommentEntry = {
  id: string;
  name: string;
  text: string;
  flag: string;
  initials: string;
  color: string;
  lang: string;
  likes: number;
  createdAt: string;
  isUser: true;
};

async function getCommentsFromGitHub(): Promise<{ content: CommentEntry[]; sha: string | null }> {
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

async function saveCommentsToGitHub(comments: CommentEntry[], sha: string | null): Promise<void> {
  const connectors = new ReplitConnectors();
  const body: Record<string, unknown> = {
    message: "chore: update comments",
    content: Buffer.from(JSON.stringify(comments, null, 2)).toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await connectors.proxy("github", `/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} ${err}`);
  }
}

// GET /api/comments
router.get("/comments", async (_req, res) => {
  try {
    const { content } = await getCommentsFromGitHub();
    res.json(content);
  } catch (e) {
    console.error("GET comments error:", e);
    res.json([]);
  }
});

// POST /api/comments
router.post("/comments", async (req, res) => {
  try {
    const { name, text, flag, initials, color, lang } = req.body || {};
    if (!name || !text) return res.status(400).json({ error: "name and text are required" });

    const comment: CommentEntry = {
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

    const { content, sha } = await getCommentsFromGitHub();
    const updated = [comment, ...content].slice(0, 100);
    await saveCommentsToGitHub(updated, sha);

    res.status(201).json(comment);
  } catch (e) {
    console.error("POST comments error:", e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;
