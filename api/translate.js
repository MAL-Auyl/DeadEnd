import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const config = { runtime: 'edge' };

const LANG_NAMES = {
  kk: 'Kazakh', ru: 'Russian', en: 'English',
  tr: 'Turkish', zh: 'Chinese', de: 'German', fr: 'French',
};

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

  const { text, from, to } = body || {};
  if (!text || !to) {
    return new Response('Missing text/to', { status: 400 });
  }

  const fromName = LANG_NAMES[from] || from || 'the source language';
  const toName = LANG_NAMES[to] || to;

  const { text: translated } = await generateText({
    model: google('gemini-2.5-flash'),
    system: `You are a translation engine for travelers and rescuers. Translate the user's message from ${fromName} to ${toName}. Output ONLY the translation — no quotes, notes, or explanations. Preserve tone, keep short phrases short, and use natural everyday wording.`,
    prompt: String(text).slice(0, 1000),
  });

  return Response.json({ translated: translated.trim() });
}
