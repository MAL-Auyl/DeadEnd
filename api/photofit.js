export const config = { runtime: 'edge' };

const HF_MODEL = 'black-forest-labs/FLUX.1-schnell';

function buildPrompt({ gender, height, weight, country, clothing, specialMarks }) {
  const parts = [gender === 'Female' ? 'a woman' : gender === 'Male' ? 'a man' : 'a person'];
  if (height) parts.push(`approximately ${height} cm tall`);
  if (weight) parts.push(`approximately ${weight} kg`);
  if (country) parts.push(`from ${country}`);
  if (clothing) parts.push(`wearing ${clothing}`);
  if (specialMarks) parts.push(`with distinguishing features: ${specialMarks}`);

  return `Police-style composite sketch (photofit / identikit), black-and-white pencil illustration, front-facing head-and-shoulders portrait of ${parts.join(', ')}. Neutral expression, plain background, forensic sketch style — an approximate artistic reconstruction for a missing-person search, not a real photograph.`;
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function requestImage(prompt, token) {
  return fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(body || {});

  try {
    let res = await requestImage(prompt, token);

    // Model cold start — wait once for it to load, then retry
    if (res.status === 503) {
      await new Promise(r => setTimeout(r, 8000));
      res = await requestImage(prompt, token);
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'generation_failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mediaType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = bufferToBase64(await res.arrayBuffer());

    return new Response(JSON.stringify({ image: `data:${mediaType};base64,${base64}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'generation_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
