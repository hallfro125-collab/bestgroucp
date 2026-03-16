import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  BarChart2,
  Package,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Save,
  ArrowLeft,
  Palette,
  Image,
  Trash2,
  Plus,
  Send,
  Video,
  Link,
  Upload,
  Lock,
} from "lucide-react";
import { loadSettings, saveSettings, setSessionVideoObjectUrl, type AppSettings, type Proof } from "@/lib/settings";

type Tab = "dashboard" | "product" | "proofs" | "appearance" | "reports";

/* ─── helpers ─── */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${value ? "bg-purple-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const handle = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
        saved ? "bg-green-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
      }`}
    >
      <Save className="w-4 h-4" />
      {saved ? "Salvo com sucesso!" : "Salvar alterações"}
    </button>
  );
}

/* ─── Dashboard ─── */
function Dashboard({ settings }: { settings: AppSettings }) {
  const currency = settings.currency || "R$";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm">Visão geral do desempenho</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: DollarSign, label: "Receita Total", value: `${currency} 48.350`, change: "+12% este mês", color: "bg-green-500" },
          { icon: Users, label: "Membros VIP", value: "1.247", change: "+87 esta semana", color: "bg-purple-500" },
          { icon: ShoppingCart, label: "Vendas Hoje", value: "34", change: "+5 nas últimas 2h", color: "bg-blue-500" },
          { icon: TrendingUp, label: "Conversão", value: "8,4%", change: "+1,2% vs. semana passada", color: "bg-orange-500" },
        ].map(({ icon: Icon, label, value, change, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-green-600 font-medium mt-0.5">{change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Últimas Transações</h3>
        <div className="space-y-2">
          {[
            { name: "Carlos M.", time: "2 min atrás", status: "success" },
            { name: "Ana R.", time: "18 min atrás", status: "success" },
            { name: "Pedro L.", time: "45 min atrás", status: "success" },
            { name: "Julia S.", time: "1h atrás", status: "success" },
            { name: "Marco A.", time: "2h atrás", status: "pending" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{tx.name}</p>
                <p className="text-xs text-gray-400">{tx.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{currency} {settings.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {tx.status === "success" ? "Pago" : "Pendente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Product ─── */
function ProductTab({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  const set = (key: keyof AppSettings, value: string) => onChange({ ...settings, [key]: value });
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [videoMode, setVideoMode] = useState<"url" | "gallery">("url");
  const [localVideoPreview, setLocalVideoPreview] = useState<string | null>(null);

  const CURRENCIES = ["R$", "$", "€", "£", "USDT", "¥", "CHF", "AUD"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Produto</h2>
        <p className="text-gray-500 text-sm">Edite sua oferta e textos da página</p>
      </div>

      {/* Currency + Price */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Preço e Moeda</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Moeda</label>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => set("currency", c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                  settings.currency === c
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço" value={settings.price} onChange={(v) => set("price", v)} placeholder="297" />
          <Field label="Preço Original (riscado)" value={settings.originalPrice} onChange={(v) => set("originalPrice", v)} placeholder="997" />
        </div>
      </div>

      {/* Texts */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Textos da Página</h3>
        <Field label="Título Principal" value={settings.headline} onChange={(v) => set("headline", v)} />
        <Field label="Subtítulo" value={settings.subheadline} onChange={(v) => set("subheadline", v)} />
        <Field label="Texto de Bônus" value={settings.bonusText} onChange={(v) => set("bonusText", v)} />
        <Field label="Texto do Botão Principal (CTA)" value={settings.ctaText} onChange={(v) => set("ctaText", v)} />
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
          💳 Botão de Pagamento (modal)
        </h3>
        <p className="text-xs text-gray-400 -mt-1">Quando o visitante clica no CTA, aparece um modal. Configure o botão de pagamento abaixo.</p>
        <Field
          label="Link de Pagamento"
          value={settings.paymentUrl}
          onChange={(v) => set("paymentUrl", v)}
          placeholder="https://pay.hotmart.com/... ou https://checkout..."
          hint="URL para onde o visitante será enviado ao clicar no botão de pagamento."
        />
        <Field
          label="Texto do Botão de Pagamento"
          value={settings.paymentButtonText}
          onChange={(v) => set("paymentButtonText", v)}
          placeholder="Realizar Pagamento Agora"
        />
      </div>

      {/* Timer */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Timer e Espectadores</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Timer (min)" value={settings.timerMinutes} onChange={(v) => set("timerMinutes", v)} />
          <Field label="Timer (seg)" value={settings.timerSeconds} onChange={(v) => set("timerSeconds", v)} />
          <Field label="Espectadores" value={settings.viewersCount} onChange={(v) => set("viewersCount", v)} />
        </div>
      </div>

      {/* Video */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
          <Video className="w-4 h-4" /> Vídeo
        </h3>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setVideoMode("url")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${videoMode === "url" ? "bg-purple-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <Link className="w-3.5 h-3.5" /> Link (YouTube/Vimeo)
          </button>
          <button
            onClick={() => setVideoMode("gallery")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${videoMode === "gallery" ? "bg-purple-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <Upload className="w-3.5 h-3.5" /> Da galeria
          </button>
        </div>

        {videoMode === "url" ? (
          <>
            <Field
              label="Link do vídeo"
              value={settings.videoUrl}
              onChange={(v) => set("videoUrl", v)}
              placeholder="https://youtube.com/watch?v=..."
              hint="Cole o link do YouTube ou Vimeo."
            />
            {settings.videoUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-100 aspect-video">
                <iframe
                  src={
                    settings.videoUrl.includes("youtu")
                      ? `https://www.youtube.com/embed/${settings.videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]}`
                      : settings.videoUrl.includes("vimeo")
                      ? `https://player.vimeo.com/video/${settings.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]}`
                      : settings.videoUrl
                  }
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
          </>
        ) : (
          <>
            <input
              ref={videoFileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setLocalVideoPreview(url);
                setSessionVideoObjectUrl(url);
                // Clear the URL-based video
                set("videoUrl", "");
              }}
            />
            <button
              onClick={() => videoFileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-200 hover:border-purple-400 text-purple-600 font-semibold py-5 rounded-xl transition-colors"
            >
              <Upload className="w-5 h-5" />
              Escolher vídeo da galeria
            </button>
            <p className="text-xs text-gray-400 text-center">MP4, MOV, WebM · O vídeo fica ativo durante a sessão</p>

            {localVideoPreview && (
              <div className="space-y-2">
                <div className="rounded-lg overflow-hidden border border-gray-100 aspect-video bg-black">
                  <video src={localVideoPreview} controls className="w-full h-full object-contain" />
                </div>
                <button
                  onClick={() => {
                    setLocalVideoPreview(null);
                    setSessionVideoObjectUrl(null);
                    if (videoFileRef.current) videoFileRef.current.value = "";
                  }}
                  className="w-full text-xs text-red-500 hover:text-red-700 py-1 transition-colors"
                >
                  Remover vídeo
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
          <Send className="w-4 h-4 text-[#229ED9]" /> Botão do Telegram
        </h3>
        <Field
          label="Link do Grupo Telegram"
          value={settings.telegramLink}
          onChange={(v) => set("telegramLink", v)}
          placeholder="https://t.me/seugrupo"
        />
        <Field
          label="Texto do Botão Telegram"
          value={settings.telegramButtonText}
          onChange={(v) => set("telegramButtonText", v)}
          placeholder="Entrar no Grupo VIP"
        />
        <Field
          label="Mensagem Automática (enviada ao clicar)"
          value={settings.telegramAutoMessage}
          onChange={(v) => set("telegramAutoMessage", v)}
          type="textarea"
          placeholder="Olá! Acabei de comprar o acesso VIP..."
          hint="Esta mensagem será pré-preenchida no Telegram quando o lead clicar no botão."
        />
        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">
          <p className="text-xs text-gray-400 mb-1 font-medium">Preview do botão:</p>
          <div className="flex items-center gap-2 bg-[#229ED9] text-white px-4 py-2.5 rounded-full w-fit text-sm font-semibold">
            <Send className="w-3.5 h-3.5" />
            {settings.telegramButtonText || "Entrar no Grupo VIP"}
          </div>
        </div>
      </div>

      <SaveBar onSave={() => saveSettings(settings)} />
    </div>
  );
}

/* ─── Proofs ─── */
function ProofsTab({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newProof: Proof = {
          id: Date.now().toString() + Math.random(),
          dataUrl,
          caption: caption || "",
        };
        const updated = { ...settings, proofs: [...settings.proofs, newProof] };
        onChange(updated);
        saveSettings(updated);
      };
      reader.readAsDataURL(file);
    });
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeProof = (id: string) => {
    const updated = { ...settings, proofs: settings.proofs.filter((p) => p.id !== id) };
    onChange(updated);
    saveSettings(updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Provas Sociais</h2>
        <p className="text-gray-500 text-sm">Prints de clientes que aparecem na landing page</p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
          <Image className="w-4 h-4" /> Adicionar Print
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Legenda (opcional)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: João recebeu acesso em 2 minutos!"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-200 hover:border-purple-400 text-purple-600 font-semibold py-4 rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Selecionar imagem(ns)
        </button>

        <p className="text-xs text-gray-400 text-center">
          JPG, PNG, WebP · Você pode selecionar várias imagens de uma vez
        </p>
      </div>

      {/* Gallery */}
      {settings.proofs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {settings.proofs.map((proof) => (
            <div key={proof.id} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
              <img src={proof.dataUrl} alt={proof.caption} className="w-full object-cover" />
              {proof.caption && (
                <div className="px-2 py-1.5">
                  <p className="text-xs text-gray-600 text-center">{proof.caption}</p>
                </div>
              )}
              <button
                onClick={() => removeProof(proof.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
          <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma prova adicionada ainda.</p>
          <p className="text-gray-300 text-xs mt-1">Adicione prints de clientes acima.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Appearance ─── */
function AppearanceTab({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  const PRESETS = [
    { label: "Vermelho", primary: "#dc2626", accent: "#9333ea" },
    { label: "Azul", primary: "#2563eb", accent: "#7c3aed" },
    { label: "Verde", primary: "#16a34a", accent: "#0891b2" },
    { label: "Laranja", primary: "#ea580c", accent: "#dc2626" },
    { label: "Rosa", primary: "#db2777", accent: "#7c3aed" },
    { label: "Preto", primary: "#111827", accent: "#6d28d9" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Aparência</h2>
        <p className="text-gray-500 text-sm">Personalize as cores do site</p>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Temas Prontos</h3>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ ...settings, primaryColor: preset.primary, accentColor: preset.accent })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                settings.primaryColor === preset.primary ? "border-gray-400 shadow" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primary }} />
                <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.accent }} />
              </div>
              <span className="text-xs text-gray-600 font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Cores Personalizadas</h3>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cor do Botão Principal</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-sm text-gray-700 font-mono">{settings.primaryColor}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cor do Destaque VIP</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onChange({ ...settings, accentColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-sm text-gray-700 font-mono">{settings.accentColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Preview</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-center text-gray-800 font-bold text-base">
            Access exclusive content in the{" "}
            <span style={{ color: settings.accentColor }}>VIP Group</span>
          </p>
          <button
            className="w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-3 px-5 rounded-full"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Lock className="w-4 h-4" />
            {settings.ctaText || "GET VIP ACCESS NOW"}
          </button>
        </div>
      </div>

      <SaveBar onSave={() => saveSettings(settings)} />
    </div>
  );
}

/* ─── Reports ─── */
function Reports() {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const values = [8200, 11500, 9800, 14200, 12100, 16800, 15400, 19200, 17600, 22100, 20800, 24300];
  const maxVal = Math.max(...values);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Relatórios</h2>
        <p className="text-gray-500 text-sm">Análise de desempenho e vendas</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Receita Mensal</h3>
        <div className="flex items-end gap-1.5 h-36">
          {values.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-purple-500 rounded-t-sm" style={{ height: `${(v / maxVal) * 100}%` }} />
              <span className="text-[9px] text-gray-400">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Fontes de Tráfego</h3>
        <div className="space-y-3">
          {[
            { source: "Instagram", pct: 45, color: "bg-pink-500" },
            { source: "WhatsApp", pct: 28, color: "bg-green-500" },
            { source: "Orgânico", pct: 15, color: "bg-blue-500" },
            { source: "YouTube", pct: 8, color: "bg-red-500" },
            { source: "Outros", pct: 4, color: "bg-gray-400" },
          ].map((row) => (
            <div key={row.source}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{row.source}</span>
                <span className="text-gray-500">{row.pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`${row.color} h-2 rounded-full`} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Funil de Conversão</h3>
        <div className="space-y-2">
          {[
            { stage: "Visitantes", count: "12.847", pct: "100%" },
            { stage: "Assistiram o vídeo", count: "8.231", pct: "64%" },
            { stage: "Clicaram no botão", count: "3.412", pct: "27%" },
            { stage: "Foram ao checkout", count: "1.891", pct: "15%" },
            { stage: "Compraram", count: "1.079", pct: "8,4%" },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{row.stage}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">{row.count}</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{row.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin ─── */
const ADMIN_PASSWORD = "Almanegra";
const ADMIN_KEY = "vip_admin_auth";

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_KEY, "1");
      setError(false);
      onAuth();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white text-xl font-extrabold tracking-tight">Área Restrita</h1>
          <p className="text-gray-500 text-sm mt-1">Digite a senha para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="Senha"
            autoFocus
            className={`w-full bg-gray-900 border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 transition-all ${
              error ? "border-red-500 focus:ring-red-500/30" : "border-gray-800 focus:ring-purple-500/30"
            }`}
          />
          {error && (
            <p className="text-red-400 text-xs text-center font-medium">Senha incorreta. Tente novamente.</p>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-purple-500/20"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="w-full text-gray-600 text-xs py-2 hover:text-gray-400 transition-colors"
          >
            Voltar à página
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_KEY) === "1");

  if (!authed) {
    return <AdminLogin onAuth={() => setAuthed(true)} />;
  }

  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart2 },
    { id: "product", label: "Produto", icon: Package },
    { id: "proofs", label: "Provas", icon: Image },
    { id: "appearance", label: "Visual", icon: Palette },
    { id: "reports", label: "Relatórios", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-gray-400 font-medium">Painel Admin</p>
            <h1 className="text-sm font-bold text-gray-900">VIP Group</h1>
          </div>
        </div>
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-24">
        {tab === "dashboard" && <Dashboard settings={settings} />}
        {tab === "product" && <ProductTab settings={settings} onChange={setSettings} />}
        {tab === "proofs" && <ProofsTab settings={settings} onChange={setSettings} />}
        {tab === "appearance" && <AppearanceTab settings={settings} onChange={setSettings} />}
        {tab === "reports" && <Reports />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center z-10">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              tab === id ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
