import { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LangContext';

export default function ChatWidget() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(false);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, lang }),
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
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4 }}
            >×</button>
          </div>

          {/* Messages */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              alignSelf: 'flex-start', maxWidth: '85%', padding: '10px 13px', borderRadius: '4px 14px 14px 14px',
              background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
            }}>
              {t.chat_welcome}
            </div>

            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 13px',
                borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                background: m.role === 'user' ? 'var(--purple)' : 'var(--surface2)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                color: m.role === 'user' ? '#fff' : 'var(--text2)',
                fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {m.content || (loading && i === messages.length - 1 ? '…' : '')}
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
              placeholder={t.chat_placeholder}
              className="form-input"
              style={{ flex: 1, fontSize: 13 }}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ padding: '0 16px', opacity: (loading || !input.trim()) ? 0.5 : 1 }}
            >{t.chat_send}</button>
          </div>
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
