// Shared text-to-speech helper: picks the most natural-sounding voice
// available for a language instead of the OS default robotic voice.

let voicesPromise = null;

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

// Speaks `text` in `bcpLang` (e.g. 'ru-RU'). Returns the SpeechSynthesisUtterance
// so callers can attach onstart/onend handlers, or pass them via `opts`.
export async function speakText(text, bcpLang, { onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window) || !text) return null;
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

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
