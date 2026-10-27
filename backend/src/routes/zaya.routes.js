const express = require('express');
const rateLimit = require('express-rate-limit');
const { plainText } = require('../utils/sanitizer');

const router = express.Router();
const assistantLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Zaya is taking a short pause. Please try again in a few minutes.' },
});

const systemPrompt = [
  'You are Zaya, the digital assistant for ZAYER Digital, a digital marketing and creative agency based in Tunis, Tunisia.',
  'Be helpful, clear, concise, welcoming, and honest. ZAYER Digital provides digital strategy, branding, social media, paid media, SEO, web design, and development.',
  'Support French, English, Modern Standard Arabic, Tunisian Darija, and Tunisian Arabizi. Reply in the language and script the visitor uses. Understand common Tunisian Arabizi spellings such as ch, kh, 3, 5, 7, and 9.',
  'ZAYER Academy provides HTML, CSS and JavaScript, AI-powered content creation, and MERN Stack training. Prices for other programmes depend on the brief.',
  'Upcoming ZAYER Academy training: "Cr\u00e9ation de contenu par l\'Intelligence Artificielle" (text, visuals, and video), led by trainer Marwan Slimani, October 30 to November 1, 2026 (3 days), at ZAYER HQ in Tunis. Price: 450 TND per person. Seats are limited. Book by phone or WhatsApp at +216 92 150 888.',
  'The agency is based at 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia and serves clients globally. In French, the address is 28 Av. Kheireddine Pacha, Tunis 1073, Tunisie. Public email: contact@zayerdigital.tn. Main phone numbers: 48 134 666 and 48 138 020.',
  'Never invent client results, guarantees, prices, or service terms. Never request passwords, payment card details, or sensitive personal information. Never output emoji characters.',
].join(' ');

const noEmoji = (value) => String(value || '').replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\u200D\uFE0F\u20E3]/gu, '').trim();

function detectLanguage(message) {
  if (/[\u0600-\u06ff]/u.test(message)) return 'ar';
  const lower = message.toLowerCase();
  if (/\b(chneya|chnowa|kifeh|kif|najem|tnajem|fama|bch|nheb|a3tini|3lech|wa9tech|brabi|saha)\b/.test(lower) || /\b[3579][a-z]/.test(lower)) return 'ar-tun';
  if (/\b(hello|hi|what|how|tell|your|our|the|we|i|does|do|can|could|please|is|are|training|courses?)\b/.test(lower)) return 'en';
  if (/[àâçéèêëîïôùûüÿœæ]/i.test(message) || /\b(bonjour|salut|merci|comment|combien|quels?|quelle|quelles|vous|vos|votre|formation|formations|cours|devis|tarif|prix|agence|contacter|joindre|besoin|avec|pour|est|sont|notre)\b/i.test(lower)) return 'fr';
  return 'en';
}

function fallbackReply(message) {
  const text = String(message || '').toLowerCase();
  const language = detectLanguage(message || '');
  const asksContact = /\b(contact|email|mail|phone|tel|number|call|reach|contacter|joindre|telephone|whatsapp|booking|book|reservation)\b|r\u00e9servation/i.test(text);
  const asksTraining = /\b(train|training|course|academy|formation|formations|learn|study|html|css|javascript|mern|prompt|ai|ia|marwan)\b|content creation|intelligence artificielle|cr[e\u00e9]ation de contenu/i.test(text);
  const asksAiTraining = /\b(ai|ia|marwan)\b|content creation|intelligence artificielle|cr[e\u00e9]ation de contenu/i.test(text);
  const asksPrice = /\b(price|pricing|cost|quote|devis|tarif|prix|combien)\b|\u00d8\u00b3\u00b9\u00b1\u00b8|\u00d9\u201a\u00d8\u00af\u00d8\u00a7\u00d8\u00b4|\u00d8\u00a8\u00d9\u201a\u00d8\u00af\u00d8\u00a7\u00d8\u00b4/.test(text);
  const contact = 'You can visit ZAYER Digital at 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia, email contact@zayerdigital.tn, or call 48 134 666 / 48 138 020.';
  const trainingEn = 'ZAYER Academy offers HTML, CSS and JavaScript, AI-powered content creation, and MERN Stack training. Upcoming: AI-powered content creation with Marwan Slimani, October 30 to November 1, 2026 (3 days), at ZAYER HQ in Tunis. It covers text, visuals, and video and costs 450 TND per person. Seats are limited. Book by phone or WhatsApp at +216 92 150 888.';
  const trainingFr = 'ZAYER Academy propose des formations en HTML, CSS et JavaScript, en cr\u00e9ation de contenu par l\u2019IA, ainsi qu\u2019en MERN Stack. Prochaine session avec Marwan Slimani : du 30 octobre au 1er novembre 2026 (3 jours), au si\u00e8ge de ZAYER \u00e0 Tunis. Le programme couvre les textes, les visuels et les vid\u00e9os. Tarif : 450 TND par personne. Places limit\u00e9es. R\u00e9servation par t\u00e9l\u00e9phone ou WhatsApp au +216 92 150 888.';
  const services = 'ZAYER Digital is a Tunis-based digital marketing and creative agency offering strategy, branding, social media, paid media, SEO, web design, and development.';
  const replies = {
    en: asksContact ? (asksAiTraining ? 'For the AI content creation training booking, call or WhatsApp +216 92 150 888.' : contact) : asksTraining ? trainingEn : asksPrice ? 'Prices for other programmes depend on your brief. Contact contact@zayerdigital.tn or call 48 134 666 / 48 138 020.' : services + ' Tell me what you are looking for and I can point you in the right direction.',
    fr: asksContact ? (asksAiTraining ? 'Pour r\u00e9server la formation IA, appelez ou \u00e9crivez sur WhatsApp au +216 92 150 888.' : 'Vous pouvez vous rendre au si\u00e8ge de ZAYER Digital au 28 Av. Kheireddine Pacha, Tunis 1073, Tunisie, \u00e9crire \u00e0 contact@zayerdigital.tn ou appeler le 48 134 666 / 48 138 020.') : asksTraining ? trainingFr : asksPrice ? 'Les tarifs des autres programmes d\u00e9pendent de votre brief. \u00c9crivez \u00e0 contact@zayerdigital.tn ou appelez le 48 134 666 / 48 138 020.' : 'ZAYER Digital est une agence de marketing digital et de cr\u00e9ation bas\u00e9e au 28 Av. Kheireddine Pacha, Tunis 1073, Tunisie. Nous proposons strat\u00e9gie, branding, r\u00e9seaux sociaux, publicit\u00e9, SEO, web design et d\u00e9veloppement. Comment pouvons-nous vous aider ?',
    ar: asksContact ? 'يمكنك زيارة ZAYER Digital في 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia، أو التواصل عبر contact@zayerdigital.tn أو الاتصال على 48 134 666 أو 48 138 020.' : asksTraining ? 'تقدم ZAYER Academy دورات في HTML وCSS وJavaScript، والذكاء الاصطناعي وهندسة الأوامر، وMERN Stack.' : asksPrice ? 'تختلف الأسعار حسب تفاصيل المشروع. تواصل معنا عبر contact@zayerdigital.tn أو على 48 134 666 أو 48 138 020 للحصول على عرض مناسب.' : 'ZAYER Digital وكالة للتسويق الرقمي والإبداع في 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia. نقدم الاستراتيجية، وبناء العلامات التجارية، وإدارة الشبكات الاجتماعية، والإعلانات، وتحسين محركات البحث، وتصميم وتطوير المواقع. كيف يمكننا مساعدتك؟',
    'ar-tun': asksContact ? 'Tnajjem تزور ZAYER Digital fi 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia, tetصل b contact@zayerdigital.tn wala t3ayet 48 134 666 / 48 138 020.' : asksTraining ? 'ZAYER Academy 3andha formations HTML, CSS w JavaScript, AI w Prompt Engineering, w MERN Stack.' : asksPrice ? 'Es3ar el projet yet7added 7asb el brief. ابعثلنا 3la contact@zayerdigital.tn wala 3ayet 48 134 666 / 48 138 020 باش نحكيو على احتياجاتك.' : 'ZAYER Digital agence marketing digital w creative fi 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia. N3awnou fel strategie, branding, social media, publicite, SEO, web design w developpement. Chnowa t7eb ta3ref?',
  };
  return noEmoji(replies[language]);
}

const usableApiKey = (value) => Boolean(value && !/(your[_ -]?groq|placeholder|changeme|change[_ -]?me|replace[_ -]?me|<.*>)/i.test(value.trim()) && value.trim().length > 20);
const configuredGroqModel = process.env.GROQ_MODEL?.trim();
const groqModel = configuredGroqModel && !/whisper/i.test(configuredGroqModel)
  ? configuredGroqModel
  : 'openai/gpt-oss-120b';

router.post('/', assistantLimiter, async (req, res) => {
  const inputHistory = Array.isArray(req.body?.messages)
    ? req.body.messages.slice(-12)
    : [
      ...(Array.isArray(req.body?.history) ? req.body.history.slice(-10) : []),
      ...(req.body?.message ? [{ role: 'user', content: req.body.message }] : []),
    ];
  const history = inputHistory.filter((entry) => ['user', 'assistant'].includes(entry?.role) && typeof entry?.content === 'string')
    .map((entry) => ({ role: entry.role, content: noEmoji(plainText(entry.content, 1500)) }))
    .filter((entry) => entry.content);
  const latestUserMessage = [...history].reverse().find((entry) => entry.role === 'user')?.content || '';
  const fallback = () => res.status(200).json({ reply: fallbackReply(latestUserMessage) });
  const apiKey = process.env.GROQ_API_KEY;
  if (!usableApiKey(apiKey) || !latestUserMessage) return fallback();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: groqModel, messages: [{ role: 'system', content: systemPrompt }, ...history], temperature: 0.55, max_completion_tokens: 500 }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) {
      console.warn(`[zaya] Groq request failed with status ${response.status}`);
      return fallback();
    }
    const result = await response.json();
    const answer = noEmoji(plainText(result.choices?.[0]?.message?.content, 3500));
    if (!answer) return fallback();
    return res.status(200).json({ reply: answer });
  } catch (error) {
    console.warn(`[zaya] Groq request failed: ${error.name || 'unknown error'}`);
    return fallback();
  }
});

module.exports = router;
