import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const config = { runtime: 'edge' };

// Condensed route catalog for recommendations — keep in sync with src/data/places.js
const PLACES = [
  { id: 'bozzhyra', en: 'Bozzhyra tract', ru: 'Урочище Бозжыра', kz: 'Бозжыра трактісі', distance: 285, duration: '3 hr 54 min', rating: 5.0, category: 'mountain, popular', desc: { en: 'Ridge of dramatic rock formations, once the bottom of the Tethys Ocean. Best at sunrise.', ru: 'Гряда впечатляющих скальных образований, бывшее дно океана Тетис. Лучше всего на рассвете.', kz: 'Бұрынғы Тетис мұхитының түбі болған әсерлі тау жыныстары қырқасы. Таң атқанда ең әдемі.' } },
  { id: 'ayraqty', en: 'Ayraqty canyon', ru: 'Каньон Айракты', kz: 'Айрақты каньоны', distance: 140, duration: '2 hr 10 min', rating: 4.8, category: 'mountain, beach, popular', desc: { en: 'Layered red and white canyon, very photogenic, shorter trip.', ru: 'Слоистый красно-белый каньон, очень фотогеничный, поездка покороче.', kz: 'Қызыл-ақ қабатты каньон, өте фотогенді, қысқа сапар.' } },
  { id: 'caspian-beach', en: 'Sand beach', ru: 'Песчаный пляж', kz: 'Құм жағажайы', distance: 15, duration: '20 min', rating: 4.6, category: 'beach, sea, popular', desc: { en: 'Sandy Caspian Sea beach near Aktau, easy short trip, great for relaxing.', ru: 'Песчаный пляж Каспия рядом с Актау, лёгкая короткая поездка, отдых.', kz: 'Ақтау жанындағы Каспий жағажайы, қысқа да жеңіл сапар, демалуға қолайлы.' } },
  { id: 'sherkala', en: 'Mount Sherkala', ru: 'Гора Шеркала', kz: 'Шеркала тауы', distance: 220, duration: '3 hr 20 min', rating: 4.9, category: 'mountain, popular', desc: { en: 'Sacred mountain shaped like a yurt or sleeping lion.', ru: 'Священная гора в форме юрты или спящего льва.', kz: 'Кигізге немесе ұйықтап жатқан арыстанға ұқсайтын қасиетті тау.' } },
  { id: 'karynzharyk', en: 'Karynzharyk Depression', ru: 'Впадина Карынжарык', kz: 'Қарынжарық ойпаты', distance: 310, duration: '4 hr 20 min', rating: 4.9, category: 'mountain, popular, hard', desc: { en: 'One of the deepest depressions on Earth, surreal ochre canyons. Long, demanding route, extreme heat.', ru: 'Одна из самых глубоких впадин на Земле, сюрреалистичные охристые каньоны. Долгий и тяжёлый маршрут, сильная жара.', kz: 'Жердегі ең терең ойпаттардың бірі, сюрреалды каньондар. Ұзақ әрі ауыр маршрут, қатты ыстық.' } },
  { id: 'zhygylgan', en: 'Zhygylgan (Fallen Land)', ru: 'Жыгылган (Упавшая земля)', kz: 'Жыгылған', distance: 165, duration: '2 hr 30 min', rating: 4.8, category: 'mountain, sea, popular', desc: { en: 'Collapsed coastal plateau over the Caspian Sea, cliffs, caves, rock arches.', ru: 'Обрушившееся прибрежное плато над Каспием, обрывы, пещеры, арки.', kz: 'Каспий үстіндегі құлаған жағалау платосы, жарлар, үңгірлер, доғалар.' } },
  { id: 'shakpak-ata', en: 'Shakpak-Ata Mosque', ru: 'Мечеть Шакпак-Ата', kz: 'Шақпақ-ата мешіті', distance: 155, duration: '2 hr 15 min', rating: 4.9, category: 'mountain, popular, culture', desc: { en: 'Underground mosque carved into chalk cliffs, ancient Arabic inscriptions, sacred pilgrimage site.', ru: 'Подземная мечеть в меловых скалах, древние арабские надписи, место паломничества.', kz: 'Ақ бор тастарына қашалған жерасты мешіті, ежелгі жазулар, зиярат орны.' } },
  { id: 'sarytas', en: 'Sarytas Red Canyon', ru: 'Красный каньон Сарыташ', kz: 'Сарыташ қызыл каньоны', distance: 270, duration: '3 hr 40 min', rating: 4.7, category: 'mountain, hidden gem', desc: { en: 'Vivid red sandstone canyon, less crowded than Bozzhyra.', ru: 'Яркий красный песчаниковый каньон, менее людный, чем Бозжыра.', kz: 'Қызыл құмтас каньоны, Бозжырадан гөрі аз адам барады.' } },
  { id: 'tupkaragan', en: 'Cape Tupkaragan', ru: 'Мыс Тупкараган', kz: 'Тупқараған мүйісі', distance: 130, duration: '2 hr 00 min', rating: 4.6, category: 'sea, mountain, popular', desc: { en: 'Peninsula with white limestone cliffs plunging into the Caspian Sea, fossils, seabirds.', ru: 'Полуостров с белыми скалами над Каспием, окаменелости, морские птицы.', kz: 'Каспийге құлайтын ақ жартастары бар түбек, қазбалар, теңіз құстары.' } },
  { id: 'torysh', en: 'Valley of Balls Torysh', ru: 'Долина шаров Торыш', kz: 'Торыш шар алқабы', distance: 250, duration: '3 hr 30 min', rating: 4.8, category: 'mountain, popular, unusual', desc: { en: 'Hundreds of perfectly round stone balls scattered across the steppe — "dinosaur eggs".', ru: 'Сотни идеально круглых каменных шаров в степи — «яйца динозавров».', kz: 'Далада шашылған жүздеген дөңгелек тас шарлар — "динозавр жұмыртқалары".' } },
];

const LANG_NAMES = { en: 'English', ru: 'Russian', kz: 'Kazakh' };

function buildSystemPrompt(lang) {
  const l = LANG_NAMES[lang] ? lang : 'ru';
  const catalog = PLACES.map(p => (
    `- ${p.id}: "${p[l] || p.en}" — ${p.distance} km, ~${p.duration}, rating ${p.rating}, tags: ${p.category}. ${p.desc[l] || p.desc.en}`
  )).join('\n');

  return `You are Taumaru, the DeadEnd AI assistant — a friendly chibi snow-leopard trail guide character for travelers exploring the Mangystau region of Kazakhstan inside the DeadEnd safety app. If asked your name, say it's Taumaru.

ALWAYS respond in ${LANG_NAMES[l]}, regardless of the language the user writes in, unless they explicitly ask for a different language.

Your job:
- Answer questions about the routes/places below (distance, difficulty, what to expect, what to pack, safety tips).
- Recommend 1-3 routes based on the user's preferences (time available, fitness level, interest in mountains/sea/culture, etc.), referencing the route names from the catalog.
- Give practical safety advice (water, 4x4 vehicles, offline maps, heat, signal loss) when relevant — the app has live weather, SOS, and checkpoint tracking features the user can use.
- Translate words and phrases on request — e.g. "how do I say X in Kazakh/Russian/English" or "translate: ...". Reply with the translation (and a short pronunciation hint if helpful), in the requested language, even if that differs from the user's app language. This helps tourists communicate with locals and rescuers.
- Keep answers concise and conversational (2-5 sentences), using the local route names.

Available routes (id: name — distance, duration, rating, tags — description):
${catalog}

If asked something unrelated to travel/safety/translation in Mangystau, gently steer the conversation back to trip planning.`;
}

function buildProfileSection(profile) {
  if (!profile) return '';
  const parts = [];
  if (profile.allergies)    parts.push(`Allergies: ${profile.allergies}`);
  if (profile.bloodType)    parts.push(`Blood type: ${profile.bloodType}`);
  if (profile.height)       parts.push(`Height: ${profile.height} cm`);
  if (profile.weight)       parts.push(`Weight: ${profile.weight} kg`);
  if (profile.specialMarks) parts.push(`Special notes / conditions: ${profile.specialMarks}`);
  if (!parts.length) return '';

  return `\n\nThe current user has shared this personal profile:\n${parts.map(p => `- ${p}`).join('\n')}\n\nUse it to personalize practical advice — e.g. warn about allergens in local food/drinks, adjust pace/water/gear suggestions for their build, or flag a route as too demanding given their notes — but ONLY when it's relevant to what they asked. Don't recite this profile back or bring it up in unrelated answers, and never give medical diagnoses or treatment advice.`;
}

function buildLiveContextSection(live) {
  if (!live) return '';
  const parts = [];

  if (live.coords) {
    parts.push(`Current GPS location: ${live.coords.lat.toFixed(3)}, ${live.coords.lng.toFixed(3)}`);
  }

  if (live.weather) {
    const w = live.weather;
    parts.push(`Current weather: ${w.tempNow}°C, wind ${w.windNow} m/s. Today's range: ${w.tempMinToday}–${w.tempMaxToday}°C, rain chance ${w.rainChanceToday}%.`);
  }

  if (live.trip) {
    const trip = live.trip;
    const statusDesc = trip.status === 'sos' ? 'SOS ACTIVE — the user has triggered an emergency alert'
      : trip.status === 'overdue' ? 'OVERDUE — the user has not checked in by their expected return time'
      : trip.status === 'active' ? 'in progress'
      : trip.status;
    parts.push(`Active trip: heading to "${trip.placeName}", status: ${statusDesc}, expected return: ${trip.expectedReturn}.`);
  }

  if (!parts.length) return '';

  return `\n\nLive context about the user's current situation:\n${parts.map(p => `- ${p}`).join('\n')}\n\nGround your answers in this real-world context when relevant — e.g. tailor packing/safety advice to the actual current weather, mention nearby routes relative to their location, or react with urgency if their trip status is overdue/SOS. If the trip status is overdue or SOS, gently but clearly encourage them to check in via the app's tracking screen or use the SOS button. Don't mention this context if it's irrelevant to the question.`;
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

  const { messages, lang, profile, live } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Missing messages', { status: 400 });
  }

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: buildSystemPrompt(lang) + buildProfileSection(profile) + buildLiveContextSection(live),
    messages,
  });

  return result.toTextStreamResponse();
}
