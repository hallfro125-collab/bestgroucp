const ADMIN_TOKEN = "Almanegra";
const REPLIT_API = "https://e6651bee-47d4-47f2-b154-0682122dae11-00-2wdy8w90axqbo.kirk.replit.dev/api";
const GITHUB_VIDEOS_API = "https://api.github.com/repos/hallfro125-collab/bestgroucp/contents/videos.json";

export type VideoEntry = {
  id: string;
  url: string;
  addedAt: string;
};

function isReplitEnv(): boolean {
  if (import.meta.env.VITE_API_URL) return false;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return host === "localhost" || host.includes("replit.dev") || host.includes("replit.app");
}

function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  return isReplitEnv() ? "/api" : REPLIT_API;
}

/**
 * Fetch all videos.
 * On Vercel: reads from GitHub (no CDN cache, always fresh).
 * On Replit: reads from local API server.
 * Falls back to Replit API if GitHub fails.
 */
export async function fetchVideos(): Promise<VideoEntry[]> {
  const onReplit = isReplitEnv();

  if (!onReplit) {
    try {
      const res = await fetch(GITHUB_VIDEOS_API, {
        cache: "no-store",
        headers: { "Accept": "application/vnd.github.v3+json" },
      });
      if (res.ok) {
        const meta = await res.json() as { content?: string };
        if (meta.content) {
          const decoded = atob(meta.content.replace(/\n/g, ""));
          const db = JSON.parse(decoded) as { videos?: VideoEntry[] };
          return Array.isArray(db.videos) ? db.videos : [];
        }
      }
    } catch {
      // fall through to API fallback
    }
  }

  try {
    const API_BASE = resolveApiBase();
    const res = await fetch(`${API_BASE}/videos`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Returns the latest video URL, or null if none.
 */
export async function fetchLatestVideoUrl(): Promise<string | null> {
  const videos = await fetchVideos();
  return videos.length > 0 ? videos[0].url : null;
}

/**
 * Add a new video. Always writes through Replit API (admin action).
 */
export async function addVideo(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const API_BASE = resolveApiBase();
    const res = await fetch(`${API_BASE}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Delete a video by id.
 */
export async function deleteVideo(id: string): Promise<boolean> {
  try {
    const API_BASE = resolveApiBase();
    const res = await fetch(`${API_BASE}/videos/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": ADMIN_TOKEN },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Detect video type from URL.
 */
export function getVideoType(url: string): "youtube" | "vimeo" | "mp4" | "unknown" {
  if (!url) return "unknown";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/\.mp4|catbox\.moe|\.webm|\.mov/.test(url) || url.startsWith("data:video")) return "mp4";
  return "unknown";
}

/**
 * Build an embed URL for YouTube or Vimeo.
 */
export function buildEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}`;
  if (url.includes("youtube.com/embed/")) return url + (url.includes("?") ? "&" : "?") + "autoplay=1&mute=1";
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&muted=1&loop=1`;
  return null;
}
