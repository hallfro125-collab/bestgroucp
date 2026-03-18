import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart2,
  Package,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  MousePointerClick,
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
  Monitor,
  Smartphone,
  Globe,
  Clock,
  Trash,
} from "lucide-react";
import { loadSettings, saveSettings, type AppSettings, type Proof } from "@/lib/settings";
import { saveRemoteSettings, fetchRemoteSettings } from "@/lib/settingsApi";
import { fetchRemoteVisitors, timeAgo, formatTime, formatDate, type Visitor } from "@/lib/analytics";
import { addVideo, fetchVideos, deleteVideo, buildEmbedUrl, type VideoEntry } from "@/lib/videosApi";

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

type SyncStatus = "idle" | "syncing" | "synced" | "error";

function SaveBar({ onSave, syncStatus }: { onSave: () => void; syncStatus: SyncStatus }) {
  const label =
    syncStatus === "syncing" ? "Salvando..." :
    syncStatus === "synced"  ? "✓ Salvo e publicado!" :
    syncStatus === "error"   ? "⚠ Erro ao publicar — verifique conexão" :
    "Salvar e publicar alterações";
  const color =
    syncStatus === "synced"  ? "bg-green-600 text-white" :
    syncStatus === "error"   ? "bg-red-500 text-white" :
    syncStatus === "syncing" ? "bg-purple-400 text-white cursor-wait" :
    "bg-purple-600 hover:bg-purple-700 text-white";
  return (
    <button
      onClick={onSave}
      disabled={syncStatus === "syncing"}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${color}`}
    >
      <Save className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ─── Dashboard ─── */
function Dashboard({ settings }: { settings: AppSettings }) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    const load = () => fetchRemoteVisitors().then(setVisitors);
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const today = visitors.filter(v => v.timestamp >= todayStart.getTime());
  const ctaCount = visitors.filter(v => v.ctaClicked).length;
  const payCount = visitors.filter(v => v.paymentClicked).length;
  const convRate = visitors.length > 0 ? ((payCount / visitors.length) * 100).toFixed(1) : "0";
  const last5 = [...visitors].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  const stats = [
    { icon: Users, label: "Visitantes Hoje", value: String(today.length), sub: `${visitors.length} no total`, color: "bg-purple-500" },
    { icon: MousePointerClick, label: "Clicaram no CTA", value: String(ctaCount), sub: visitors.length > 0 ? `${((ctaCount / visitors.length) * 100).toFixed(0)}% dos visitantes` : "—", color: "bg-blue-500" },
    { icon: ShoppingCart, label: "Foram ao Pagamento", value: String(payCount), sub: ctaCount > 0 ? `${((payCount / ctaCount) * 100).toFixed(0)}% dos CTAs` : "—", color: "bg-green-500" },
    { icon: TrendingUp, label: "Taxa de Conversão", value: `${convRate}%`, sub: "visitante → pagamento", color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm">Dados reais de visitantes da sua página</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Últimos Visitantes</h3>
        {last5.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum visitante ainda. Abra a página principal para começar a rastrear.</p>
        ) : (
          <div className="space-y-2">
            {last5.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{v.flag || "🌍"}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{v.city !== "—" ? `${v.city}, ` : ""}{v.country}</p>
                    <p className="text-xs text-gray-400">{formatTime(v.timestamp)} · {v.device} · {v.browser}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {v.paymentClicked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Pagamento</span>}
                  {v.ctaClicked && !v.paymentClicked && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">CTA</span>}
                  {!v.ctaClicked && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Visitou</span>}
                  <span className="text-xs text-gray-400">{timeAgo(v.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Video Manager Component ─── */
function VideoManager() {
  const [videoInput, setVideoInput] = useState("");
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    fetchVideos().then((v) => { setVideos(v); setLoadingVideos(false); });
  }, []);

  const handleSubmit = async () => {
    const url = videoInput.trim();
    if (!url) { setStatus({ type: "error", msg: "Digite uma URL de vídeo válida." }); return; }
    setLoading(true);
    setStatus(null);
    const result = await addVideo(url);
    setLoading(false);
    if (result.ok) {
      setStatus({ type: "success", msg: "✅ Vídeo salvo! Agora aparece para todos os visitantes." });
      setVideoInput("");
      fetchVideos().then(setVideos);
    } else {
      setStatus({ type: "error", msg: `Erro: ${result.error ?? "falha ao salvar"}` });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteVideo(id);
    setVideos((v) => v.filter((x) => x.id !== id));
  };

  const previewUrl = videoInput.trim();
  const embedPreview = previewUrl ? buildEmbedUrl(previewUrl) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
        <Video className="w-4 h-4" /> Gerenciador de Vídeo
      </h3>

      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-800">
        <strong>Funciona no Vercel:</strong> Cole o link e clique em Salvar. O vídeo aparece para todos os visitantes imediatamente — sem localStorage, sem dependência do Replit ficar ligado.
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-600">URL do Vídeo</label>
        <input
          type="url"
          value={videoInput}
          onChange={(e) => { setVideoInput(e.target.value); setStatus(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="https://youtube.com/watch?v=... ou https://files.catbox.moe/video.mp4"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <p className="text-xs text-gray-400">Aceita: YouTube, Vimeo, link direto de MP4 (Catbox, etc.)</p>
      </div>

      {/* Preview while typing */}
      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-100 aspect-video bg-black">
          {embedPreview ? (
            <iframe src={embedPreview} className="w-full h-full" allowFullScreen />
          ) : (
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
        {loading ? "Salvando..." : "Salvar Vídeo para Todos os Visitantes"}
      </button>

      {/* Status message */}
      {status && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {status.msg}
        </div>
      )}

      {/* Current video list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vídeos salvos</p>
        {loadingVideos ? (
          <div className="text-xs text-gray-400 py-2">Carregando...</div>
        ) : videos.length === 0 ? (
          <div className="text-xs text-gray-400 py-2 text-center border border-dashed rounded-lg">Nenhum vídeo salvo ainda</div>
        ) : (
          <div className="space-y-2">
            {videos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${i === 0 ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                  {i === 0 ? "ATIVO" : `#${i + 1}`}
                </span>
                <span className="flex-1 text-xs text-gray-600 truncate">{v.url}</span>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Product ─── */
function ProductTab({ settings, onChange, onSave, syncStatus }: { settings: AppSettings; onChange: (s: AppSettings) => void; onSave: () => void; syncStatus: SyncStatus }) {
  const set = (key: keyof AppSettings, value: string) => onChange({ ...settings, [key]: value });

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
          💳 Modal de Pagamento
        </h3>
        <p className="text-xs text-gray-400 -mt-1">Quando o visitante clica no CTA, aparece um modal. Personalize todo o conteúdo abaixo.</p>

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

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Textos do Modal</p>
          <p className="text-xs text-gray-400 -mt-2">Deixe em branco para usar o texto padrão do idioma selecionado.</p>
          <Field
            label="Título do Modal"
            value={settings.modalTitle}
            onChange={(v) => set("modalTitle", v)}
            placeholder="Finalize seu pagamento"
          />
          <Field
            label="Descrição / Corpo do Modal"
            value={settings.modalBody}
            onChange={(v) => set("modalBody", v)}
            placeholder="Clique no botão abaixo para pagar. Após o pagamento, envie o comprovante no Telegram..."
            type="textarea"
          />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">3</div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Passo a Passo de Como Pagar</p>
          </div>
          <p className="text-xs text-gray-400">Estes 3 passos aparecem no modal quando o visitante clica no botão. Deixe em branco para usar o texto padrão.</p>
          {[
            { key: "modalStep1" as const, label: "① Passo 1", placeholder: "Clique no botão de pagamento" },
            { key: "modalStep2" as const, label: "② Passo 2", placeholder: "Conclua o pagamento normalmente" },
            { key: "modalStep3" as const, label: "③ Passo 3", placeholder: "Envie o comprovante no Telegram para liberar o acesso" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">{label}</label>
              <input
                type="text"
                value={settings[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
            </div>
          ))}
        </div>
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

      {/* Video Manager */}
      <VideoManager />

      {/* Telegram */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-2">
          <Send className="w-4 h-4 text-[#229ED9]" /> Botão do Telegram
        </h3>
        <Toggle
          label="Ativar redirecionamento automático para Telegram"
          value={!!settings.telegramAutoRedirect}
          onChange={(v) => set("telegramAutoRedirect", v)}
        />
        <Field
          label="Username ou número do Telegram"
          value={settings.telegramUsername || ""}
          onChange={(v) => set("telegramUsername", v)}
          placeholder="seugrupo ou +5511999999999"
          hint="Sem @. Exemplo: seugrupo ou +5511999999999"
        />
        <Field
          label="Texto do Botão Telegram"
          value={settings.telegramButtonText}
          onChange={(v) => set("telegramButtonText", v)}
          placeholder="Entrar no Grupo VIP"
        />
        <Field
          label="Mensagem pré-preenchida no Telegram"
          value={settings.telegramAutoMessage}
          onChange={(v) => set("telegramAutoMessage", v)}
          type="textarea"
          placeholder="Olá! Acabei de comprar o acesso VIP..."
          hint="Ao clicar no botão, o Telegram abre com esta mensagem já pronta para enviar."
        />
        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200 space-y-2">
          <p className="text-xs text-gray-400 font-medium">Preview do botão:</p>
          <div className="flex items-center gap-2 bg-[#229ED9] text-white px-4 py-2.5 rounded-full w-fit text-sm font-semibold">
            <Send className="w-3.5 h-3.5" />
            {settings.telegramButtonText || "Entrar no Grupo VIP"}
          </div>
          {settings.telegramAutoRedirect && settings.telegramUsername && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Vai abrir: t.me/{(settings.telegramUsername || "").replace(/^@/, "")}?text=...
            </p>
          )}
          {settings.telegramAutoRedirect && !settings.telegramUsername && (
            <p className="text-xs text-orange-500 font-medium">
              ⚠ Defina o username para ativar o redirecionamento.
            </p>
          )}
          {!settings.telegramAutoRedirect && (
            <p className="text-xs text-gray-400">Redirecionamento desativado — botão não faz nada ao clicar.</p>
          )}
        </div>
      </div>

      <SaveBar onSave={onSave} syncStatus={syncStatus} />
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
function AppearanceTab({ settings, onChange, onSave, syncStatus }: { settings: AppSettings; onChange: (s: AppSettings) => void; onSave: () => void; syncStatus: SyncStatus }) {
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

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Cor de Fundo da Página</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
              <input
                type="color"
                value={settings.bgColor || "#ffffff"}
                onChange={(e) => onChange({ ...settings, bgColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-sm text-gray-700 font-mono">{settings.bgColor || "#ffffff"}</span>
            </div>
            <div className="flex gap-1.5">
              {["#ffffff", "#0f172a", "#1e1b4b", "#022c22", "#1c1917"].map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...settings, bgColor: c })}
                  className="w-7 h-7 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: settings.bgColor === c ? "#7c3aed" : "#e5e7eb",
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Escolha uma cor ou use os atalhos rápidos acima.</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Preview</h3>
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: settings.bgColor || "#ffffff" }}>
          <p className="text-center font-bold text-base" style={{ color: settings.bgColor === "#ffffff" || !settings.bgColor ? "#1f2937" : "#ffffff" }}>
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

      <SaveBar onSave={onSave} syncStatus={syncStatus} />
    </div>
  );
}

/* ─── Reports ─── */
function Reports() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filter, setFilter] = useState<"all" | "cta" | "payment">("all");

  useEffect(() => {
    const load = () => fetchRemoteVisitors().then(setVisitors);
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const clearAll = () => {
    if (!confirm("Apagar todos os dados de visitantes?")) return;
    setVisitors([]);
  };

  const sorted = [...visitors].sort((a, b) => b.timestamp - a.timestamp);
  const filtered = filter === "cta" ? sorted.filter(v => v.ctaClicked)
                 : filter === "payment" ? sorted.filter(v => v.paymentClicked)
                 : sorted;

  // Country breakdown
  const byCountry: Record<string, { flag: string; count: number }> = {};
  for (const v of visitors) {
    const key = v.country || "Desconhecido";
    if (!byCountry[key]) byCountry[key] = { flag: v.flag || "🌍", count: 0 };
    byCountry[key].count++;
  }
  const countryList = Object.entries(byCountry)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);
  const maxCountry = countryList[0]?.[1].count || 1;

  // Device breakdown
  const devices: Record<string, number> = {};
  for (const v of visitors) { devices[v.device] = (devices[v.device] || 0) + 1; }

  // Funnel
  const total = visitors.length;
  const ctaCount = visitors.filter(v => v.ctaClicked).length;
  const payCount = visitors.filter(v => v.paymentClicked).length;
  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Relatórios</h2>
          <p className="text-gray-500 text-sm">Dados reais de visitantes</p>
        </div>
        {visitors.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
            <Trash className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Funil */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-500" /> Funil de Conversão</h3>
        {total === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">Nenhum visitante ainda.</p>
        ) : (
          <div className="space-y-2">
            {[
              { stage: "Visitantes totais", count: total, pct: "100%", color: "bg-purple-500" },
              { stage: "Clicaram no CTA", count: ctaCount, pct: pct(ctaCount), color: "bg-blue-500" },
              { stage: "Foram ao pagamento", count: payCount, pct: pct(payCount), color: "bg-green-500" },
            ].map((row) => (
              <div key={row.stage} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{row.stage}</span>
                    <span className="font-bold text-gray-900">{row.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${row.color} h-1.5 rounded-full`} style={{ width: row.pct === "—" ? "0%" : row.pct }} />
                  </div>
                </div>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold w-12 text-center">{row.pct}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Countries */}
      {countryList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Países</h3>
          <div className="space-y-2.5">
            {countryList.map(([country, { flag, count }]) => (
              <div key={country}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{flag} {country}</span>
                  <span className="text-gray-500">{count} visitante{count !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / maxCountry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices */}
      {Object.keys(devices).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-500" /> Dispositivos</h3>
          <div className="flex gap-3">
            {Object.entries(devices).map(([device, count]) => (
              <div key={device} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  {device === "Mobile" ? <Smartphone className="w-5 h-5 text-purple-500" /> : <Monitor className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{device}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visitor list */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Todos os Visitantes</h3>
          <div className="flex gap-1">
            {(["all", "cta", "payment"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${filter === f ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {f === "all" ? "Todos" : f === "cta" ? "CTA" : "Pagamento"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum visitante encontrado.</p>
        ) : (
          <div className="space-y-0">
            {filtered.map((v) => (
              <div key={v.id} className="py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{v.flag || "🌍"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {v.city !== "—" ? `${v.city}, ` : ""}{v.country}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(v.timestamp)} às {formatTime(v.timestamp)}</p>
                      <p className="text-xs text-gray-400">{v.device} · {v.browser} · {v.os} · {v.language}</p>
                      {v.referrer && v.referrer !== "Direto" && (
                        <p className="text-xs text-gray-400 truncate">↗ {v.referrer}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {v.paymentClicked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">💳 Pagamento</span>}
                    {v.ctaClicked && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">👆 CTA</span>}
                    <span className="text-xs text-gray-400">{timeAgo(v.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Admin ─── */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    fetchRemoteSettings().then((remote) => {
      if (remote) {
        saveSettings(remote);
        setSettings(remote);
      }
    });
  }, []);

  const handleSave = async () => {
    setSyncStatus("syncing");
    saveSettings(settings);
    const ok = await saveRemoteSettings(settings);
    setSyncStatus(ok ? "synced" : "error");
    setTimeout(() => setSyncStatus("idle"), 3000);
  };

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
        <div className="flex items-center gap-2">
          {syncStatus === "synced" && <span className="text-[10px] text-green-600 font-semibold">● Publicado</span>}
          {syncStatus === "error"  && <span className="text-[10px] text-red-500 font-semibold">● Erro ao publicar</span>}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-24">
        {tab === "dashboard" && <Dashboard settings={settings} />}
        {tab === "product" && <ProductTab settings={settings} onChange={setSettings} onSave={handleSave} syncStatus={syncStatus} />}
        {tab === "proofs" && <ProofsTab settings={settings} onChange={setSettings} />}
        {tab === "appearance" && <AppearanceTab settings={settings} onChange={setSettings} onSave={handleSave} syncStatus={syncStatus} />}
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
