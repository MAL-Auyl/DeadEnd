import { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { useTrip } from '../context/TripContext';
import TranslatorPanel from './TranslatorPanel';
import { speakText, stopSpeaking } from '../lib/tts';

const BCP47 = { kz: 'kk-KZ', ru: 'ru-RU', en: 'en-US' };

export default function ChatWidget() {
  const { t, lang } = useLang();
  const { user } = useTrip();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);

  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognitionImpl;
  const ttsSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  function speak(text, id) {
    if (!ttsSupported || !text) return;
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    speakText(text, BCP47[lang] || 'en-US', {
      onStart: () => setSpeakingId(id),
      onEnd: () => setSpeakingId(prev => (prev === id ? null : prev)),
    });
  }

  async function send(overrideText, fromVoice = false) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(false);
    setLoading(true);

    const profile = user ? {
      allergies: user.allergies,
      bloodType: user.bloodType,
      height: user.height,
      weight: user.weight,
      specialMarks: user.specialMarks,
    } : null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, lang, profile }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      if (voiceOn || fromVoice) speak(acc, nextMessages.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function toggleListening() {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recog = new SpeechRecognitionImpl();
    recog.lang = BCP47[lang] || 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      if (text) send(text, true);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recognitionRef.current = recog;
    setListening(true);
    recog.start();
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {open && (
        <div style={{
          width: 340, maxWidth: 'calc(100vw - 48px)', height: 480, maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(19,16,9,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)', borderRadius: 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{t.chat_title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.chat_subtitle}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {ttsSupported && (
                <button
                  onClick={() => setVoiceOn(v => !v)}
                  title={voiceOn ? t.chat_voice_on : t.chat_voice_off}
                  style={{
                    background: voiceOn ? 'rgba(108,99,255,0.15)' : 'transparent',
                    border: 'none', borderRadius: 8, color: voiceOn ? 'var(--purple)' : 'var(--text3)',
                    fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 6,
                  }}
                >{voiceOn ? '🔊' : '🔇'}</button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4 }}
              >×</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {[
              { key: 'chat', label: `🤖 ${t.chat_tab_ai}` },
              { key: 'translate', label: `🌐 ${t.chat_tab_translate}` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                style={{
                  flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: mode === tab.key ? 'var(--surface2)' : 'transparent',
                  border: 'none', borderBottom: `2px solid ${mode === tab.key ? 'var(--purple)' : 'transparent'}`,
                  color: mode === tab.key ? 'var(--text)' : 'var(--text3)',
                }}
              >{tab.label}</button>
            ))}
          </div>

          {mode === 'chat' ? (
            <>
              {/* Messages */}
              <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  alignSelf: 'flex-start', maxWidth: '85%', padding: '10px 13px', borderRadius: '4px 14px 14px 14px',
                  background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
                }}>
                  {t.chat_welcome}
                </div>

                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{
                      padding: '10px 13px',
                      borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      background: m.role === 'user' ? 'var(--purple)' : 'var(--surface2)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                      color: m.role === 'user' ? '#fff' : 'var(--text2)',
                      fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    }}>
                      {m.content || (loading && i === messages.length - 1 ? '…' : '')}
                    </div>
                    {ttsSupported && m.role === 'assistant' && m.content && !(loading && i === messages.length - 1) && (
                      <button
                        onClick={() => speak(m.content, i)}
                        title={speakingId === i ? t.chat_stop_speak : t.chat_speak}
                        style={{
                          alignSelf: 'flex-start', background: 'transparent', border: 'none',
                          color: speakingId === i ? 'var(--purple)' : 'var(--text3)', fontSize: 13, cursor: 'pointer', padding: '0 4px',
                          ...(speakingId === i ? { animation: 'pulse 1.2s infinite' } : {}),
                        }}
                      >{speakingId === i ? '⏹️' : '🔊'}</button>
                    )}
                  </div>
                ))}

                {error && (
                  <div style={{
                    alignSelf: 'flex-start', maxWidth: '85%', padding: '10px 13px', borderRadius: '4px 14px 14px 14px',
                    background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', fontSize: 13, color: 'var(--red)',
                  }}>
                    {t.chat_error}
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={listening ? t.chat_listening : t.chat_placeholder}
                  className="form-input"
                  style={{ flex: 1, fontSize: 13 }}
                  disabled={loading || listening}
                />
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={loading}
                    className="btn btn-glass"
                    style={{
                      padding: '0 14px', fontSize: 16,
                      ...(listening ? { background: 'rgba(255,71,87,0.15)', borderColor: 'rgba(255,71,87,0.4)', animation: 'pulse 1.2s infinite' } : {}),
                    }}
                  >🎤</button>
                )}
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 16px', opacity: (loading || !input.trim()) ? 0.5 : 1 }}
                >{t.chat_send}</button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              <TranslatorPanel compact />
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--purple)', color: '#fff', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(108,99,255,0.4)',
        }}
      >{open ? '×' : '💬'}</button>
    </div>
  );
}
