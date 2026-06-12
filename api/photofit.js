import { generateImage } from 'ai';
import { google } from '@ai-sdk/google';

export const config = { runtime: 'edge' };

function buildPrompt({ gender, height, weight, country, clothing, specialMarks }) {
  const parts = [gender === 'Female' ? 'a woman' : gender === 'Male' ? 'a man' : 'a person'];
  if (height) parts.push(`approximately ${height} cm tall`);
  if (weight) parts.push(`approximately ${weight} kg`);
  if (country) parts.push(`from ${country}`);
  if (clothing) parts.push(`wearing ${clothing}`);
  if (specialMarks) parts.push(`with distinguishing features: ${specialMarks}`);

  return `Police-style composite sketch (photofit / identikit), black-and-white pencil illustration, front-facing head-and-shoulders portrait of ${parts.join(', ')}. Neutral expression, plain background, forensic sketch style — an approximate artistic reconstruction for a missing-person search, not a real photograph.`;
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

  try {
    const { image } = await generateImage({
      model: google.image('gemini-2.5-flash-image'),
      prompt: buildPrompt(body || {}),
    });

    return new Response(JSON.stringify({
      image: `data:${image.mediaType};base64,${image.base64}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'generation_failed', message: String(err?.message || err), cause: err?.cause ? String(err.cause?.message || err.cause) : undefined }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
