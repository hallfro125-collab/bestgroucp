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

export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  sessionStorage.setItem(SESSION_KEY, id);
}

/** Load all visitors from the server (admin only). */
export async function fetchRemoteVisitors(): Promise<Visitor[]> {
  try {
    const res = await fetch("/api/visitors", {
      headers: { "x-admin-token": "Almanegra" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Track a new visitor — saves to server, enriches with geo. */
export async function trackVisitor(): Promise<string | null> {
  const existingId = getSessionId();
  if (existingId) return existingId;

  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  setSessionId(id);

  const visitor = {
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

  // Fire-and-forget: save to server
  fetch("/api/visitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visitor),
  }).catch(() => {});

  // Enrich with geo (async, update after)
  fetch("https://ipapi.co/json/")
    .then((r) => r.json())
    .then((data) => {
      if (!data || data.error) return;
      const geo = {
        country: data.country_name || "Desconhecido",
        countryCode: data.country_code || "",
        city: data.city || "—",
        flag: data.country_code ? countryFlag(data.country_code) : "🌍",
        ip: data.ip || "—",
      };
      fetch(`/api/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geo),
      }).catch(() => {});
    })
    .catch(() => {});

  return id;
}

/** Update visitor fields on server (ctaClicked, paymentClicked, etc.) */
export async function updateVisitor(id: string, updates: Partial<Visitor>): Promise<void> {
  if (!id) return;
  try {
    await fetch(`/api/visitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch {
    // silent fail — never block the user
  }
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
