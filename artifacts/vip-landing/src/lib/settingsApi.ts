import { AppSettings, DEFAULT_SETTINGS, SETTINGS_KEY } from "./settings";

const ADMIN_TOKEN = "Almanegra";
const REPLIT_API = "https://e6651bee-47d4-47f2-b154-0682122dae11-00-2wdy8w90axqbo.kirk.replit.dev/api";
const GITHUB_RAW = "https://raw.githubusercontent.com/hallfro125-collab/bestgroucp/main/settings.json";

function isReplitEnv(): boolean {
  if (import.meta.env.VITE_API_URL) return false;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return host === "localhost" || host.includes("replit.dev") || host.includes("replit.app");
}

function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  return isReplitEnv() ? "/api" : REPLIT_API;
}

export async function fetchRemoteSettings(): Promise<AppSettings | null> {
  const onReplit = isReplitEnv();

  if (!onReplit) {
    try {
      const url = `${GITHUB_RAW}?t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          return { ...DEFAULT_SETTINGS, ...data } as AppSettings;
        }
      }
    } catch {
      // fall through to API fallback
    }
  }

  try {
    const API_BASE = resolveApiBase();
    const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) return null;
    return { ...DEFAULT_SETTINGS, ...data } as AppSettings;
  } catch {
    return null;
  }
}

export async function saveRemoteSettings(settings: AppSettings): Promise<boolean> {
  try {
    const API_BASE = resolveApiBase();
    const url = `${API_BASE}/settings`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN,
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      console.error(`[settingsApi] POST ${url} → ${res.status} ${res.statusText}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[settingsApi] saveRemoteSettings network error:", err);
    return false;
  }
}

export function loadLocalSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveLocalSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
