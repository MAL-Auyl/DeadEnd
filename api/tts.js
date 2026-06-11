export const config = { runtime: 'edge' };

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

// Google Cloud Text-to-Speech voices — Wavenet for ru/en (natural, 1M free
// chars/month), Standard for kk since it's the only Kazakh voice available.
const VOICES = {
  'ru-RU': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-D' },
  'en-US': { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
  'kk-KZ': { languageCode: 'kk-KZ', name: 'kk-KZ-Standard-A' },
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!GOOGLE_TTS_API_KEY) {
    return new Response('TTS not configured', { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { text, lang } = body || {};
  if (!text || typeof text !== 'string') {
    return new Response('Missing text', { status: 400 });
  }

  const voice = VOICES[lang];
  if (!voice) {
    return new Response('Unsupported language', { status: 422 });
  }

  const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: text.slice(0, 1000) },
      voice,
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.97 },
    }),
  });

  if (!r.ok) {
    return new Response('TTS upstream error', { status: 502 });
  }

  const { audioContent } = await r.json();
  if (!audioContent) {
    return new Response('TTS upstream error', { status: 502 });
  }

  const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
  return new Response(bytes, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  });
}
