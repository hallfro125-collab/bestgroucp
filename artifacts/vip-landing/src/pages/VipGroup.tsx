import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Star, Users, Crown, CheckCircle } from "lucide-react";

export default function VipGroup() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
          <span className="text-white text-xs font-semibold">Grupo Ativo</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-md mx-auto w-full">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-5 shadow-2xl shadow-orange-500/30">
          <Crown className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-white text-center mb-2">
          Bem-vindo ao Grupo VIP!
        </h1>
        <p className="text-purple-200 text-center text-sm mb-8">
          Você tem acesso exclusivo ao melhor conteúdo. Entre agora e aproveite!
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          {[
            { icon: Users, value: "1.247", label: "Membros" },
            { icon: Star, value: "4.9★", label: "Avaliação" },
            { icon: CheckCircle, value: "10+", label: "Bônus" },
          ].map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold text-lg leading-none">{value}</span>
              <span className="text-purple-300 text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA Cards */}
        <div className="w-full space-y-3 mb-6">
          <a
            href="https://t.me/seugrupo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-4 bg-[#229ED9] hover:bg-[#1a8ec0] text-white px-5 py-4 rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base">Entrar no Telegram</p>
              <p className="text-blue-100 text-xs">Grupo exclusivo VIP</p>
            </div>
          </a>

          <a
            href="https://chat.whatsapp.com/seugrupo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-4 bg-[#25D366] hover:bg-[#1ab553] text-white px-5 py-4 rounded-2xl shadow-lg shadow-green-900/30 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base">Entrar no WhatsApp</p>
              <p className="text-green-100 text-xs">Grupo exclusivo VIP</p>
            </div>
          </a>
        </div>

        {/* Benefits */}
        <div className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wide">
            O que você vai receber:
          </h3>
          <div className="space-y-2.5">
            {[
              "Conteúdo exclusivo todos os dias",
              "Acesso a +10 pacotes bônus",
              "Suporte direto com o criador",
              "Comunidade ativa de membros",
              "Atualizações vitalícias gratuitas",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-purple-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
