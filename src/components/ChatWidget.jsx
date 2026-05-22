import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Send, X, Minimize2, Maximize2, Trash2, Sparkles } from 'lucide-react';
import { getReply, getWelcomeMessage, QUICK_SUGGESTIONS } from '../utils/chatAssistant';

const STORAGE_KEY = 'ai-news-chat-history';
const STREAM_CHARS_PER_TICK = 3;
const STREAM_TICK_MS = 14;

function loadStoredMessages(pathname) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [{ id: 'welcome', role: 'assistant', ...getWelcomeMessage(pathname) }];
}

function renderRichText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ');
    const content = isBullet ? trimmed.slice(2) : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
    if (isBullet) {
      return (
        <div key={idx} className="flex gap-2 my-0.5">
          <span className="text-gray-400 dark:text-gray-500 select-none">•</span>
          <span className="flex-1">{parts}</span>
        </div>
      );
    }
    if (line === '') return <div key={idx} className="h-2" />;
    return <div key={idx}>{parts}</div>;
  });
}

function NewsLinkCard({ link, onClick }) {
  return (
    <Link
      to={link.href}
      onClick={onClick}
      className="group flex gap-2.5 p-2 -mx-1 rounded-md border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-dark-bg transition-all"
    >
      {link.image && (
        <img
          src={link.image}
          alt=""
          loading="lazy"
          className="w-12 h-12 object-cover rounded shrink-0 bg-gray-200 dark:bg-gray-700"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:underline">
          {link.label}
        </p>
        {link.meta && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {link.meta}
          </p>
        )}
      </div>
    </Link>
  );
}

function MessageBubble({ message, onLinkClick, isStreaming }) {
  const isUser = message.role === 'user';
  const hasNewsLinks = message.links?.some((l) => l.image);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div
        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={10} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
              AI Asistan
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {renderRichText(message.text)}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-current opacity-60 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        {!isStreaming && message.links?.length > 0 && (
          <div className={`mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 ${hasNewsLinks ? 'space-y-1.5' : 'space-y-2'}`}>
            {message.links.map((link, i) =>
              link.image ? (
                <NewsLinkCard key={`${link.href}-${i}`} link={link} onClick={onLinkClick} />
              ) : (
                <Link
                  key={`${link.href}-${i}`}
                  to={link.href}
                  onClick={onLinkClick}
                  className="block font-semibold underline hover:opacity-70 text-xs"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionChips({ suggestions, onSelect, disabled }) {
  if (!suggestions?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          className="text-xs px-2.5 py-1 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-40"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Sparkles size={12} className="opacity-60" />
        <span className="inline-flex gap-0.5 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}

export default function ChatWidget({ news = [], loading = false }) {
  const location = useLocation();
  const articleId = location.pathname.match(/^\/haber\/([^/]+)/)?.[1];
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => loadStoredMessages(location.pathname));
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const streamTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const currentArticle = useMemo(() => {
    if (!articleId || !news.length) return null;
    return news.find((item) => item.id === articleId) || null;
  }, [articleId, news]);

  const lastSuggestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].suggestions?.length) {
        return messages[i].suggestions;
      }
    }
    return QUICK_SUGGESTIONS.map((s) => s.label);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen, scrollToBottom]);

  useEffect(() => {
    try {
      const persistable = messages.map((m) => ({ ...m, _streaming: undefined }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) setIsFullscreen(false);
        else setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    if (!isOpen || isFullscreen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const closePanel = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  const cancelStreaming = () => {
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
    setStreamingId(null);
  };

  const clearChat = () => {
    cancelStreaming();
    setMessages([{ id: 'welcome', role: 'assistant', ...getWelcomeMessage(location.pathname) }]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const streamReply = (reply) => {
    const id = `assistant-${Date.now()}`;
    const fullText = reply.text || '';
    setStreamingId(id);
    setMessages((prev) => [
      ...prev,
      { id, role: 'assistant', text: '', links: [], suggestions: undefined },
    ]);

    let i = 0;
    const tick = () => {
      i = Math.min(i + STREAM_CHARS_PER_TICK, fullText.length);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: fullText.slice(0, i) } : m))
      );
      if (i < fullText.length) {
        streamTimeoutRef.current = setTimeout(tick, STREAM_TICK_MS);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, text: fullText, links: reply.links || [], suggestions: reply.suggestions }
              : m
          )
        );
        setStreamingId(null);
      }
    };
    tick();
  };

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping || streamingId) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      links: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const delay = 300 + Math.random() * 300;
    typingTimeoutRef.current = setTimeout(() => {
      const reply = getReply(trimmed, {
        news,
        loading,
        pathname: location.pathname,
        currentArticle,
      });
      setIsTyping(false);
      streamReply(reply);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const isBusy = isTyping || !!streamingId;

  const panelClass = isFullscreen
    ? 'fixed inset-2 sm:inset-6 w-auto h-auto'
    : 'mb-3 w-[calc(100vw-2rem)] sm:w-[380px] h-[560px] max-h-[calc(100vh-6rem)]';

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.22s ease-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50" ref={panelRef}>
        {isOpen && (
          <div
            className={`${panelClass} flex flex-col rounded-lg border-2 border-black dark:border-white bg-white dark:bg-dark-card shadow-2xl overflow-hidden animate-slideUp`}
            role="dialog"
            aria-label="AI Asistan"
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Bot size={20} className="text-black dark:text-white shrink-0" />
                <span className="font-serif font-bold text-black dark:text-white truncate">AI Asistan</span>
                <span className="ai-badge text-[10px] py-0.5 shrink-0">Beta</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  aria-label="Sohbeti temizle"
                  title="Sohbeti temizle"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline-flex"
                  aria-label={isFullscreen ? 'Küçült' : 'Tam ekran'}
                  title={isFullscreen ? 'Küçült' : 'Tam ekran'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-1.5 text-black dark:text-white hover:opacity-70 transition-opacity"
                  aria-label="Sohbeti kapat"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${isFullscreen ? 'max-w-3xl w-full mx-auto' : ''}`}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onLinkClick={closePanel}
                  isStreaming={msg.id === streamingId}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className={isFullscreen ? 'max-w-3xl w-full mx-auto' : ''}>
              <SuggestionChips
                suggestions={lastSuggestions}
                onSelect={sendMessage}
                disabled={isBusy}
              />

              <form
                onSubmit={handleSubmit}
                className="flex gap-2 px-3 py-3 border-t border-gray-200 dark:border-dark-border shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    currentArticle ? 'Özet, benzer haberler...' : 'Bir soru yazın...'
                  }
                  disabled={isBusy}
                  className="flex-1 px-3 py-2 text-sm border-2 border-black dark:border-white bg-white dark:bg-dark-bg text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-50"
                  aria-label="Mesaj yaz"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isBusy}
                  className="p-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white disabled:opacity-40 hover:opacity-80 transition-opacity"
                  aria-label="Gönder"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-lg hover:scale-105 transition-transform"
            aria-label="AI Asistanı aç"
          >
            <Bot size={24} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-black" />
          </button>
        )}
      </div>
    </>
  );
}
