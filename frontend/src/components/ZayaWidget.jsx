import { useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw, Send, X } from 'lucide-react';
import { api } from '../lib/api';
import { useLang } from '../context/LangContext';
import widgetStyles from '../styles/zaya-widget.css?inline';

const initialMessage = (lang) => lang === 'fr'
  ? 'Bonjour, je suis Zaya, l’assistante de ZAYER Digital. Comment puis-je vous aider ?'
  : 'Hello, I am Zaya, the assistant at ZAYER Digital. How can I help?';
const stripEmoji = (value) => String(value || '').replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\u200D\uFE0F\u20E3]/gu, '');

const quickPrompts = [
  { key: 'services', prompt: 'What services does ZAYER Digital offer?', promptFr: 'Quels services propose ZAYER Digital ?', en: 'Our services', fr: 'Nos services' },
  { key: 'training', prompt: 'Tell me about ZAYER Academy training programmes.', promptFr: 'Parle-moi des formations de ZAYER Academy.', en: 'Training', fr: 'Formations' },
  { key: 'contact', prompt: 'How can I contact ZAYER Digital about a project?', promptFr: 'Comment contacter ZAYER Digital pour un projet ?', en: 'Contact us', fr: 'Nous contacter' },
];

export default function ZayaWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [{ role: 'bot', content: initialMessage(lang) }]);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    setMessages((current) => current.length === 1 && current[0].role === 'bot'
      ? [{ role: 'bot', content: initialMessage(lang) }]
      : current);
  }, [lang]);

  const reset = () => setMessages([{ role: 'bot', content: initialMessage(lang) }]);

  async function sendMessage(event, prompt = message) {
    event?.preventDefault();
    const clean = stripEmoji(prompt).trim();
    if (!clean || busy) return;
    const history = [...messages, { role: 'user', content: clean }];
    setMessages(history);
    setMessage('');
    setOpen(true);
    setBusy(true);
    try {
      const result = await api.post('/api/zaya-assistant', { messages: history.slice(-12).map(({ role, content }) => ({ role: role === 'bot' ? 'assistant' : role, content })) });
      setMessages((current) => [...current, { role: 'bot', content: result.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'bot', content: error.message || (lang === 'fr' ? 'Zaya est momentanément indisponible.' : 'Zaya is temporarily unavailable.') }]);
    } finally {
      setBusy(false);
    }
  }

  return <div id="zayer-chatbot-root">
    <style>{widgetStyles}</style>
    <button id="zaya-launcher" type="button" aria-label={open ? (lang === 'fr' ? 'Fermer l’assistant Zaya' : 'Close Zaya assistant') : (lang === 'fr' ? 'Ouvrir l’assistant Zaya' : 'Open Zaya AI assistant')} aria-expanded={open} aria-controls="zaya-window" onClick={() => setOpen((value) => !value)}>
      <span className="zaya-bot" aria-hidden="true">
        <span className="zaya-bot-antenna" />
        <span className="zaya-bot-ear left" />
        <span className="zaya-bot-ear right" />
        <span className="zaya-bot-head">
          <span className="zaya-bot-face"><span className="zaya-bot-eye" /><span className="zaya-bot-eye" /></span>
          <span className="zaya-bot-mouth" />
        </span>
        <span className="zaya-bot-arm left" />
        <span className="zaya-bot-arm right" />
        <span className="zaya-bot-body"><span className="zaya-bot-core" /></span>
        <span className="zaya-bot-leg left" />
        <span className="zaya-bot-leg right" />
        <span className="zaya-flight-trail" />
      </span>
      <span className="zaya-launch-label">{open ? (lang === 'fr' ? 'Fermer' : 'Close') : (lang === 'fr' ? 'Parler à Zaya' : 'Ask Zaya')}</span>
    </button>
    <section id="zaya-window" className={open ? 'open' : ''} role="dialog" aria-label={lang === 'fr' ? 'Discuter avec Zaya' : 'Chat with Zaya'} aria-modal="false" aria-hidden={!open}>
      <header className="zaya-chat-head">
        <div className="zaya-head-avatar"><Bot aria-hidden="true" /></div>
        <div className="zaya-head-copy"><strong>Zaya · ZAYER Digital</strong><span>{lang === 'fr' ? 'Assistante IA · En ligne' : 'AI assistant · Online'}</span></div>
        <button id="zaya-reset" type="button" aria-label={lang === 'fr' ? 'Nouvelle conversation' : 'Start a new chat'} onClick={reset}><RefreshCw size={15} /></button>
        <button id="zaya-close" type="button" aria-label={lang === 'fr' ? 'Fermer la conversation' : 'Close chat'} onClick={() => setOpen(false)}><X size={18} /></button>
      </header>
      <div className="zaya-chat-body" id="zaya-messages" ref={bodyRef} aria-live="polite">
        {messages.map((entry, index) => <div className={`zaya-message ${entry.role}`} key={`${entry.role}-${index}`}>{entry.content}</div>)}
        <div className={`zaya-chat-typing ${busy ? 'show' : ''}`} aria-label={lang === 'fr' ? 'Zaya écrit' : 'Zaya is typing'}><i></i><i></i><i></i></div>
      </div>
      <div className="zaya-quick-prompts">
        {quickPrompts.map((prompt) => <button className="zaya-chip" type="button" key={prompt.key} disabled={busy} onClick={(event) => sendMessage(event, lang === 'fr' ? prompt.promptFr : prompt.prompt)}>{lang === 'fr' ? prompt.fr : prompt.en}</button>)}
      </div>
      <form className="zaya-composer" onSubmit={(event) => sendMessage(event)}>
        <textarea id="zaya-input" ref={inputRef} rows="1" maxLength="1500" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} placeholder={lang === 'fr' ? 'Écrivez votre message…' : 'Ask us anything…'} aria-label={lang === 'fr' ? 'Votre message' : 'Your message'} />
        <button id="zaya-send" type="submit" aria-label={lang === 'fr' ? 'Envoyer le message' : 'Send message'} disabled={busy || !message.trim()}><Send size={19} /></button>
      </form>
      <div className="zaya-chat-privacy">{lang === 'fr' ? 'Réponses générées par IA. Ne partagez pas de données sensibles.' : 'AI-generated replies. Do not share sensitive information.'}</div>
    </section>
  </div>;
}
