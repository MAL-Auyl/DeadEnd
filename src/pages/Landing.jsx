import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const T = {
  en: {
    nav_about: 'About',
    nav_features: 'Features',
    nav_future: 'Roadmap',
    nav_invest: 'For Partners',
    nav_app: 'Open App',
    hero_tag: 'Hackathon Project · Kazakhstan',
    hero_title: 'Safe Tourism\nin the Wild',
    hero_sub: 'Real-time GPS tracking, instant SOS to MChS, and smart safety tools for off-road adventurers across Mangystau.',
    hero_cta: 'Open App',
    hero_cta2: 'Watch Demo',
    stat1: 'Active places',
    stat2: 'Checkpoint system',
    stat3: 'SOS response',
    stat4: 'Cross-device sync',
    problem_tag: 'The Problem',
    problem_title: 'Tourists go missing.\nNo one knows where.',
    problem_text: 'Mangystau attracts thousands of tourists annually. Many venture into areas with no cell signal for days. When emergencies happen, MChS has no data — no location, no contacts, no plan. DeadEnd solves this.',
    problem_c1_title: '📡 No Signal Zones',
    problem_c1: 'Up to 50km of dead zones before popular destinations. Standard navigation fails.',
    problem_c2_title: '🚑 Slow Response',
    problem_c2: 'Without pre-registered routes, rescue teams waste critical hours searching.',
    problem_c3_title: '📋 No Data',
    problem_c3: 'MChS receives calls with no tourist profile, vehicle info, or medical details.',
    feat_tag: 'Features',
    feat_title: 'Everything MChS\nneeds. In real time.',
    f1_title: 'Live GPS Tracking',
    f1: 'Tourist location syncs to MChS dashboard via Firebase every 15 seconds, even with minimal signal.',
    f2_title: 'One-Touch SOS',
    f2: 'Emergency button sends GPS coords, blood type, contacts, clothing and vehicle info instantly to rescue services.',
    f3_title: 'Smart Checkpoints',
    f3: 'Pre-defined route checkpoints with proximity detection. Auto-alert if tourist fails to check in.',
    f4_title: 'MChS Dashboard',
    f4: 'Real-time operations center: risk scoring, rescue workflow, tourist profiles, incident history.',
    f5_title: 'Offline Support',
    f5: 'App works without internet. GPS coordinates queue locally and sync automatically on reconnect.',
    f6_title: 'Weather & Safety Tips',
    f6: 'Live weather from Open-Meteo API with Kazakh-language safety tips (mama tips) per location.',
    tech_tag: 'Technology',
    tech_title: 'Built for scale.\nBuilt for Kazakhstan.',
    tech_text: 'Modern stack chosen for reliability, speed, and zero server cost at launch.',
    road_tag: 'Roadmap',
    road_title: 'What comes next',
    road_q1: 'Q3 2026',
    road_q1_title: 'Mobile Apps',
    road_q1_items: ['React Native iOS & Android', 'Background GPS tracking', 'Push notifications for SOS', 'Offline-first architecture'],
    road_q2: 'Q4 2026',
    road_q2_title: 'Real Integration',
    road_q2_items: ['Official MChS API connection', 'Satellite messenger integration', 'National park partnerships', 'Tour operator API'],
    road_q3: 'Q1 2027',
    road_q3_title: 'AI Safety Layer',
    road_q3_items: ['Route risk scoring by AI', 'Predictive overdue alerts', 'Weather danger forecasting', 'Emergency pattern analysis'],
    road_q4: 'Q2 2027',
    road_q4_title: 'Central Asia Scale',
    road_q4_items: ['Kyrgyzstan & Tajikistan', 'Multi-language (RU/KZ/EN/ZH)', 'B2B tour operator SaaS', 'Insurance company API'],
    invest_tag: 'For Partners & Investors',
    invest_title: 'A platform governments,\ntour operators, and insurers need.',
    b1_title: '🏛️ Government',
    b1: 'License the MChS dashboard to regional emergency services. Already designed for their workflow.',
    b2_title: '🏕️ Tour Operators',
    b2: 'White-label tourist tracking for guided tours. Liability protection, real-time group monitoring.',
    b3_title: '🛡️ Insurance',
    b3: 'Trip registration data as premium input. Verified route history reduces claim fraud.',
    b4_title: '📱 Consumer',
    b4: 'Freemium mobile app. Premium plan with satellite backup, family tracking, advanced weather.',
    market_title: 'Market Opportunity',
    market_1: 'tourists visit Mangystau yearly',
    market_2: 'tourism growth in Kazakhstan 2023-24',
    market_3: 'Central Asia adventure travelers',
    team_tag: 'Built at',
    cta_title: 'Ready to keep tourists safe?',
    cta_sub: 'Try the live demo — start a trip, send SOS, watch the MChS dashboard respond.',
    cta_btn: 'Open App →',
    footer: 'Built with ❤️ for Kazakhstan · Hackathon 2026',
  },
  ru: {
    nav_about: 'О проекте',
    nav_features: 'Возможности',
    nav_future: 'Дорожная карта',
    nav_invest: 'Партнёрам',
    nav_app: 'Открыть приложение',
    hero_tag: 'Хакатон · Казахстан',
    hero_title: 'Безопасный туризм\nв дикой природе',
    hero_sub: 'GPS-трекинг в реальном времени, мгновенный SOS в МЧС и умные инструменты безопасности для путешественников по Мангыстау.',
    hero_cta: 'Открыть приложение',
    hero_cta2: 'Смотреть демо',
    stat1: 'Активных мест',
    stat2: 'Система чекпоинтов',
    stat3: 'Реакция на SOS',
    stat4: 'Кросс-девайс синк',
    problem_tag: 'Проблема',
    problem_title: 'Туристы пропадают.\nНикто не знает где.',
    problem_text: 'Мангыстау принимает тысячи туристов ежегодно. Многие уходят в зоны без сотовой связи на дни. При ЧП у МЧС нет данных — ни координат, ни контактов, ни маршрута. DeadEnd решает это.',
    problem_c1_title: '📡 Зоны без сигнала',
    problem_c1: 'До 50 км мёртвых зон перед популярными локациями. Стандартная навигация не работает.',
    problem_c2_title: '🚑 Медленное реагирование',
    problem_c2: 'Без зарегистрированных маршрутов спасатели тратят критические часы на поиск.',
    problem_c3_title: '📋 Нет данных',
    problem_c3: 'МЧС получает звонки без профиля туриста, данных о машине или медицинской информации.',
    feat_tag: 'Функциональность',
    feat_title: 'Всё что нужно МЧС.\nВ реальном времени.',
    f1_title: 'GPS-трекинг в реальном времени',
    f1: 'Координаты туриста синхронизируются с панелью МЧС через Firebase каждые 15 секунд.',
    f2_title: 'SOS в одно касание',
    f2: 'Кнопка экстренного вызова мгновенно отправляет GPS, группу крови, контакты и данные о машине.',
    f3_title: 'Умные чекпоинты',
    f3: 'Заранее определённые точки маршрута с автодетектом приближения. Авто-оповещение при пропуске.',
    f4_title: 'Дашборд МЧС',
    f4: 'Центр мониторинга: оценка рисков, рабочий процесс спасения, профили туристов, история инцидентов.',
    f5_title: 'Офлайн-режим',
    f5: 'Приложение работает без интернета. GPS-координаты накапливаются и синхронизируются при восстановлении связи.',
    f6_title: 'Погода и советы безопасности',
    f6: 'Живая погода от Open-Meteo API с советами безопасности на казахском языке по каждой локации.',
    tech_tag: 'Технологии',
    tech_title: 'Сделано для масштаба.\nСделано для Казахстана.',
    tech_text: 'Современный стек, выбранный за надёжность, скорость и нулевые серверные расходы на старте.',
    road_tag: 'Дорожная карта',
    road_title: 'Что будет дальше',
    road_q1: 'Q3 2026',
    road_q1_title: 'Мобильные приложения',
    road_q1_items: ['React Native iOS & Android', 'GPS-трекинг в фоне', 'Push-уведомления при SOS', 'Офлайн-архитектура'],
    road_q2: 'Q4 2026',
    road_q2_title: 'Реальная интеграция',
    road_q2_items: ['Официальный API МЧС', 'Интеграция спутниковых мессенджеров', 'Партнёрство с нацпарками', 'API турагентств'],
    road_q3: 'Q1 2027',
    road_q3_title: 'AI-слой безопасности',
    road_q3_items: ['Оценка риска маршрута ИИ', 'Предиктивные оповещения', 'Прогноз погодной опасности', 'Анализ паттернов ЧС'],
    road_q4: 'Q2 2027',
    road_q4_title: 'Масштаб Центральной Азии',
    road_q4_items: ['Кыргызстан и Таджикистан', 'Мультиязычность RU/KZ/EN/ZH', 'B2B SaaS для туроператоров', 'API страховых компаний'],
    invest_tag: 'Партнёрам и инвесторам',
    invest_title: 'Платформа, которую ждут\nправительства, туроператоры и страховщики.',
    b1_title: '🏛️ Государство',
    b1: 'Лицензирование дашборда МЧС для региональных служб. Уже разработан под их рабочий процесс.',
    b2_title: '🏕️ Туроператоры',
    b2: 'White-label трекинг для групповых туров. Защита от ответственности, мониторинг группы.',
    b3_title: '🛡️ Страхование',
    b3: 'Данные регистрации поездки как основа страхового тарифа. История маршрутов снижает мошенничество.',
    b4_title: '📱 B2C',
    b4: 'Freemium мобильное приложение. Premium с резервом через спутник, семейным трекингом и расширенной погодой.',
    market_title: 'Рынок',
    market_1: 'туристов посещают Мангыстау ежегодно',
    market_2: 'рост туризма в Казахстане 2023-24',
    market_3: 'путешественников по Центральной Азии',
    team_tag: 'Создано на',
    cta_title: 'Готовы защитить туристов?',
    cta_sub: 'Попробуйте живое демо — начните поездку, отправьте SOS, наблюдайте как реагирует дашборд МЧС.',
    cta_btn: 'Открыть приложение →',
    footer: 'Сделано с ❤️ для Казахстана · Хакатон 2026',
  },
  kz: {
    nav_about: 'Жоба туралы',
    nav_features: 'Мүмкіндіктер',
    nav_future: 'Жол картасы',
    nav_invest: 'Серіктестерге',
    nav_app: 'Қосымшаны ашу',
    hero_tag: 'Хакатон · Қазақстан',
    hero_title: 'Жабайы табиғатта\nқауіпсіз туризм',
    hero_sub: 'Нақты уақыттағы GPS бақылау, ТЖМ-ға тез SOS және Маңғыстау бойынша саяхатшыларға арналған ақылды қауіпсіздік құралдары.',
    hero_cta: 'Қосымшаны ашу',
    hero_cta2: 'Демоны көру',
    stat1: 'Белсенді орындар',
    stat2: 'Бекеттер жүйесі',
    stat3: 'SOS жауабы',
    stat4: 'Құрылғылар арасы синк',
    problem_tag: 'Мәселе',
    problem_title: 'Туристер жоғалады.\nЕшкім білмейді.',
    problem_text: 'Маңғыстауға жыл сайын мыңдаған турист келеді. Көпшілігі күндер бойы байланыссыз аймақтарға барады. Авария болғанда ТЖМ-де деректер жоқ. DeadEnd мұны шешеді.',
    problem_c1_title: '📡 Байланыссыз аймақтар',
    problem_c1: 'Танымал орындарға дейін 50 км байланыссыз аймақ. Стандартты навигация жұмыс істемейді.',
    problem_c2_title: '🚑 Баяу жауап',
    problem_c2: 'Тіркелген маршруттарсыз құтқарушылар маңызды сағаттарды іздестіруге жұмсайды.',
    problem_c3_title: '📋 Деректер жоқ',
    problem_c3: 'ТЖМ турист профилісіз, көлік туралы деректерсіз қоңырау алады.',
    feat_tag: 'Функционал',
    feat_title: 'ТЖМ-ға қажеттінің бәрі.\nНақты уақытта.',
    f1_title: 'Нақты уақыттағы GPS',
    f1: 'Туристің координаттары Firebase арқылы ТЖМ панеліне 15 секунд сайын жіберіледі.',
    f2_title: 'Бір басуда SOS',
    f2: 'Шұғыл батырма GPS, қан тобы, байланыстар мен көлік деректерін лезде жібереді.',
    f3_title: 'Ақылды бекеттер',
    f3: 'Алдын ала белгіленген маршрут бекеттері. Бекетке жетпесе авто-хабарлама.',
    f4_title: 'ТЖМ дашборды',
    f4: 'Мониторинг орталығы: тәуекел бағасы, құтқару жұмыс процесі, турист профильдері.',
    f5_title: 'Офлайн режим',
    f5: 'Қосымша интернетсіз жұмыс істейді. GPS координаттары жиналып, байланыс орнында синхрондалады.',
    f6_title: 'Ауа райы мен кеңестер',
    f6: 'Open-Meteo API-нан тікелей ауа райы және қазақ тіліндегі қауіпсіздік кеңестері.',
    tech_tag: 'Технологиялар',
    tech_title: 'Масштабқа арналған.\nҚазақстанға арналған.',
    tech_text: 'Сенімділік, жылдамдық және старт кезіндегі нөл сервер шығыны үшін таңдалған заманауи стек.',
    road_tag: 'Жол картасы',
    road_title: 'Келесі қадамдар',
    road_q1: 'Q3 2026',
    road_q1_title: 'Мобильді қосымшалар',
    road_q1_items: ['React Native iOS және Android', 'Фондық GPS бақылау', 'SOS кезінде push хабарлама', 'Офлайн архитектура'],
    road_q2: 'Q4 2026',
    road_q2_title: 'Нақты интеграция',
    road_q2_items: ['Ресми ТЖМ API', 'Жерсерік хабаршы интеграциясы', 'Ұлттық парк серіктестігі', 'Тур агенттік API'],
    road_q3: 'Q1 2027',
    road_q3_title: 'AI қауіпсіздік қабаты',
    road_q3_items: ['AI маршрут тәуекел бағасы', 'Болжамды ескертулер', 'Ауа райы қауіпін болжау', 'ТЖ үлгі талдауы'],
    road_q4: 'Q2 2027',
    road_q4_title: 'Орталық Азия масштабы',
    road_q4_items: ['Қырғызстан және Тәжікстан', 'Көптілді RU/KZ/EN/ZH', 'B2B SaaS тур операторлар', 'Сақтандыру API'],
    invest_tag: 'Серіктестер мен инвесторларға',
    invest_title: 'Үкіметтер, тур операторлар\nмен сақтандырушылар күткен платформа.',
    b1_title: '🏛️ Мемлекет',
    b1: 'Аймақтық авариялық қызметтерге ТЖМ дашборды лицензиясы. Олардың жұмыс процесіне арналған.',
    b2_title: '🏕️ Тур операторлар',
    b2: 'Топтық турлар үшін white-label бақылау. Жауапкершіліктен қорғау, топты нақты уақытта бақылау.',
    b3_title: '🛡️ Сақтандыру',
    b3: 'Сапар тіркеу деректері сақтандыру тарифінің негізі ретінде. Маршрут тарихы алаяқтықты азайтады.',
    b4_title: '📱 B2C',
    b4: 'Freemium мобильді қосымша. Жерсерік резервімен, отбасы бақылауымен Premium жоспар.',
    market_title: 'Нарық',
    market_1: 'турист жыл сайын Маңғыстауға келеді',
    market_2: 'Қазақстандағы туризм өсімі 2023-24',
    market_3: 'Орталық Азия саяхатшылары',
    team_tag: 'Жасалды',
    cta_title: 'Туристерді қорғауға дайынсыз ба?',
    cta_sub: 'Тікелей демоны байқаңыз — сапар бастаңыз, SOS жіберіңіз, ТЖМ дашбордының жауабын бақылаңыз.',
    cta_btn: 'Қосымшаны ашу →',
    footer: 'Қазақстан үшін ❤️ жасалды · Хакатон 2026',
  },
};

const FEATURES = (t) => [
  { icon: '📍', title: t.f1_title, desc: t.f1, color: '#6C63FF' },
  { icon: '🆘', title: t.f2_title, desc: t.f2, color: '#FF4757' },
  { icon: '🗺️', title: t.f3_title, desc: t.f3, color: '#06D6A0' },
  { icon: '🛡️', title: t.f4_title, desc: t.f4, color: '#F4A261' },
  { icon: '📶', title: t.f5_title, desc: t.f5, color: '#FFD700' },
  { icon: '🌤️', title: t.f6_title, desc: t.f6, color: '#38BDF8' },
];

const TECH = [
  { name: 'React 18', desc: 'UI framework', icon: '⚛️' },
  { name: 'Firebase RTDB', desc: 'Real-time sync', icon: '🔥' },
  { name: 'Vite', desc: 'Build tool', icon: '⚡' },
  { name: 'React Router v6', desc: 'Navigation', icon: '🔀' },
  { name: 'Open-Meteo', desc: 'Weather API', icon: '🌦️' },
  { name: 'Vercel', desc: 'Hosting & CDN', icon: '▲' },
  { name: 'GPS / Geolocation', desc: 'Browser native', icon: '🛰️' },
  { name: 'localStorage', desc: 'Offline queue', icon: '💾' },
];

export default function Landing() {
  const [lang, setLang] = useState('ru');
  const navigate = useNavigate();
  const tx = T[lang];

  const LANGS = ['kz', 'ru', 'en'];

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>
          dead<span style={{ color: '#6C63FF' }}>end</span>
        </div>

        <div style={{ display: 'flex', gap: 32, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
          {[
            ['#problem', tx.nav_about],
            ['#features', tx.nav_features],
            ['#roadmap', tx.nav_future],
            ['#invest', tx.nav_invest],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Lang switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: lang === l ? 'rgba(108,99,255,0.8)' : 'transparent',
                color: lang === l ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{l}</button>
            ))}
          </div>
          <button onClick={() => navigate('/')} style={{
            padding: '8px 20px', borderRadius: 8, background: '#6C63FF',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>{tx.nav_app}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        padding: '80px 40px',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ustyurt_Plateau.jpg/1280px-Ustyurt_Plateau.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.25)',
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, transparent 50%, rgba(255,71,87,0.08) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)',
            borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#a8a3ff',
            fontWeight: 600, marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {tx.hero_tag}
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 'clamp(48px, 7vw, 86px)',
            fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
            margin: '0 0 24px',
            whiteSpace: 'pre-line',
          }}>{tx.hero_title}</h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            {tx.hero_sub}
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{
              padding: '14px 32px', borderRadius: 10, background: '#6C63FF',
              border: 'none', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 0 32px rgba(108,99,255,0.4)',
            }}>{tx.hero_cta}</button>
            <a href="#features" style={{
              padding: '14px 32px', borderRadius: 10,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}>{tx.hero_cta2}</a>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 40, left: 40, right: 40, zIndex: 2,
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)',
        }}>
          {[
            { n: '8', l: tx.stat1 },
            { n: '4+', l: tx.stat2 },
            { n: '<30s', l: tx.stat3 },
            { n: '🔥', l: tx.stat4 },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '20px 24px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{tx.problem_tag}</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, whiteSpace: 'pre-line' }}>{tx.problem_title}</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: 660, marginBottom: 60 }}>{tx.problem_text}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { title: tx.problem_c1_title, text: tx.problem_c1, color: '#F4A261' },
            { title: tx.problem_c2_title, text: tx.problem_c2, color: '#FF4757' },
            { title: tx.problem_c3_title, text: tx.problem_c3, color: '#6C63FF' },
          ].map((c, i) => (
            <div key={i} style={{
              padding: '28px', borderRadius: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginBottom: 10 }}>{c.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{c.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#06D6A0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{tx.feat_tag}</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 60, whiteSpace: 'pre-line' }}>{tx.feat_title}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES(tx).map((f, i) => (
              <div key={i} style={{
                padding: '28px', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${f.color}22`,
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '55'; e.currentTarget.style.background = f.color + '08'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = f.color + '22'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH ── */}
      <section style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: '#F4A261', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{tx.tech_tag}</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, whiteSpace: 'pre-line' }}>{tx.tech_title}</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 48 }}>{tx.tech_text}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {TECH.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 20px', borderRadius: 100,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" style={{ padding: '100px 40px', background: 'rgba(108,99,255,0.04)', borderTop: '1px solid rgba(108,99,255,0.12)', borderBottom: '1px solid rgba(108,99,255,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#a8a3ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{tx.road_tag}</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 60 }}>{tx.road_title}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
            {[
              { q: tx.road_q1, title: tx.road_q1_title, items: tx.road_q1_items, color: '#6C63FF', done: false },
              { q: tx.road_q2, title: tx.road_q2_title, items: tx.road_q2_items, color: '#06D6A0', done: false },
              { q: tx.road_q3, title: tx.road_q3_title, items: tx.road_q3_items, color: '#F4A261', done: false },
              { q: tx.road_q4, title: tx.road_q4_title, items: tx.road_q4_items, color: '#FF4757', done: false },
            ].map((phase, i) => (
              <div key={i} style={{
                padding: '28px', borderRadius: 16,
                background: i === 0 ? `${phase.color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${phase.color}${i === 0 ? '44' : '22'}`,
              }}>
                <div style={{ fontSize: 11, color: phase.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{phase.q}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 16, fontFamily: 'Syne, sans-serif' }}>{phase.title}</div>
                {phase.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: phase.color, flexShrink: 0, opacity: i === 0 ? 1 : 0.5 }} />
                    <span style={{ fontSize: 13, color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)' }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVEST ── */}
      <section id="invest" style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{tx.invest_tag}</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 60, whiteSpace: 'pre-line' }}>{tx.invest_title}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, marginBottom: 64 }}>
          {[
            { title: tx.b1_title, text: tx.b1 },
            { title: tx.b2_title, text: tx.b2 },
            { title: tx.b3_title, text: tx.b3 },
            { title: tx.b4_title, text: tx.b4 },
          ].map((b, i) => (
            <div key={i} style={{
              padding: '28px', borderRadius: 16,
              background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFD700', marginBottom: 10 }}>{b.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{b.text}</div>
            </div>
          ))}
        </div>

        {/* Market stats */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 48 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 28 }}>{tx.market_title}</div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {[
              { n: '500K+', l: tx.market_1 },
              { n: '+40%', l: tx.market_2 },
              { n: '2M+', l: tx.market_3 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, maxWidth: 180 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '100px 40px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(255,71,87,0.08) 100%)',
        borderTop: '1px solid rgba(108,99,255,0.2)',
      }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 54px)', fontWeight: 900, marginBottom: 20 }}>{tx.cta_title}</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>{tx.cta_sub}</p>
        <button onClick={() => navigate('/')} style={{
          padding: '16px 40px', borderRadius: 12, background: '#6C63FF',
          border: 'none', color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer',
          boxShadow: '0 0 48px rgba(108,99,255,0.5)',
        }}>{tx.cta_btn}</button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '32px 40px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 13, color: 'rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>
          dead<span style={{ color: '#6C63FF' }}>end</span>
        </div>
        <div>{tx.footer}</div>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)', padding: '8px 18px', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{tx.nav_app} →</button>
      </footer>
    </div>
  );
}
