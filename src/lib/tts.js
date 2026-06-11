// Shared text-to-speech helper. Tries the Google Cloud TTS-backed /api/tts
// endpoint for a natural human voice (kk/ru/en), falling back to the
// browser's SpeechSynthesis (with the best available system voice) if the
// API isn't configured or the request fails.

const SERVER_TTS_LANGS = new Set(['ru-RU', 'en-US', 'kk-KZ']);

let voicesPromise = null;
let currentAudio = null;

function loadVoices() {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise(resolve => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) { resolve(existing); return; }
    synth.onvoiceschanged = () => resolve(synth.getVoices());
    // Some browsers never fire onvoiceschanged — fall back after a beat.
    setTimeout(() => resolve(synth.getVoices()), 500);
  });
  return voicesPromise;
}

// Prefer high-quality "Natural"/"Neural"/"Online" voices, then Google voices,
// then any voice that matches the language exactly, then any voice for the language family.
function pickVoice(voices, bcpLang) {
  const lower = bcpLang.toLowerCase();
  const family = lower.split('-')[0];
  const sameLang = voices.filter(v => v.lang.toLowerCase() === lower);
  const sameFamily = voices.filter(v => v.lang.toLowerCase().startsWith(family));
  const pool = sameLang.length ? sameLang : sameFamily;
  if (!pool.length) return null;

  const qualityRe = /natural|neural|online|premium|enhanced|wavenet/i;
  return (
    pool.find(v => qualityRe.test(v.name)) ||
    pool.find(v => /google/i.test(v.name)) ||
    sameLang[0] ||
    pool[0]
  );
}

async function speakWithBrowser(text, bcpLang, { onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window)) return null;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = bcpLang;
  utter.rate = 0.98;
  utter.pitch = 1.05;

  const voices = await loadVoices();
  const voice = pickVoice(voices, bcpLang);
  if (voice) utter.voice = voice;

  if (onStart) utter.onstart = onStart;
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();

  synth.speak(utter);
  return utter;
}

// Tries the Google Cloud TTS proxy. Returns the playing Audio element, or
// null if the API isn't available/configured (caller should fall back).
async function speakWithServer(text, bcpLang, { onStart, onEnd } = {}) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang: bcpLang }),
  });
  if (!res.ok) return null;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  const cleanup = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
    onEnd?.();
  };
  audio.onplay = () => onStart?.();
  audio.onended = cleanup;
  audio.onerror = cleanup;

  currentAudio = audio;
  await audio.play();
  return audio;
}

// Speaks `text` in `bcpLang` (e.g. 'ru-RU'). Returns the SpeechSynthesisUtterance
// or Audio element so callers can pass onStart/onEnd handlers via `opts`.
export async function speakText(text, bcpLang, opts = {}) {
  if (!text) return null;
  stopSpeaking();

  if (SERVER_TTS_LANGS.has(bcpLang)) {
    try {
      const playing = await speakWithServer(text, bcpLang, opts);
      if (playing) return playing;
    } catch {
      // fall through to browser TTS
    }
  }

  return speakWithBrowser(text, bcpLang, opts);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
