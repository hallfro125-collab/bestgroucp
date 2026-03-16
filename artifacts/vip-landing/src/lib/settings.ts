export type Proof = {
  id: string;
  dataUrl: string;
  caption: string;
};

export type AppSettings = {
  currency: string;
  price: string;
  originalPrice: string;
  ctaText: string;
  headline: string;
  subheadline: string;
  bonusText: string;
  timerMinutes: string;
  timerSeconds: string;
  viewersCount: string;
  videoUrl: string;
  paymentUrl: string;
  paymentButtonText: string;
  modalTitle: string;
  modalBody: string;
  modalStep1: string;
  modalStep2: string;
  modalStep3: string;
  telegramLink: string;
  telegramButtonText: string;
  telegramAutoMessage: string;
  proofs: Proof[];
  primaryColor: string;
  accentColor: string;
  bgColor: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "R$",
  price: "297",
  originalPrice: "997",
  ctaText: "GET VIP ACCESS NOW",
  headline: "Access exclusive content in the VIP Group",
  subheadline: "Join the VIP group, now with lifetime access",
  bonusText: "More than 10 exclusive bonus packages",
  timerMinutes: "4",
  timerSeconds: "45",
  viewersCount: "173",
  videoUrl: "",
  paymentUrl: "",
  paymentButtonText: "Realizar Pagamento Agora",
  modalTitle: "",
  modalBody: "",
  modalStep1: "",
  modalStep2: "",
  modalStep3: "",
  telegramLink: "https://t.me/seugrupo",
  telegramButtonText: "Entrar no Grupo VIP (Telegram)",
  telegramAutoMessage: "Olá! Acabei de comprar o acesso VIP e quero entrar no grupo.",
  proofs: [],
  primaryColor: "#dc2626",
  accentColor: "#9333ea",
  bgColor: "#ffffff",
};

export let sessionVideoObjectUrl: string | null = null;
export function setSessionVideoObjectUrl(url: string | null) {
  if (sessionVideoObjectUrl) URL.revokeObjectURL(sessionVideoObjectUrl);
  sessionVideoObjectUrl = url;
}

const KEY = "vip_app_settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
