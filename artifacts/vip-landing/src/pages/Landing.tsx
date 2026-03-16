import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Lock, PlayCircle, Send, X, ChevronDown, Heart, MessageCircle } from "lucide-react";
import { loadSettings, sessionVideoObjectUrl, type AppSettings } from "@/lib/settings";

/* ─── Translations ─── */

const LANGS = {
  en: {
    flag: "🇺🇸", name: "EN",
    banner: "Limited Offer: Expires In",
    watching: "people watching",
    clickWatch: "Click to watch",
    videoNone: "No video configured",
    headline: "Access exclusive content in the VIP Group",
    subheadline: "Join the VIP group, now with lifetime access",
    bonusText: "More than 10 exclusive bonus packages",
    ctaText: "GET VIP ACCESS NOW",
    telegramBtnText: "Enter the VIP Group (Telegram)",
    proofTitle: "What our members say 🔥",
    modalTitle: "Complete your payment",
    modalBody: "Click the button below to pay. After payment, send your receipt on Telegram to unlock immediate VIP group access.",
    step1: "Click 'Make Payment' below",
    step2: "Complete the payment normally",
    step3: "Send the receipt on Telegram to unlock access",
    payBtn: "Make Payment Now",
    close: "Close",
    langLabel: "Language",
    commentsTitle: "Member Reviews",
    commentsNamePlaceholder: "Your name",
    commentsTextPlaceholder: "Share your experience with the VIP group...",
    commentsBtn: "Post Comment",
    commentsSent: "Your comment was posted!",
    commentsJustNow: "just now",
  },
  pt: {
    flag: "🇧🇷", name: "PT",
    banner: "Oferta Limitada: Expira Em",
    watching: "pessoas assistindo",
    clickWatch: "Clique para assistir",
    videoNone: "Vídeo não configurado",
    headline: "Acesse conteúdo exclusivo no Grupo VIP",
    subheadline: "Junte-se ao grupo VIP agora com acesso vitalício",
    bonusText: "Mais de 10 pacotes de bônus exclusivos",
    ctaText: "GARANTIR MINHA VAGA VIP",
    telegramBtnText: "Entrar no Grupo VIP (Telegram)",
    proofTitle: "O que nossos membros dizem 🔥",
    modalTitle: "Finalize seu pagamento",
    modalBody: "Clique no botão abaixo para pagar. Após o pagamento, envie o comprovante no Telegram para receber acesso imediato ao grupo VIP.",
    step1: "Clique em 'Realizar Pagamento' abaixo",
    step2: "Conclua o pagamento normalmente",
    step3: "Envie o comprovante no Telegram para liberar o acesso",
    payBtn: "Realizar Pagamento Agora",
    close: "Fechar",
    langLabel: "Idioma",
    commentsTitle: "Avaliações dos Membros",
    commentsNamePlaceholder: "Seu nome",
    commentsTextPlaceholder: "Compartilhe sua experiência com o grupo VIP...",
    commentsBtn: "Publicar Comentário",
    commentsSent: "Seu comentário foi publicado!",
    commentsJustNow: "agora",
  },
  es: {
    flag: "🇪🇸", name: "ES",
    banner: "Oferta Limitada: Expira En",
    watching: "personas viendo",
    clickWatch: "Haz clic para ver",
    videoNone: "Video no configurado",
    headline: "Accede a contenido exclusivo en el Grupo VIP",
    subheadline: "Únete al grupo VIP ahora con acceso de por vida",
    bonusText: "Más de 10 paquetes de bonos exclusivos",
    ctaText: "CONSEGUIR ACCESO VIP AHORA",
    telegramBtnText: "Entrar al Grupo VIP (Telegram)",
    proofTitle: "Lo que dicen nuestros miembros 🔥",
    modalTitle: "Finaliza tu pago",
    modalBody: "Haz clic en el botón de abajo para pagar. Después del pago, envía el comprobante en Telegram para recibir acceso inmediato al grupo VIP.",
    step1: "Haz clic en 'Realizar Pago' abajo",
    step2: "Completa el pago normalmente",
    step3: "Envía el comprobante en Telegram para desbloquear el acceso",
    payBtn: "Realizar Pago Ahora",
    close: "Cerrar",
    langLabel: "Idioma",
    commentsTitle: "Reseñas de Miembros",
    commentsNamePlaceholder: "Tu nombre",
    commentsTextPlaceholder: "Comparte tu experiencia con el grupo VIP...",
    commentsBtn: "Publicar Comentario",
    commentsSent: "¡Tu comentario fue publicado!",
    commentsJustNow: "ahora",
  },
  fr: {
    flag: "🇫🇷", name: "FR",
    banner: "Offre Limitée : Expire Dans",
    watching: "personnes regardent",
    clickWatch: "Cliquez pour regarder",
    videoNone: "Vidéo non configurée",
    headline: "Accédez à du contenu exclusif dans le Groupe VIP",
    subheadline: "Rejoignez le groupe VIP maintenant avec accès à vie",
    bonusText: "Plus de 10 packs de bonus exclusifs",
    ctaText: "ACCÉDER AU VIP MAINTENANT",
    telegramBtnText: "Rejoindre le Groupe VIP (Telegram)",
    proofTitle: "Ce que disent nos membres 🔥",
    modalTitle: "Finalisez votre paiement",
    modalBody: "Cliquez sur le bouton ci-dessous pour payer. Après le paiement, envoyez le reçu sur Telegram pour recevoir un accès immédiat au groupe VIP.",
    step1: "Cliquez sur 'Effectuer le paiement' ci-dessous",
    step2: "Complétez le paiement normalement",
    step3: "Envoyez le reçu sur Telegram pour débloquer l'accès",
    payBtn: "Effectuer le Paiement",
    close: "Fermer",
    langLabel: "Langue",
    commentsTitle: "Avis des Membres",
    commentsNamePlaceholder: "Votre nom",
    commentsTextPlaceholder: "Partagez votre expérience avec le groupe VIP...",
    commentsBtn: "Publier un Commentaire",
    commentsSent: "Votre commentaire a été publié !",
    commentsJustNow: "à l'instant",
  },
  de: {
    flag: "🇩🇪", name: "DE",
    banner: "Limitiertes Angebot: Läuft ab in",
    watching: "Personen schauen",
    clickWatch: "Zum Ansehen klicken",
    videoNone: "Kein Video konfiguriert",
    headline: "Erhalte exklusiven Zugang zur VIP-Gruppe",
    subheadline: "Tritt der VIP-Gruppe jetzt mit lebenslangem Zugang bei",
    bonusText: "Über 10 exklusive Bonus-Pakete",
    ctaText: "JETZT VIP-ZUGANG SICHERN",
    telegramBtnText: "VIP-Gruppe betreten (Telegram)",
    proofTitle: "Was unsere Mitglieder sagen 🔥",
    modalTitle: "Zahlung abschließen",
    modalBody: "Klicke auf den Button unten, um zu zahlen. Nach der Zahlung sende den Beleg auf Telegram, um sofort Zugang zur VIP-Gruppe zu erhalten.",
    step1: "Klicke unten auf 'Zahlung vornehmen'",
    step2: "Schließe die Zahlung normal ab",
    step3: "Sende den Beleg auf Telegram, um den Zugang freizuschalten",
    payBtn: "Jetzt bezahlen",
    close: "Schließen",
    langLabel: "Sprache",
    commentsTitle: "Mitgliederbewertungen",
    commentsNamePlaceholder: "Dein Name",
    commentsTextPlaceholder: "Teile deine Erfahrung mit der VIP-Gruppe...",
    commentsBtn: "Kommentar posten",
    commentsSent: "Dein Kommentar wurde veröffentlicht!",
    commentsJustNow: "gerade eben",
  },
  it: {
    flag: "🇮🇹", name: "IT",
    banner: "Offerta Limitata: Scade Tra",
    watching: "persone guardano",
    clickWatch: "Clicca per guardare",
    videoNone: "Nessun video configurato",
    headline: "Accedi a contenuti esclusivi nel Gruppo VIP",
    subheadline: "Unisciti al gruppo VIP ora con accesso a vita",
    bonusText: "Più di 10 pacchetti bonus esclusivi",
    ctaText: "OTTIENI ACCESSO VIP ORA",
    telegramBtnText: "Entra nel Gruppo VIP (Telegram)",
    proofTitle: "Cosa dicono i nostri membri 🔥",
    modalTitle: "Completa il pagamento",
    modalBody: "Clicca il bottone qui sotto per pagare. Dopo il pagamento, invia la ricevuta su Telegram per ricevere accesso immediato al gruppo VIP.",
    step1: "Clicca 'Effettua Pagamento' qui sotto",
    step2: "Completa il pagamento normalmente",
    step3: "Invia la ricevuta su Telegram per sbloccare l'accesso",
    payBtn: "Effettua il Pagamento",
    close: "Chiudi",
    langLabel: "Lingua",
    commentsTitle: "Recensioni dei Membri",
    commentsNamePlaceholder: "Il tuo nome",
    commentsTextPlaceholder: "Condividi la tua esperienza con il gruppo VIP...",
    commentsBtn: "Pubblica Commento",
    commentsSent: "Il tuo commento è stato pubblicato!",
    commentsJustNow: "adesso",
  },
  zh: {
    flag: "🇨🇳", name: "中文",
    banner: "限时优惠：倒计时",
    watching: "人正在观看",
    clickWatch: "点击观看",
    videoNone: "未配置视频",
    headline: "访问VIP群组的专属内容",
    subheadline: "立即加入VIP群组，享受终身访问权限",
    bonusText: "超过10个独家奖励套餐",
    ctaText: "立即获取VIP访问权限",
    telegramBtnText: "加入VIP群组 (Telegram)",
    proofTitle: "会员反馈 🔥",
    modalTitle: "完成付款",
    modalBody: "点击下方按钮进行付款。付款后，将凭证发送至 Telegram 即可立即获得 VIP 群组访问权限。",
    step1: "点击下方「立即付款」",
    step2: "正常完成付款",
    step3: "将凭证发送至 Telegram 解锁访问权限",
    payBtn: "立即付款",
    close: "关闭",
    langLabel: "语言",
    commentsTitle: "会员评价",
    commentsNamePlaceholder: "您的姓名",
    commentsTextPlaceholder: "分享您对VIP群组的体验...",
    commentsBtn: "发表评论",
    commentsSent: "您的评论已发布！",
    commentsJustNow: "刚刚",
  },
  ar: {
    flag: "🇸🇦", name: "AR",
    banner: "عرض محدود: ينتهي خلال",
    watching: "شخص يشاهد",
    clickWatch: "انقر للمشاهدة",
    videoNone: "لا يوجد فيديو",
    headline: "احصل على محتوى حصري في مجموعة VIP",
    subheadline: "انضم إلى مجموعة VIP الآن مع وصول مدى الحياة",
    bonusText: "أكثر من 10 حزم مكافآت حصرية",
    ctaText: "احصل على وصول VIP الآن",
    telegramBtnText: "الدخول إلى مجموعة VIP (Telegram)",
    proofTitle: "ماذا يقول أعضاؤنا 🔥",
    modalTitle: "أتمم عملية الدفع",
    modalBody: "انقر على الزر أدناه للدفع. بعد الدفع، أرسل الإيصال على Telegram للحصول على الوصول الفوري لمجموعة VIP.",
    step1: "انقر على 'إجراء الدفع' أدناه",
    step2: "أكمل عملية الدفع",
    step3: "أرسل الإيصال على Telegram لفتح الوصول",
    payBtn: "إجراء الدفع الآن",
    close: "إغلاق",
    langLabel: "اللغة",
    commentsTitle: "تقييمات الأعضاء",
    commentsNamePlaceholder: "اسمك",
    commentsTextPlaceholder: "شارك تجربتك مع مجموعة VIP...",
    commentsBtn: "نشر التعليق",
    commentsSent: "تم نشر تعليقك!",
    commentsJustNow: "الآن",
  },
} as const;

type LangKey = keyof typeof LANGS;
type LangData = typeof LANGS[LangKey];

const LANG_STORAGE_KEY = "vip_lang";

function getLang(): LangKey {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY) as LangKey;
    if (v && v in LANGS) return v;
  } catch { /**/ }
  return "en";
}

/* ─── Fake Comments ─── */

type Comment = {
  id: string;
  name: string;
  flag: string;
  initials: string;
  color: string;
  text: string;
  likes: number;
  timeLabel: string;
  isUser?: boolean;
};

type CommentBase = Omit<Comment, "text" | "isUser">;

const COMMENT_BASES: CommentBase[] = [
  { id: "f01", name: "Michael T.", flag: "🇺🇸", initials: "MT", color: "#3b82f6", likes: 127, timeLabel: "3m ago" },
  { id: "f02", name: "Ji-ho K.",   flag: "🇰🇷", initials: "JK", color: "#e11d48", likes: 98,  timeLabel: "12m ago" },
  { id: "f03", name: "Carlos M.",  flag: "🇧🇷", initials: "CM", color: "#22c55e", likes: 94,  timeLabel: "28m ago" },
  { id: "f04", name: "Emma W.",    flag: "🇬🇧", initials: "EW", color: "#ec4899", likes: 76,  timeLabel: "1h ago" },
  { id: "f05", name: "Hans K.",    flag: "🇩🇪", initials: "HK", color: "#14b8a6", likes: 61,  timeLabel: "2h ago" },
  { id: "f06", name: "Khalid R.",  flag: "🇦🇪", initials: "KR", color: "#f59e0b", likes: 52,  timeLabel: "4h ago" },
  { id: "f07", name: "Andrea P.",  flag: "🇲🇽", initials: "AP", color: "#f97316", likes: 43,  timeLabel: "6h ago" },
];

const COMMENT_TEXTS: Record<LangKey, string[]> = {
  en: [
    "Just got my VIP link! The privacy in this group is absolutely unmatched — nobody outside knows you're a member. This is exactly what I was looking for! 🔒",
    "Received my VIP link in under 3 minutes! The group's privacy is on another level — nobody outside can see that you're a member. The exclusive content completely blew my mind. Best investment I've made this year! 🔒🔥",
    "Got the link in less than 5 minutes! The group is completely private and the content is incredible. Best decision I've made. Thank you so much! 🙏",
    "Best decision I made! The group is completely private — my name doesn't appear anywhere publicly. Got my access link within minutes. 100% recommend to anyone! 👏",
    "Worth every single penny! VIP group access in 3 minutes, completely anonymous membership, and the exclusive content is absolutely on another level. No regrets! 🔥",
    "I was skeptical at first, but the VIP link arrived in 4 minutes and the group is completely invisible from the outside. Not a single person knows I'm a member. Zero regrets! 💎",
    "Link received super fast and the VIP group privacy is total — nobody knows I'm inside. The exclusive content is on another level entirely. Best purchase I made! 🚀",
  ],
  pt: [
    "Recebi meu link VIP! A privacidade deste grupo é incomparável — ninguém de fora sabe que você é membro. Era exatamente isso que eu procurava! 🔒",
    "Recebi meu link VIP em menos de 3 minutos! A privacidade do grupo é de outro nível — ninguém de fora consegue ver que você é membro. O conteúdo exclusivo simplesmente me impressionou. Melhor investimento do ano! 🔒🔥",
    "O link chegou em menos de 5 minutos! O grupo é completamente privado e o conteúdo é incrível. Melhor decisão que tomei. Muito obrigado! 🙏",
    "Melhor decisão que tomei! O grupo é completamente privado — meu nome não aparece em lugar nenhum público. Recebi o acesso em minutos. Recomendo 100%! 👏",
    "Vale cada centavo! Acesso ao grupo VIP em 3 minutos, associação completamente anônima e o conteúdo exclusivo está absurdamente bom. Sem arrependimentos! 🔥",
    "Estava cético no início, mas o link VIP chegou em 4 minutos e o grupo é completamente invisível de fora. Nenhuma pessoa sabe que sou membro. Zero arrependimentos! 💎",
    "Link recebido super rápido e a privacidade do grupo VIP é total — ninguém sabe que estou dentro. O conteúdo exclusivo é de outro nível. Melhor compra que fiz! 🚀",
  ],
  es: [
    "¡Recibí mi link VIP! La privacidad en este grupo es incomparable — nadie afuera sabe que eres miembro. ¡Esto es exactamente lo que buscaba! 🔒",
    "¡Recibí mi link VIP en menos de 3 minutos! La privacidad del grupo es de otro nivel — nadie afuera puede ver que eres miembro. El contenido exclusivo me sorprendió completamente. ¡La mejor inversión del año! 🔒🔥",
    "¡El link llegó en menos de 5 minutos! El grupo es completamente privado y el contenido es increíble. La mejor decisión que tomé. ¡Muchas gracias! 🙏",
    "¡La mejor decisión! El grupo es completamente privado — mi nombre no aparece en ningún lugar público. Recibí acceso en minutos. ¡100% recomendado! 👏",
    "¡Vale cada centavo! Acceso al grupo VIP en 3 minutos, membresía completamente anónima y el contenido exclusivo está en otro nivel. ¡Sin arrepentimientos! 🔥",
    "Estaba escéptico al principio, pero el link VIP llegó en 4 minutos y el grupo es completamente invisible desde afuera. Ni una persona sabe que soy miembro. ¡Cero arrepentimientos! 💎",
    "¡Link recibido súper rápido y la privacidad del grupo VIP es total — nadie sabe que estoy dentro! El contenido exclusivo es de otro nivel. ¡La mejor compra que hice! 🚀",
  ],
  fr: [
    "Je viens de recevoir mon lien VIP ! La confidentialité dans ce groupe est absolument incomparable — personne ne sait que vous êtes membre. C'est exactement ce que je cherchais ! 🔒",
    "Lien VIP reçu en moins de 3 minutes ! La confidentialité du groupe est à un autre niveau — personne à l'extérieur ne peut voir que vous êtes membre. Le contenu m'a complètement bluffé. Meilleur investissement de l'année ! 🔒🔥",
    "Lien reçu en moins de 5 minutes ! Le groupe est complètement privé et le contenu est incroyable. Meilleure décision prise. Merci beaucoup ! 🙏",
    "Meilleure décision ! Le groupe est entièrement privé — mon nom n'apparaît nulle part. Accès reçu en minutes. 100% recommandé ! 👏",
    "Vaut chaque centime ! Accès au groupe VIP en 3 minutes, adhésion complètement anonyme et le contenu exclusif est à un autre niveau. Aucun regret ! 🔥",
    "J'étais sceptique au début, mais le lien VIP est arrivé en 4 minutes et le groupe est invisible de l'extérieur. Pas une personne ne sait que je suis membre. Zéro regret ! 💎",
    "Lien reçu super vite et la confidentialité du groupe VIP est totale — personne ne sait que je suis là ! Le contenu exclusif est à un autre niveau. Meilleur achat fait ! 🚀",
  ],
  de: [
    "Gerade meinen VIP-Link erhalten! Die Privatsphäre in dieser Gruppe ist absolut unübertroffen — niemand außen weiß, dass man Mitglied ist. Genau das, was ich gesucht habe! 🔒",
    "VIP-Link in unter 3 Minuten erhalten! Die Gruppenpriorität ist auf einem anderen Level — niemand außen kann sehen, dass man Mitglied ist. Der exklusive Inhalt hat mich umgehauen. Beste Investition des Jahres! 🔒🔥",
    "Link in weniger als 5 Minuten erhalten! Die Gruppe ist völlig privat und der Inhalt ist unglaublich. Beste Entscheidung überhaupt. Vielen Dank! 🙏",
    "Beste Entscheidung! Die Gruppe ist völlig privat — mein Name erscheint nirgends öffentlich. Zugang in Minuten erhalten. 100% empfehlenswert! 👏",
    "Jeden Cent wert! VIP-Gruppen-Zugang in 3 Minuten, vollständig anonyme Mitgliedschaft und der exklusive Inhalt ist auf einem anderen Level. Keine Reue! 🔥",
    "Anfangs skeptisch, aber der VIP-Link kam in 4 Minuten an und die Gruppe ist von außen unsichtbar. Keine einzige Person weiß, dass ich Mitglied bin. Null Reue! 💎",
    "Link super schnell erhalten und VIP-Gruppen-Privatsphäre ist total — niemand weiß, dass ich drin bin! Der exklusive Inhalt ist auf einem anderen Level. Bester Kauf! 🚀",
  ],
  it: [
    "Ho appena ricevuto il mio link VIP! La privacy in questo gruppo è assolutamente impareggiabile — nessuno sa che sei membro. È esattamente quello che cercavo! 🔒",
    "Ho ricevuto il link VIP in meno di 3 minuti! La privacy del gruppo è a un altro livello — nessuno all'esterno può vedere che sei membro. Il contenuto esclusivo mi ha stupito. Il miglior investimento dell'anno! 🔒🔥",
    "Link ricevuto in meno di 5 minuti! Il gruppo è completamente privato e il contenuto è incredibile. La migliore decisione presa. Grazie mille! 🙏",
    "La migliore decisione! Il gruppo è completamente privato — il mio nome non appare da nessuna parte. Accesso ricevuto in minuti. 100% consigliato! 👏",
    "Vale ogni centesimo! Accesso al gruppo VIP in 3 minuti, iscrizione completamente anonima e il contenuto esclusivo è a un altro livello. Nessun rimpianto! 🔥",
    "Ero scettico all'inizio, ma il link VIP è arrivato in 4 minuti e il gruppo è completamente invisibile dall'esterno. Nessuno sa che sono membro. Zero rimpianti! 💎",
    "Link ricevuto super veloce e la privacy del gruppo VIP è totale — nessuno sa che sono dentro! Il contenuto esclusivo è a un altro livello. Il miglior acquisto! 🚀",
  ],
  zh: [
    "刚收到我的VIP链接！这个群组的隐私保护绝对无与伦比——外人根本不知道你是成员。这正是我一直在寻找的！🔒",
    "不到3分钟就收到了VIP链接！群组隐私保护完全是另一个级别——外人根本无法看到你是成员。专属内容完全超出了我的期望。今年最好的投资！🔒🔥",
    "不到5分钟就收到链接！群组完全私密，内容令人惊叹。最正确的决定。非常感谢！🙏",
    "最正确的决定！群组完全私密——我的名字不会出现在任何公开场所。几分钟内就获得了访问权限。100%推荐！👏",
    "物超所值！3分钟内获得VIP群组访问权限，完全匿名会员，专属内容绝对是另一个级别。零遗憾！🔥",
    "一开始我持怀疑态度，但VIP链接4分钟内就到了，群组对外完全不可见。没有任何人知道我是成员。零遗憾！💎",
    "链接收到超快，VIP群组隐私保护是完全的——没有人知道我在里面！专属内容完全是另一个级别。最好的购买！🚀",
  ],
  ar: [
    "حصلت للتو على رابط VIP الخاص بي! الخصوصية في هذه المجموعة لا مثيل لها — لا أحد من الخارج يعرف أنك عضو. هذا بالضبط ما كنت أبحث عنه! 🔒",
    "استلمت رابط VIP في أقل من 3 دقائق! خصوصية المجموعة على مستوى مختلف تمامًا — لا أحد من الخارج يمكنه رؤية أنك عضو. المحتوى الحصري أبهرني تمامًا. أفضل استثمار هذا العام! 🔒🔥",
    "وصل الرابط في أقل من 5 دقائق! المجموعة خاصة تمامًا والمحتوى مذهل. أفضل قرار اتخذته. شكرًا جزيلًا! 🙏",
    "أفضل قرار اتخذته! المجموعة خاصة تمامًا — اسمي لا يظهر في أي مكان عام. حصلت على الوصول في دقائق. أنصح به 100%! 👏",
    "يستحق كل قرش! وصول لمجموعة VIP في 3 دقائق، عضوية مجهولة تمامًا والمحتوى الحصري على مستوى آخر. صفر ندم! 🔥",
    "كنت متشككًا في البداية، لكن رابط VIP وصل في 4 دقائق والمجموعة غير مرئية تمامًا من الخارج. لا أحد يعلم أنني عضو. صفر ندم! 💎",
    "الرابط وصل بسرعة فائقة وخصوصية مجموعة VIP تامة — لا أحد يعرف أنني بداخلها! المحتوى الحصري على مستوى مختلف. أفضل عملية شراء! 🚀",
  ],
};

function getFakeComments(lang: LangKey): Comment[] {
  const texts = COMMENT_TEXTS[lang] ?? COMMENT_TEXTS.en;
  return COMMENT_BASES.map((base, i) => ({ ...base, text: texts[i] ?? "" }));
}

/* ─── Lang Selector ─── */

function LangSelector({ lang, onChange, compact = false }: { lang: LangKey; onChange: (l: LangKey) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = LANGS[lang];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-lg transition-colors font-semibold text-gray-700 select-none ${
          compact ? "px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs" : "px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm"
        }`}
      >
        <span className="text-base leading-none">{t.flag}</span>
        <span>{t.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[60] min-w-[150px]">
          {(Object.keys(LANGS) as LangKey[]).map((key) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === key ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700"}`}
            >
              <span className="text-base">{LANGS[key].flag}</span>
              <span>{LANGS[key].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comments Section ─── */

function CommentsSection({ t, lang, primaryColor }: { t: LangData; lang: LangKey; primaryColor: string }) {
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const uc = localStorage.getItem("vip_user_comments");
      if (uc) setUserComments(JSON.parse(uc));
      const lk = localStorage.getItem("vip_liked");
      if (lk) setLiked(JSON.parse(lk));
    } catch { /**/ }
  }, []);

  const allComments = useMemo(() => {
    return [...userComments, ...getFakeComments(lang)];
  }, [userComments, lang]);

  const handleLike = (id: string) => {
    const updated = { ...liked, [id]: !liked[id] };
    setLiked(updated);
    try { localStorage.setItem("vip_liked", JSON.stringify(updated)); } catch { /**/ }
  };

  const handleSubmit = () => {
    if (!name.trim() || !text.trim()) return;
    const nc: Comment = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      flag: "🌍",
      initials: name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: "#6366f1",
      text: text.trim(),
      likes: 0,
      timeLabel: t.commentsJustNow,
      isUser: true,
    };
    const updated = [nc, ...userComments];
    setUserComments(updated);
    try { localStorage.setItem("vip_user_comments", JSON.stringify(updated)); } catch { /**/ }
    setName("");
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="w-full mt-12">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" style={{ color: primaryColor }} />
        <h3 className="text-gray-900 font-bold text-lg">{t.commentsTitle}</h3>
        <span className="text-xs text-white font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>
          {allComments.length}
        </span>
      </div>

      {/* Comment list */}
      <div className="space-y-3 mb-6">
        {allComments.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: c.color }}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">{c.name}</span>
                  <span className="text-base leading-none">{c.flag}</span>
                  {c.isUser && (
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">you</span>
                  )}
                  <span className="text-gray-400 text-xs ml-auto">{c.timeLabel}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
              </div>
            </div>
            {/* Like button */}
            <div className="flex items-center gap-1.5 mt-3 pl-12">
              <button
                onClick={() => handleLike(c.id)}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${liked[c.id] ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked[c.id] ? "fill-rose-500" : ""}`} />
                <span>{c.likes + (liked[c.id] ? 1 : 0)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy note */}

      {/* Comment form */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.commentsNamePlaceholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
        />
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.commentsTextPlaceholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-white"
        />
        {sent ? (
          <div className="w-full py-2.5 text-center text-sm font-semibold text-green-600 bg-green-50 rounded-lg">
            ✅ {t.commentsSent}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !text.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {t.commentsBtn}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Hooks ─── */

function useCountdown(mm: number, ss: number) {
  const [seconds, setSeconds] = useState(mm * 60 + ss);
  useEffect(() => { setSeconds(mm * 60 + ss); }, [mm, ss]);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  return { mm: String(Math.floor(seconds / 60)).padStart(2, "0"), ss: String(seconds % 60).padStart(2, "0") };
}

function useViewerCount(initial: number) {
  const [viewers, setViewers] = useState(initial);
  useEffect(() => { setViewers(initial); }, [initial]);
  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(initial - 30, Math.min(initial + 50, v + delta));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [initial]);
  return viewers;
}

function useTripleClick(cb: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);
  return useCallback(() => {
    countRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countRef.current >= 3) { countRef.current = 0; cb(); return; }
    timerRef.current = setTimeout(() => { countRef.current = 0; }, 1500);
  }, [cb]);
}

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}`;
  if (url.includes("youtube.com/embed/")) return url + (url.includes("?") ? "&" : "?") + "autoplay=1&mute=1";
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&muted=1&loop=1`;
  return null;
}

/* ─── Payment Modal ─── */

function PaymentModal({ onClose, paymentUrl, paymentButtonText, primaryColor, t, lang, onLangChange }: {
  onClose: () => void; paymentUrl: string; paymentButtonText: string; primaryColor: string;
  t: LangData; lang: LangKey; onLangChange: (l: LangKey) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 font-medium">{t.langLabel}</span>
          <LangSelector lang={lang} onChange={onLangChange} compact />
        </div>
        <div className="px-6 pb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}18` }}>
            <span className="text-2xl">💳</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 text-center mb-2">{t.modalTitle}</h2>
          <p className="text-gray-500 text-sm text-center leading-relaxed mb-5">{t.modalBody}</p>
          <div className="space-y-2.5 mb-5">
            {([t.step1, t.step2, t.step3] as string[]).map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: primaryColor }}>
                  {i + 1}
                </div>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { if (paymentUrl) window.open(paymentUrl, "_blank"); }}
            disabled={!paymentUrl}
            className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl transition-all mb-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Lock className="w-4 h-4" />
            {paymentButtonText || t.payBtn}
          </button>
          <button onClick={onClose} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */

export default function Landing() {
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [isPlaying, setIsPlaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [localVideo, setLocalVideo] = useState<string | null>(sessionVideoObjectUrl);
  const [lang, setLangState] = useState<LangKey>(getLang());

  const changeLang = (l: LangKey) => {
    setLangState(l);
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /**/ }
  };

  useEffect(() => {
    const onStorage = () => setSettings(loadSettings());
    window.addEventListener("storage", onStorage);
    const id = setInterval(() => { setSettings(loadSettings()); setLocalVideo(sessionVideoObjectUrl); }, 1500);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(id); };
  }, []);

  const t = LANGS[lang];
  const isDefault = lang === "en";

  const pageHeadline    = isDefault ? settings.headline          : t.headline;
  const pageSubheadline = isDefault ? settings.subheadline       : t.subheadline;
  const pageBonusText   = isDefault ? settings.bonusText         : t.bonusText;
  const pageCtaText     = isDefault ? settings.ctaText           : t.ctaText;
  const pageTelegramBtn = isDefault ? settings.telegramButtonText : t.telegramBtnText;

  const { mm, ss } = useCountdown(parseInt(settings.timerMinutes) || 4, parseInt(settings.timerSeconds) || 45);
  const viewers = useViewerCount(parseInt(settings.viewersCount) || 173);
  const handleHeadlineTripleClick = useTripleClick(() => setLocation("/admin"));

  const ctaCountRef = useRef(0);
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCtaClick = useCallback(() => {
    ctaCountRef.current += 1;
    if (ctaTimerRef.current) clearTimeout(ctaTimerRef.current);
    if (ctaCountRef.current >= 3) { ctaCountRef.current = 0; setLocation("/admin"); return; }
    setShowModal(true);
    ctaTimerRef.current = setTimeout(() => { ctaCountRef.current = 0; }, 1500);
  }, [setLocation]);

  const handleTelegramClick = () => {
    const msg = encodeURIComponent(settings.telegramAutoMessage);
    const link = settings.telegramLink.startsWith("http") ? settings.telegramLink : `https://t.me/${settings.telegramLink}`;
    window.open(`${link}?start=${msg}`, "_blank");
  };

  const embedUrl = localVideo ? null : getVideoEmbed(settings.videoUrl);
  const primaryColor = settings.primaryColor || "#dc2626";
  const accentColor = settings.accentColor || "#9333ea";

  const PAYMENTS = [
    { bg: "bg-blue-600", text: "PP", label: "PayPal" },
    { bg: "bg-gray-700", text: "VISA", label: "Visa" },
    { bg: "bg-orange-500", text: "₿", label: "Crypto" },
    { bg: "bg-teal-500", text: "USDT", label: "USDT" },
    { bg: "bg-gray-900", text: "Pay", label: "Apple Pay" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          paymentUrl={settings.paymentUrl}
          paymentButtonText={settings.paymentButtonText}
          primaryColor={primaryColor}
          t={t} lang={lang} onLangChange={changeLang}
        />
      )}

      {/* Top Banner */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="w-20" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full pulse-dot flex-shrink-0" style={{ backgroundColor: primaryColor }} />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">{t.banner}</span>
          </div>
          <div className="px-2.5 py-1 rounded text-sm font-bold font-mono text-white flex-shrink-0" style={{ backgroundColor: primaryColor }}>
            {mm}:{ss}
          </div>
        </div>
        <div className="w-20 flex justify-end">
          <LangSelector lang={lang} onChange={changeLang} compact />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 max-w-xl mx-auto w-full">
        <h1
          onClick={handleHeadlineTripleClick}
          className="text-3xl font-extrabold text-center text-gray-900 leading-tight mb-6 cursor-pointer select-none"
        >
          {pageHeadline.includes("VIP")
            ? <>
                {pageHeadline.split("VIP")[0]}
                <span style={{ color: accentColor }}>VIP</span>
                {pageHeadline.split("VIP").slice(1).join("VIP")}
              </>
            : pageHeadline}
        </h1>

        {/* Video */}
        <div className="w-full rounded-xl overflow-hidden bg-gray-900 relative mb-6 shadow-lg">
          <div className="aspect-video relative">
            {localVideo && isPlaying ? (
              <video src={localVideo} className="absolute inset-0 w-full h-full object-cover" controls autoPlay muted loop />
            ) : embedUrl && isPlaying ? (
              <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            ) : !isPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center cursor-pointer group" onClick={() => setIsPlaying(true)}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all">
                    <PlayCircle className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium opacity-80">{t.clickWatch}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <p className="text-white/60 text-sm">{t.videoNone}</p>
              </div>
            )}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot" />
              <span>{viewers} {t.watching}</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">{pageSubheadline}</h2>
        <p className="text-center text-gray-500 text-sm mb-8">{pageBonusText}</p>

        <button
          onClick={handleCtaClick}
          className="w-full max-w-sm flex items-center justify-center gap-2 text-white font-bold text-base py-4 px-6 rounded-full shadow-lg transition-all duration-150 select-none mb-3"
          style={{ backgroundColor: primaryColor }}
        >
          <Lock className="w-4 h-4" />
          {pageCtaText}
        </button>

        {settings.telegramLink && (
          <button
            onClick={handleTelegramClick}
            className="w-full max-w-sm flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1a8ec0] text-white font-semibold text-sm py-3.5 px-6 rounded-full shadow transition-all duration-150 mb-6"
          >
            <Send className="w-4 h-4" />
            {pageTelegramBtn}
          </button>
        )}

        {/* Payments */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
          {PAYMENTS.map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-1">
              <div className={`h-5 px-1.5 min-w-[32px] ${p.bg} rounded flex items-center justify-center`}>
                <span className="text-white text-[8px] font-bold">{p.text}</span>
              </div>
              <span className="text-gray-400 text-[10px]">{p.label}</span>
            </div>
          ))}
        </div>

        {/* Client Proofs */}
        {settings.proofs.length > 0 && (
          <div className="w-full mb-6">
            <h3 className="text-center text-gray-800 font-bold text-lg mb-4">{t.proofTitle}</h3>
            <div className="grid grid-cols-2 gap-3">
              {settings.proofs.map((proof) => (
                <div key={proof.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={proof.dataUrl} alt={proof.caption || "Prova"} className="w-full object-cover" />
                  {proof.caption && (
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-xs text-gray-600 text-center">{proof.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentsSection t={t} lang={lang} primaryColor={primaryColor} />
      </main>
    </div>
  );
}
