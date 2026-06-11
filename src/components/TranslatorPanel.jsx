import { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { speakText, stopSpeaking } from '../lib/tts';

const LANGS = [
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿', bcp: 'kk-KZ' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', bcp: 'ru-RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', bcp: 'en-US' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', bcp: 'tr-TR' },
  { code: 'zh', label: '中文', flag: '🇨🇳', bcp: 'zh-CN' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', bcp: 'de-DE' },
];

const APP_LANG_TO_CODE = { kz: 'kk', ru: 'ru', en: 'en' };

function langInfo(code) {
  return LANGS.find(l => l.code === code) || LANGS[0];
}

// Two-way voice/text translator. Used full-size on the /translator page and
// in compact form inside ChatWidget.
export default function TranslatorPanel({ compact = false }) {
  const { t, lang } = useLang();
  const myDefault = APP_LANG_TO_CODE[lang] || 'en';
  const localDefault = myDefault === 'ru' ? 'kk' : 'ru';

  const [langA, setLangA] = useState(myDefault);
  const [langB, setLangB] = useState(localDefault);
  const [speaker, setSpeaker] = useState('A');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const recognitionRef = useRef(null);
  const listRef = useRef(null);

  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognitionImpl;
  const ttsSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  function speak(text, langCode, id) {
    if (!ttsSupported || !text) return;
    if (id != null && speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    speakText(text, langInfo(langCode).bcp, {
      onStart: () => setSpeakingId(id ?? null),
      onEnd: () => setSpeakingId(prev => (prev === (id ?? null) ? null : prev)),
    });
  }

  async function sendMessage(spk, rawText) {
    const text = rawText.trim();
    if (!text || busy) return;

    const fromLang = spk === 'A' ? langA : langB;
    const toLang = spk === 'A' ? langB : langA;
    const id = Date.now();

    setMessages(prev => [...prev, { id, from: spk, original: text, fromLang, toLang, translated: null, error: false }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: fromLang, to: toLang }),
      });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      const translated = data.translated || text;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, translated } : m));
      speak(translated, toLang, id);
    } catch {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, translated: '', error: true } : m));
    } finally {
      setBusy(false);
    }
  }

  function startListening(spk) {
    if (!speechSupported || listening) return;
    const recog = new SpeechRecognitionImpl();
    recog.lang = langInfo(spk === 'A' ? langA : langB).bcp;
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      sendMessage(spk, text);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recognitionRef.current = recog;
    setSpeaker(spk);
    setListening(true);
    recog.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(speaker, input);
  }

  function LangSelect({ value, onChange }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="form-input"
        style={{ flex: 1, fontSize: compact ? 12 : 13, padding: compact ? '6px 8px' : '8px 10px', cursor: 'pointer' }}
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
    );
  }

  const listHeight = compact ? 220 : 400;
  const bubbleFont = compact ? 12 : 13;
  const translatedFont = compact ? 13 : 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 16 }}>
      {/* Language pickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {!compact && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.trnsl_you}</div>}
          <LangSelect value={langA} onChange={setLangA} />
        </div>
        <button
          onClick={() => { const a = langA, b = langB; setLangA(b); setLangB(a); }}
          title="⇄"
          style={{
            marginTop: compact ? 0 : 16, width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)',
            fontSize: compact ? 14 : 16, cursor: 'pointer', flexShrink: 0,
          }}
        >⇄</button>
        <div style={{ flex: 1 }}>
          {!compact && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.trnsl_local}</div>}
          <LangSelect value={langB} onChange={setLangB} />
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={listRef}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: compact ? 10 : 16, height: listHeight, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: 12 }}>
            {t.trnsl_empty}
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.from === 'A' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '10px 13px',
              borderRadius: m.from === 'A' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: m.from === 'A' ? 'var(--purple)' : 'var(--surface2)',
              border: m.from === 'A' ? 'none' : '1px solid var(--border)',
              color: m.from === 'A' ? '#fff' : 'var(--text)',
            }}>
              <div style={{ fontSize: bubbleFont, lineHeight: 1.5 }}>
                {langInfo(m.fromLang).flag} {m.original}
              </div>
              <div style={{
                marginTop: 6, paddingTop: 6, borderTop: `1px solid ${m.from === 'A' ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: translatedFont, fontWeight: 600, lineHeight: 1.5,
                color: m.error ? 'var(--red)' : (m.from === 'A' ? '#fff' : 'var(--gold)'),
              }}>
                <span>
                  {m.translated === null && !m.error
                    ? t.trnsl_translating
                    : m.error
                      ? t.trnsl_error
                      : <>{langInfo(m.toLang).flag} {m.translated}</>}
                </span>
                {ttsSupported && m.translated && (
                  <button
                    onClick={() => speak(m.translated, m.toLang, m.id)}
                    title={speakingId === m.id ? t.chat_stop_speak : t.chat_speak}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: translatedFont, lineHeight: 1, flexShrink: 0,
                      color: speakingId === m.id ? (m.from === 'A' ? '#fff' : 'var(--purple)') : 'inherit',
                      opacity: speakingId === m.id ? 1 : 0.7,
                      ...(speakingId === m.id ? { animation: 'pulse 1.2s infinite' } : {}),
                    }}
                  >{speakingId === m.id ? '⏹️' : '🔊'}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Speaker toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['A', 'B'].map(spk => (
          <button
            key={spk}
            onClick={() => setSpeaker(spk)}
            style={{
              flex: 1, padding: compact ? '6px 10px' : '8px 12px', borderRadius: 10, fontSize: compact ? 11 : 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${speaker === spk ? 'var(--purple)' : 'var(--border)'}`,
              background: speaker === spk ? 'rgba(108,99,255,0.12)' : 'transparent',
              color: speaker === spk ? 'var(--purple)' : 'var(--text2)',
            }}
          >
            {langInfo(spk === 'A' ? langA : langB).flag} {spk === 'A' ? t.trnsl_you : t.trnsl_local}
          </button>
        ))}
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? t.trnsl_listening : t.trnsl_placeholder}
          className="form-input"
          style={{ flex: 1, fontSize: compact ? 12 : 13 }}
          disabled={busy || listening}
        />
        {speechSupported && (
          <button
            type="button"
            onClick={() => listening ? stopListening() : startListening(speaker)}
            className="btn btn-glass"
            style={{
              padding: compact ? '0 12px' : '0 16px', fontSize: compact ? 15 : 18,
              ...(listening ? { background: 'rgba(255,71,87,0.15)', borderColor: 'rgba(255,71,87,0.4)', animation: 'pulse 1.2s infinite' } : {}),
            }}
          >🎤</button>
        )}
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn btn-primary"
          style={{ padding: compact ? '0 14px' : '0 18px', fontSize: compact ? 12 : 13, opacity: (busy || !input.trim()) ? 0.5 : 1 }}
        >{t.trnsl_send}</button>
      </form>
      {!speechSupported && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.trnsl_mic_unsupported}</div>
      )}
    </div>
  );
}
