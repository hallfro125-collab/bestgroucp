import { AppSettings, DEFAULT_SETTINGS, SETTINGS_KEY } from "./settings";

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "/api";
const ADMIN_TOKEN = "Almanegra";

export async function fetchRemoteSettings(): Promise<AppSettings | null> {
  try {
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
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN,
      },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
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
