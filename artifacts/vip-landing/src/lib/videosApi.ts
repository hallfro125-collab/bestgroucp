const ADMIN_TOKEN = "Almanegra";

export type VideoEntry = {
  id: string;
  url: string;
  addedAt: string;
};

/**
 * Resolve the API base URL.
 * - On Vercel:  uses relative "/api" → hits Vercel serverless functions.
 * - On Replit dev: uses "/api" → proxied to local Express server via vite.
 * - If VITE_API_URL is set explicitly, use that.
 */
function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  return "/api";
}

/**
 * Fetch all videos.
 * Always uses the API (Vercel serverless or Replit Express).
 */
export async function fetchVideos(): Promise<VideoEntry[]> {
  try {
    const res = await fetch(`${resolveApiBase()}/videos`, {
      cache: "no-store",
    });
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
 * Add a new video.
 */
export async function addVideo(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${resolveApiBase()}/videos`, {
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
    const res = await fetch(`${resolveApiBase()}/videos/${id}`, {
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
 * Returns null for direct video files.
 */
export function buildEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${yt[1]}`;
  if (url.includes("youtube.com/embed/")) return url + (url.includes("?") ? "&" : "?") + "autoplay=1&mute=1&playsinline=1";
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&muted=1&playsinline=1&loop=1`;
  return null;
}
