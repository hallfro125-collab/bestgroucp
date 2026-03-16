export type Visitor = {
  id: string;
  timestamp: number;
  country: string;
  countryCode: string;
  city: string;
  flag: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  language: string;
  referrer: string;
  ctaClicked: boolean;
  paymentClicked: boolean;
};

const VISITORS_KEY = "vip_visitors";
const SESSION_KEY = "vip_session_id";

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const offset = 127397;
  return (
    String.fromCodePoint(code.toUpperCase().charCodeAt(0) + offset) +
    String.fromCodePoint(code.toUpperCase().charCodeAt(1) + offset)
  );
}

export function getDevice(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Edge";
  if (/opr|opera/i.test(ua)) return "Opera";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Outro";
}

export function getOS(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Outro";
}

export function loadVisitors(): Visitor[] {
  try {
    const raw = localStorage.getItem(VISITORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVisitor(v: Visitor): void {
  const visitors = loadVisitors();
  visitors.push(v);
  localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
}

export function updateVisitor(id: string, updates: Partial<Visitor>): void {
  const visitors = loadVisitors();
  const idx = visitors.findIndex((v) => v.id === id);
  if (idx !== -1) {
    visitors[idx] = { ...visitors[idx], ...updates };
    localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
  }
}

export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  sessionStorage.setItem(SESSION_KEY, id);
}

export function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function trackVisitor(): Promise<string | null> {
  const existingId = getSessionId();
  if (existingId) return existingId;

  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  setSessionId(id);

  const visitor: Visitor = {
    id,
    timestamp: Date.now(),
    country: "Desconhecido",
    countryCode: "",
    city: "—",
    flag: "🌍",
    ip: "—",
    device: getDevice(),
    browser: getBrowser(),
    os: getOS(),
    language: navigator.language || "—",
    referrer: document.referrer || "Direto",
    ctaClicked: false,
    paymentClicked: false,
  };

  saveVisitor(visitor);

  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      updateVisitor(id, {
        country: data.country_name || "Desconhecido",
        countryCode: data.country_code || "",
        city: data.city || "—",
        flag: data.country_code ? countryFlag(data.country_code) : "🌍",
        ip: data.ip || "—",
      });
    }
  } catch {
    // geo lookup failed silently
  }

  return id;
}
