import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

  const rootRef     = useRef(null);
  const heroTagRef  = useRef(null);
  const heroH1Ref   = useRef(null);
  const heroSubRef  = useRef(null);
  const heroBtnsRef = useRef(null);
  const statsRef    = useRef(null);

  useEffect(() => {
    let ctx;
    try {
      // The scrollable container is .app-main, not window
      const scroller = document.querySelector('.app-main') || window;
      ScrollTrigger.defaults({ scroller });

      ctx = gsap.context(() => {
        // ── Hero entrance ────────────────────────────────────
        const heroEls = [
          heroTagRef.current,
          heroH1Ref.current,
          heroSubRef.current,
          statsRef.current,
        ].filter(Boolean);

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        if (heroTagRef.current)  tl.from(heroTagRef.current,  { opacity: 0, y: 20, duration: 0.6 });
        if (heroH1Ref.current)   tl.from(heroH1Ref.current,   { opacity: 0, y: 40, duration: 0.7 }, '-=0.3');
        if (heroSubRef.current)  tl.from(heroSubRef.current,  { opacity: 0, y: 24, duration: 0.6 }, '-=0.4');
        if (heroBtnsRef.current?.children?.length) {
          tl.from(Array.from(heroBtnsRef.current.children), { opacity: 0, y: 16, stagger: 0.12, duration: 0.5 }, '-=0.35');
        }
        if (statsRef.current)    tl.from(statsRef.current,    { opacity: 0, y: 30, duration: 0.6 }, '-=0.2');

        // ── Section headers on scroll ────────────────────────
        gsap.utils.toArray('.land-section-head').forEach(el => {
          gsap.fromTo(el,
            { y: 30 },
            { y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false,
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }
          );
        });

        // ── Cards stagger ────────────────────────────────────
        gsap.utils.toArray('.land-card-group').forEach(group => {
          const cards = Array.from(group.querySelectorAll('.land-card'));
          if (cards.length) {
            gsap.fromTo(cards,
              { y: 35 },
              { y: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out', immediateRender: false,
                scrollTrigger: { trigger: group, start: 'top 85%', toggleActions: 'play none none none' } }
            );
          }
        });

        // ── Tech pills wave ──────────────────────────────────
        const pills = gsap.utils.toArray('.land-tech-pill');
        if (pills.length) {
          gsap.fromTo(pills,
            { scale: 0.88, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'back.out(1.4)', immediateRender: false,
              scrollTrigger: { trigger: '.land-tech-pills', start: 'top 88%', toggleActions: 'play none none none' } }
          );
        }

        // ── Market counters ──────────────────────────────────
        gsap.utils.toArray('.land-counter').forEach(el => {
          const target = parseFloat(el.dataset.val);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          if (!isNaN(target)) {
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target, duration: 1.4, ease: 'power2.out',
              onUpdate() { el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix; },
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
            });
          }
        });

        // ── CTA section ──────────────────────────────────────
        const cta = document.querySelector('.land-cta-inner');
        if (cta) {
          gsap.fromTo(cta,
            { y: 24 },
            { y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false,
              scrollTrigger: { trigger: cta, start: 'top 82%', toggleActions: 'play none none none' } }
          );
        }

      }, rootRef);
    } catch (e) {
      // GSAP failed — clear any inline opacity:0 so content stays visible
      if (rootRef.current) {
        rootRef.current.querySelectorAll('[style*="opacity"]').forEach(el => {
          el.style.opacity = '';
        });
      }
    }

    return () => {
      ctx?.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
      ScrollTrigger.defaults({ scroller: window });
    };
  }, []);

  return (
    <div ref={rootRef} style={{ background: '#0d0d0d', color: '#fff', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60,
        background: 'rgba(13,13,13,0.7)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em' }}>
          dead<span style={{ color: '#6C63FF' }}>end</span>
        </div>

        <div style={{ display: 'flex', gap: 36, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          {[
            ['#problem', tx.nav_about],
            ['#features', tx.nav_features],
            ['#roadmap', tx.nav_future],
            ['#invest', tx.nav_invest],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, overflow: 'hidden' }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 11px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: lang === l ? 'rgba(108,99,255,0.85)' : 'transparent',
                color: lang === l ? '#fff' : 'rgba(255,255,255,0.38)',
                transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{l}</button>
            ))}
          </div>
          <button onClick={() => navigate('/')} style={{
            padding: '7px 18px', borderRadius: 7, background: '#6C63FF',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'background 0.15s, transform 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#5a52e0'}
            onMouseLeave={e => e.currentTarget.style.background = '#6C63FF'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >{tx.nav_app}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '92dvh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '80px 48px 130px',
      }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ustyurt_Plateau.jpg/1280px-Ustyurt_Plateau.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.2) saturate(0.75)',
        }} />
        {/* Radial vignette — no purple/red gradient */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse at 15% 85%, rgba(108,99,255,0.1) 0%, transparent 50%), linear-gradient(to top, rgba(13,13,13,0.95) 0%, transparent 60%)',
        }} />
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.4,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
        }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 860 }}>
          {/* Editorial tag — line + text, no pill */}
          <div ref={heroTagRef} style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
            marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 28, height: 1, background: '#6C63FF', display: 'inline-block', flexShrink: 0 }} />
            {tx.hero_tag}
          </div>

          <h1 ref={heroH1Ref} className="land-headline" style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(54px, 9vw, 108px)',
            fontWeight: 900, lineHeight: 0.95,
            letterSpacing: '-0.04em',
            margin: '0 0 30px',
            whiteSpace: 'pre-line',
          }}>{tx.hero_title}</h1>

          <p ref={heroSubRef} style={{
            fontSize: 17, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7, maxWidth: '52ch', marginBottom: 44, fontWeight: 400,
          }}>{tx.hero_sub}</p>

          <div ref={heroBtnsRef} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{
              padding: '13px 30px', borderRadius: 8, background: '#6C63FF',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 0 28px rgba(108,99,255,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 28px rgba(108,99,255,0.3)'; }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            >{tx.hero_cta}</button>
            <a href="#features" style={{
              padding: '13px 30px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >{tx.hero_cta2}</a>
          </div>
        </div>

        {/* Stats — bottom right, compact */}
        <div ref={statsRef} className="land-stats-panel" style={{
          position: 'absolute', bottom: 44, right: 48, zIndex: 3,
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden', backdropFilter: 'blur(16px)',
        }}>
          {[
            { n: '8', l: tx.stat1 },
            { n: '4+', l: tx.stat2 },
            { n: '<30s', l: tx.stat3 },
            { n: '🔥', l: tx.stat4 },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 20px', textAlign: 'center', minWidth: 84,
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontWeight: 500, letterSpacing: '0.03em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: '120px 48px', maxWidth: 1240, margin: '0 auto' }}>
        <div className="land-problem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          {/* Left — headline */}
          <div className="land-section-head">
            <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 1, background: '#6C63FF', display: 'inline-block' }} />
              {tx.problem_tag}
            </div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(34px, 4vw, 58px)',
              fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
              marginBottom: 24, whiteSpace: 'pre-line',
            }}>{tx.problem_title}</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '48ch' }}>{tx.problem_text}</p>
          </div>

          {/* Right — stacked cards, left-border accent */}
          <div className="land-card-group" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {[
              { title: tx.problem_c1_title, text: tx.problem_c1 },
              { title: tx.problem_c2_title, text: tx.problem_c2 },
              { title: tx.problem_c3_title, text: tx.problem_c3 },
            ].map((c, i) => (
              <div key={i} className="land-card" style={{
                padding: '20px 22px',
                background: 'rgba(255,255,255,0.025)',
                borderLeft: '2px solid rgba(108,99,255,0.5)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '0 10px 10px 0',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65 }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '120px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="land-section-head" style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 1, background: '#6C63FF', display: 'inline-block' }} />
              {tx.feat_tag}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>{tx.feat_title}</h2>
          </div>

          {/* BENTO GRID — asymmetric, not 3 equal columns */}
          <div className="land-card-group land-bento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 10 }}>
            {FEATURES(tx).map((f, i) => {
              const isWide = i === 0;
              const isTall = i === 1;
              return (
                <div key={i} className="land-card" style={{
                  gridColumn: isWide ? '1 / 3' : undefined,
                  gridRow: isTall ? '1 / 3' : undefined,
                  padding: isWide ? '36px 40px' : '28px',
                  borderRadius: 14,
                  background: isTall ? 'rgba(108,99,255,0.07)' : 'rgba(255,255,255,0.025)',
                  border: isTall ? '1px solid rgba(108,99,255,0.2)' : '1px solid rgba(255,255,255,0.055)',
                  display: 'flex', flexDirection: 'column', gap: isWide ? 14 : 10,
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(108,99,255,0.38)';
                    e.currentTarget.style.background = isTall ? 'rgba(108,99,255,0.11)' : 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isTall ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.055)';
                    e.currentTarget.style.background = isTall ? 'rgba(108,99,255,0.07)' : 'rgba(255,255,255,0.025)';
                  }}
                >
                  <div style={{ fontSize: isWide ? 36 : 26 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: isWide ? 17 : 14, fontWeight: 700, color: '#fff', marginBottom: 5, letterSpacing: '-0.01em' }}>{f.title}</div>
                    <div style={{ fontSize: isWide ? 14 : 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TECH ── */}
      <section style={{ padding: '120px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 48px' }}>
          <div className="land-section-head" style={{ marginBottom: 44 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
              {tx.tech_tag}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, whiteSpace: 'pre-line', marginBottom: 10 }}>{tx.tech_title}</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: '48ch' }}>{tx.tech_text}</p>
          </div>
        </div>
        {/* Horizontal scroll — no wrapping pills */}
        <div className="land-tech-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 48px 16px', scrollbarWidth: 'none' }}>
          {TECH.map((t, i) => (
            <div key={i} className="land-tech-pill" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 18px', borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              transition: 'border-color 0.2s, background 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.background = 'rgba(108,99,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROADMAP — vertical timeline ── */}
      <section id="roadmap" style={{ padding: '120px 48px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="land-section-head" style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 1, background: '#6C63FF', display: 'inline-block' }} />
              {tx.road_tag}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{tx.road_title}</h2>
          </div>

          <div className="land-card-group" style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', left: 19, top: 19, bottom: 24, width: 1, background: 'rgba(255,255,255,0.06)' }} />

            {[
              { q: tx.road_q1, title: tx.road_q1_title, items: tx.road_q1_items, now: true },
              { q: tx.road_q2, title: tx.road_q2_title, items: tx.road_q2_items, now: false },
              { q: tx.road_q3, title: tx.road_q3_title, items: tx.road_q3_items, now: false },
              { q: tx.road_q4, title: tx.road_q4_title, items: tx.road_q4_items, now: false },
            ].map((phase, i) => (
              <div key={i} className="land-card" style={{ display: 'flex', gap: 26, paddingBottom: 40 }}>
                {/* Dot */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: phase.now ? '#6C63FF' : '#0d0d0d',
                  border: phase.now ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: phase.now ? 14 : 12, color: phase.now ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                    {phase.now ? '▶' : i + 1}
                  </span>
                </div>
                {/* Content */}
                <div style={{ paddingTop: 7, flex: 1 }}>
                  <div style={{ fontSize: 11, color: phase.now ? '#6C63FF' : 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{phase.q}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: phase.now ? '#fff' : 'rgba(255,255,255,0.45)', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', marginBottom: 12 }}>{phase.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 20px' }}>
                    {phase.items.map((item, j) => (
                      <span key={j} style={{ fontSize: 13, color: phase.now ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: phase.now ? '#6C63FF' : 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVEST ── */}
      <section id="invest" style={{ padding: '120px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="land-section-head" style={{ marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 1, background: 'rgba(255,215,0,0.65)', display: 'inline-block' }} />
              {tx.invest_tag}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>{tx.invest_title}</h2>
          </div>

          {/* No card borders — use spacing + dividers */}
          <div className="land-card-group land-invest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 72px', marginBottom: 80 }}>
            {[
              { title: tx.b1_title, text: tx.b1 },
              { title: tx.b2_title, text: tx.b2 },
              { title: tx.b3_title, text: tx.b3 },
              { title: tx.b4_title, text: tx.b4 },
            ].map((b, i) => (
              <div key={i} className="land-card" style={{ padding: '26px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,215,0,0.8)', marginBottom: 7 }}>{b.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75 }}>{b.text}</div>
              </div>
            ))}
          </div>

          {/* Market stats — large editorial type */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 52 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 40 }}>{tx.market_title}</div>
            <div style={{ display: 'flex', gap: 72, flexWrap: 'wrap' }}>
              {[
                { val: 500, suffix: 'K+', label: tx.market_1 },
                { val: 40, prefix: '+', suffix: '%', label: tx.market_2 },
                { val: 2, suffix: 'M+', label: tx.market_3 },
              ].map((s, i) => (
                <div key={i}>
                  <div
                    className="land-counter"
                    data-val={s.val}
                    data-suffix={s.suffix || ''}
                    data-prefix={s.prefix || ''}
                    style={{
                      fontFamily: 'Syne, sans-serif', fontSize: 'clamp(44px, 5vw, 68px)',
                      fontWeight: 900, color: '#fff', lineHeight: 1,
                      letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
                    }}
                  >{(s.prefix || '') + s.val + (s.suffix || '')}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 8, maxWidth: 180, lineHeight: 1.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── photo background, not gradient */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '140px 48px', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ustyurt_Plateau.jpg/1280px-Ustyurt_Plateau.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          filter: 'brightness(0.13) saturate(0.6)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(108,99,255,0.18) 0%, rgba(13,13,13,0.55) 65%)' }} />
        <div className="land-cta-inner" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(30px, 5vw, 62px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>{tx.cta_title}</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.48)', maxWidth: '46ch', margin: '0 auto 44px', lineHeight: 1.7 }}>{tx.cta_sub}</p>
          <button onClick={() => navigate('/')} style={{
            padding: '14px 36px', borderRadius: 8, background: '#6C63FF',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 16,
            cursor: 'pointer', boxShadow: '0 0 48px rgba(108,99,255,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(108,99,255,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 48px rgba(108,99,255,0.4)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          >{tx.cta_btn}</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '26px 48px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>
          dead<span style={{ color: '#6C63FF' }}>end</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>{tx.footer}</div>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.38)', padding: '6px 15px', borderRadius: 7,
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          transition: 'border-color 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}
        >{tx.nav_app} →</button>
      </footer>
    </div>
  );
}
