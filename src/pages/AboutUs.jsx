import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const E      = 'cubic-bezier(0.23, 1, 0.32, 1)';
const gold   = '#C9A055';
const border = 'rgba(255,255,255,0.07)';
const PHOTO  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ustyurt_Plateau.jpg/1280px-Ustyurt_Plateau.jpg';
const GRAIN  = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`;

// ─── Translations ────────────────────────────────────────────────────────────
const TX = {
  en: {
    nav_label:   'About',
    open_app:    'Open App',
    hero_tag:    'About DeadEnd · Hackathon 2026 · Kazakhstan',
    hero_h1:     'Built to bring everyone home.',
    hero_sub:    'A digital safety protocol for wilderness tourism in signal-dead zones. DeadEnd turns a chaotic search into a precise rescue operation.',
    hero_cta1:   'Try the App →',
    hero_cta2:   'See Features',
    stat1_label: 'tourists visit Mangistau yearly',
    stat2_n:     '80%',
    stat2_label: 'reduction in search time',
    stat3_label: 'destinations tracked',
    stat4_n:     '48h',
    stat4_label: 'built at hackathon',
    prob_tag:    'The Problem',
    prob_h2:     'Mangistau:\nBeauty vs Danger',
    prob_text:   'Over 500,000 tourists visit the region annually. Popular locations like Bozzhyra and the Tuzbair salt flat sit in total signal-dead zones.',
    prob_c1_t:   'No GSM Signal',
    prob_c1:     'Complete absence of GSM signal for 100+ km. Standard navigation fails entirely.',
    prob_c2_t:   'Extreme Heat +45°C',
    prob_c2:     'Extreme heat and dehydration risk. No shelter for hundreds of kilometres.',
    prob_c3_t:   'Rough Terrain',
    prob_c3:     'Risk of getting stuck in salt flats. Inexperienced drivers on rented 4WDs.',
    feat_tag:    'How It Works',
    feat_h2:     'How DeadEnd works.',
    f1_t: 'Server Watchdog',     f1: 'Server-side control logic. If you don\'t confirm your return on time — the alarm triggers automatically, even if your phone is destroyed.',
    f2_t: 'Offline-First',       f2: 'Vector maps of salt flats, springs, and trails. Works without internet. Compressed data allows SOS even on a weak 2G signal.',
    f3_t: 'Chain Reaction',      f3: 'Automated notification chain: Trusted contacts → Local guides → Emergency services.',
    f4_t: 'Survival Interface',  f4: 'Maximum simplicity for stressful situations. Set a timer in 2 taps, tap "I\'m OK" to extend your trip.',
    f5_t: 'Offline Maps',        f5: 'High-contrast maps readable in bright sunlight. Battery and GPS accuracy indicators always visible.',
    f6_t: 'MChS Dashboard',      f6: 'SaaS platform for dispatching wilderness tourism. Real-time digital registry of active routes.',
    stack_tag:   'Stack',
    stack_sub:   'Modern stack chosen for reliability, speed, and zero server cost at launch.',
    team_tag:    'The Team',
    team_h2:     'Three people. Forty-eight hours.',
    m1_role: 'Fullstack Lead',    m1_note: 'GPS tracking pipeline, MChS real-time dashboard, and offline sync architecture.',
    m2_role: 'Design & Frontend', m2_note: 'Tourist UX, SOS interface, and the visual language that makes it feel alive.',
    m3_role: 'Backend & Data',    m3_note: 'Firebase schema, real-time sync, and data models that coordinate rescue operations.',
    cta_tag:     'Let\'s Go',
    cta_h2:      'Let\'s make the\nsteppe safe.',
    cta_sub:     'Ready to pilot and integrate with government services.',
    cta_btn:     'Open App →',
    footer:      'DeadEnd — Your digital guardian in a world without signal.',
  },

  ru: {
    nav_label:   'О нас',
    open_app:    'Открыть приложение',
    hero_tag:    'О проекте · Хакатон 2026 · Казахстан',
    hero_h1:     'Создано, чтобы все вернулись домой.',
    hero_sub:    'Цифровой протокол безопасности для дикого туризма в условиях отсутствия связи. DeadEnd превращает хаотичный поиск в точную спасательную операцию.',
    hero_cta1:   'Открыть приложение →',
    hero_cta2:   'Возможности',
    stat1_label: 'туристов в год в Мангистау',
    stat2_n:     '80%',
    stat2_label: 'сокращение времени поиска',
    stat3_label: 'отслеживаемых направлений',
    stat4_n:     '48ч',
    stat4_label: 'создано на хакатоне',
    prob_tag:    'Проблема',
    prob_h2:     'Мангистау:\nКрасота vs Опасность',
    prob_text:   'Ежегодно регион посещают более 500,000 туристов. Популярные локации (Бозжыра, сор Тузбаир) находятся в «слепых зонах» связи.',
    prob_c1_t:   'Нет GSM-сигнала',
    prob_c1:     'Полное отсутствие GSM-сигнала на 100+ км. Стандартная навигация не работает.',
    prob_c2_t:   'Жара +45°C',
    prob_c2:     'Экстремальная жара (+45°C) и риск дегидратации. Никакого укрытия на сотни километров.',
    prob_c3_t:   'Сложный рельеф',
    prob_c3:     'Риск застревания в солончаках. Неопытность водителей на арендованных авто.',
    feat_tag:    'Как это работает',
    feat_h2:     'Как работает DeadEnd?',
    f1_t: 'Server Watchdog',         f1: 'Логика контроля на сервере. Если вы не подтвердили возврат вовремя — тревога поднимается автоматически, даже если ваш телефон разбит.',
    f2_t: 'Offline-First',           f2: 'Векторные карты солончаков, родников и троп. Работают без интернета. Сжатие данных позволяет отправить SOS даже по слабому 2G сигналу.',
    f3_t: 'Chain Reaction',          f3: 'Автоматизированная цепочка оповещения: Доверенные лица → Локальные гиды → ДЧС.',
    f4_t: 'Интерфейс Выживания',     f4: 'Максимальная лаконичность для стрессовых ситуаций. Установка таймера в 2 клика, кнопка «Я в порядке» для продления.',
    f5_t: 'Офлайн-карты',            f5: 'Высококонтрастные карты для яркого солнца. Индикаторы заряда и точности GPS.',
    f6_t: 'Дашборд МЧС',             f6: 'SaaS-платформа для диспетчеризации дикого туризма. Цифровой реестр маршрутов в реальном времени.',
    stack_tag:   'Стек',
    stack_sub:   'Современный стек для надёжности, скорости и нулевых серверных расходов на старте.',
    team_tag:    'Команда',
    team_h2:     'Три человека. Сорок восемь часов.',
    m1_role: 'Fullstack Lead',      m1_note: 'GPS-трекинг, дашборд МЧС в реальном времени и архитектура офлайн-синка.',
    m2_role: 'Дизайн и фронтенд',  m2_note: 'UX для туристов, интерфейс SOS и визуальный язык продукта.',
    m3_role: 'Бэкенд и данные',    m3_note: 'Схема Firebase, синхронизация в реальном времени и модели данных для координации спасения.',
    cta_tag:     'Вместе',
    cta_h2:      'Давайте сделаем\nстепь безопасной.',
    cta_sub:     'Готовы к пилотированию и интеграции с государственными сервисами.',
    cta_btn:     'Открыть приложение →',
    footer:      'DeadEnd — Ваш цифровой страж в мире без связи.',
  },

  kz: {
    nav_label:   'Біз туралы',
    open_app:    'Қосымшаны ашу',
    hero_tag:    'Жоба туралы · Хакатон 2026 · Қазақстан',
    hero_h1:     'Барлығы үйге оралсын деп жасалды.',
    hero_sub:    'Байланыссыз аймақтарда жабайы туризм үшін цифрлық қауіпсіздік протоколы. DeadEnd хаотты іздеуді нақты құтқару операциясына айналдырады.',
    hero_cta1:   'Қосымшаны ашу →',
    hero_cta2:   'Мүмкіндіктер',
    stat1_label: 'турист жыл сайын Маңғыстауға келеді',
    stat2_n:     '80%',
    stat2_label: 'іздеу уақытын қысқарту',
    stat3_label: 'бақыланатын бағыт',
    stat4_n:     '48с',
    stat4_label: 'хакатонда жасалды',
    prob_tag:    'Мәселе',
    prob_h2:     'Маңғыстау:\nСұлулық vs Қауіп',
    prob_text:   'Жыл сайын регионға 500,000-нан астам турист келеді. Танымал орындар (Бозжыра, Тұзбайыр сөры) байланыссыз «соқыр аймақтарда» орналасқан.',
    prob_c1_t:   'GSM сигналы жоқ',
    prob_c1:     '100+ км-ге GSM сигналының толық болмауы. Стандартты навигация жұмыс істемейді.',
    prob_c2_t:   'Ыстық +45°C',
    prob_c2:     'Экстремалды ыстық (+45°C) және дегидратация қаупі. Жүздеген шақырымда баспана жоқ.',
    prob_c3_t:   'Күрделі рельеф',
    prob_c3:     'Тұзды жазықтарда тұрып қалу қаупі. Жалданған көліктердегі тәжірибесіз жүргізушілер.',
    feat_tag:    'Қалай жұмыс істейді',
    feat_h2:     'DeadEnd қалай жұмыс істейді?',
    f1_t: 'Server Watchdog',         f1: 'Серверлік бақылау логикасы. Уақытында оралуды растамасаңыз — телефоныңыз сынса да, дабыл автоматты іске қосылады.',
    f2_t: 'Offline-First',           f2: 'Тұзды жазықтар, бұлақтар мен жолдардың векторлық карталары. Интернетсіз жұмыс істейді. Деректерді қысу әлсіз 2G сигналда да SOS жіберуге мүмкіндік береді.',
    f3_t: 'Chain Reaction',          f3: 'Автоматтандырылған хабарландыру тізбегі: Сенімді тұлғалар → Жергілікті гидтер → ТЖД.',
    f4_t: 'Тіршілік интерфейсі',    f4: 'Стресстік жағдайлар үшін максималды қарапайымдылық. 2 тыртылдан таймер, «Мен жақсымын» батырмасы.',
    f5_t: 'Офлайн карталары',        f5: 'Күн сәулесінде оқылатын жоғары контрастты карталар. Заряд және GPS дәлдігі индикаторлары.',
    f6_t: 'ТЖМ дашборды',            f6: 'Жабайы туризмді диспетчеризациялауға арналған SaaS платформасы. Нақты уақыттағы маршруттар тізілімі.',
    stack_tag:   'Стек',
    stack_sub:   'Сенімділік, жылдамдық және нөл сервер шығыны үшін таңдалған заманауи стек.',
    team_tag:    'Команда',
    team_h2:     'Үш адам. Қырық сегіз сағат.',
    m1_role: 'Fullstack Lead',        m1_note: 'GPS бақылау желісі, ТЖМ нақты уақыт дашборды және офлайн-синк архитектурасы.',
    m2_role: 'Дизайн және фронтенд', m2_note: 'Турист UX, SOS интерфейсі және өнімнің визуалды тілі.',
    m3_role: 'Бэкенд және деректер', m3_note: 'Firebase схемасы, нақты уақыт синхронизациясы және құтқаруды үйлестіру деректер модельдері.',
    cta_tag:     'Бірге',
    cta_h2:      'Даланы\nқауіпсіз етейік.',
    cta_sub:     'Мемлекеттік сервистермен пилоттық және интеграцияға дайынбыз.',
    cta_btn:     'Қосымшаны ашу →',
    footer:      'DeadEnd — Байланыссыз әлемдегі цифрлық сақшыңыз.',
  },
};

// ─── scroll root ─────────────────────────────────────────────────────────────
const getRoot = () => document.querySelector('.about-scroll');

// ─── IntersectionObserver hook ───────────────────────────────────────────────
function useInView(opts = {}) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); io.unobserve(el); } },
      { root: getRoot(), threshold: 0.06, rootMargin: '-16px 0px', ...opts }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, v];
}

// ─── Reveal ──────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : 'translateY(24px) scale(0.98)',
      transition: `opacity 540ms ${E} ${delay}ms, transform 540ms ${E} ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Counter ─────────────────────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '' }) {
  const ref  = useRef(null);
  const done = useRef(false);
  const [ioRef, v] = useInView({ threshold: 0.4 });
  useEffect(() => {
    if (!v || done.current || !ref.current) return;
    done.current = true;
    const dur = 1500, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      if (ref.current) ref.current.textContent = prefix + Math.round(ease(p) * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [v]);
  return <span ref={el => { ref.current = el; ioRef.current = el; }}>{prefix}0{suffix}</span>;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
function Tag({ children, accent, center }) {
  const c = accent || 'rgba(255,255,255,0.28)';
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.13em',
      textTransform: 'uppercase', color: c, marginBottom: 20,
      display: 'flex', alignItems: 'center',
      justifyContent: center ? 'center' : 'flex-start', gap: 10,
    }}>
      <span style={{ width: 18, height: 1, background: c, flexShrink: 0, display: 'block' }} />
      {children}
      {center && <span style={{ width: 18, height: 1, background: c, flexShrink: 0, display: 'block' }} />}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FCard({ icon, title, desc, col, row, accent, delay }) {
  const [ref, v] = useInView();
  const [hov, setHov] = useState(false);
  const bg  = accent ? `${accent}0d` : 'rgba(255,255,255,0.025)';
  const bgH = accent ? `${accent}1a` : 'rgba(255,255,255,0.04)';
  const bd  = accent ? `${accent}33` : border;
  const bdH = accent ? `${accent}55` : 'rgba(255,255,255,0.13)';
  return (
    <div ref={ref} style={{
      gridColumn: col, gridRow: row,
      opacity: v ? 1 : 0,
      transform: v ? 'none' : 'translateY(20px) scale(0.98)',
      transition: `opacity 500ms ${E} ${delay}ms, transform 500ms ${E} ${delay}ms`,
    }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: '100%', padding: '28px 26px', borderRadius: 14,
          background: hov ? bgH : bg,
          border: `1px solid ${hov ? bdH : bd}`,
          display: 'flex', flexDirection: 'column', gap: 18,
          transition: `background 220ms ease, border-color 220ms ease, transform 260ms ${E}`,
          transform: hov ? 'translateY(-3px)' : 'none',
          cursor: 'default', boxSizing: 'border-box',
        }}
      >
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', color: accent || 'rgba(255,255,255,0.2)',
          display: 'block',
        }}>{icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Team card ───────────────────────────────────────────────────────────────
function TCard({ name, role, note, delay }) {
  const [ref, v] = useInView();
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : 'translateY(20px) scale(0.97)',
      transition: `opacity 500ms ${E} ${delay}ms, transform 500ms ${E} ${delay}ms`,
    }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: '28px 24px', borderRadius: 12,
          background: hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${hov ? 'rgba(201,160,85,0.22)' : border}`,
          transform: hov ? 'translateY(-4px)' : 'none',
          transition: `background 200ms ease, border-color 200ms ease, transform 260ms ${E}`,
          cursor: 'default',
        }}
      >
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: hov ? 'rgba(201,160,85,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hov ? 'rgba(201,160,85,0.32)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 14,
            color: hov ? gold : 'rgba(255,255,255,0.3)',
            letterSpacing: '-0.02em',
            transition: 'all 200ms ease',
          }}>
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)',
          }}>{role.slice(0, 3).toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: gold, marginBottom: 12 }}>{role}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75 }}>{note}</div>
      </div>
    </div>
  );
}

const TECH = ['React 18', 'Firebase RTDB', 'Vite', 'React Router v6', 'Open-Meteo API', 'Vercel', 'GPS / Geolocation', 'localStorage'];
const LANGS = ['kz', 'ru', 'en'];

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AboutUs() {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const tx = TX[lang] || TX.ru;
  const [on, setOn] = useState(false);
  const width   = useWindowWidth();
  const isMobile = width < 768;

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const press   = e => { e.currentTarget.style.transform = 'scale(0.97)'; };
  const release = e => { e.currentTarget.style.transform = ''; };

  const features = [
    { icon: '01', title: tx.f1_t, desc: tx.f1, col: '1 / 3', row: '1',     accent: null      },
    { icon: '02', title: tx.f2_t, desc: tx.f2, col: '3',     row: '1 / 3', accent: '#E05252' },
    { icon: '03', title: tx.f3_t, desc: tx.f3, col: '1',     row: '2',     accent: null      },
    { icon: '04', title: tx.f4_t, desc: tx.f4, col: '2',     row: '2',     accent: null      },
    { icon: '05', title: tx.f5_t, desc: tx.f5, col: '1',     row: '3',     accent: null      },
    { icon: '06', title: tx.f6_t, desc: tx.f6, col: '2 / 4', row: '3',     accent: null      },
  ];

  const team = [
    { name: 'Nsungat', role: tx.m1_role, note: tx.m1_note },
    { name: 'Aizat',   role: tx.m2_role, note: tx.m2_note },
    { name: 'Bekzat',  role: tx.m3_role, note: tx.m3_note },
  ];

  return (
    <div className="about-scroll" style={{
      background: '#0d0d0d', color: '#fff',
      fontFamily: 'DM Sans, sans-serif',
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, height: 56,
        padding: `0 ${isMobile ? 20 : 40}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(13,13,13,0.82)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 17,
          letterSpacing: '-0.03em', color: '#fff',
        }}>
          dead<span style={{ color: gold }}>end</span>
        </button>

        {!isMobile && (
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
          }}>{tx.nav_label}</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Lang switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7, overflow: 'hidden',
          }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 11px', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                background: lang === l ? gold : 'transparent',
                color: lang === l ? '#0d0d0d' : 'rgba(255,255,255,0.38)',
                transition: `background 160ms ${E}, color 160ms ${E}`,
              }}>{l}</button>
            ))}
          </div>
          <button
            onClick={() => navigate('/')}
            onMouseDown={press} onMouseUp={release}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; release(e); }}
            style={{
              padding: '7px 16px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: `transform 160ms ${E}, background 180ms ease`,
            }}
          >{tx.open_app}</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: 'calc(100vh - 56px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: `${isMobile ? 60 : 80}px ${isMobile ? 20 : 48}px 0`,
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url(${PHOTO})`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'brightness(0.19) saturate(0.65)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.45) 45%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.35, backgroundImage: GRAIN }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 920, paddingBottom: isMobile ? 40 : 64 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: gold,
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30,
            opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(10px)',
            transition: `opacity 480ms ${E}, transform 480ms ${E}`,
          }}>
            <span style={{ width: 22, height: 1, background: gold, flexShrink: 0, display: 'block' }} />
            {tx.hero_tag}
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(52px, 8vw, 106px)',
            fontWeight: 900, lineHeight: 0.93, letterSpacing: '-0.04em',
            maxWidth: '14ch', marginBottom: 30,
            opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(28px) scale(0.97)',
            transition: `opacity 580ms ${E} 65ms, transform 580ms ${E} 65ms`,
          }}>{tx.hero_h1}</h1>

          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.52)', lineHeight: 1.75, maxWidth: '50ch', marginBottom: 40,
            opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(14px)',
            transition: `opacity 520ms ${E} 130ms, transform 520ms ${E} 130ms`,
          }}>{tx.hero_sub}</p>

          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(12px)',
            transition: `opacity 500ms ${E} 195ms, transform 500ms ${E} 195ms`,
          }}>
            <button
              onClick={() => navigate('/')}
              onMouseDown={press}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,160,85,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ padding: '12px 28px', borderRadius: 8, background: gold, border: 'none', color: '#0d0d0d', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: '-0.01em', transition: `transform 160ms ${E}, box-shadow 200ms ease` }}
            >{tx.hero_cta1}</button>
            <a href="#features"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              style={{ padding: '12px 28px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'background 180ms ease' }}
            >{tx.hero_cta2}</a>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ position: 'relative', zIndex: 3, borderTop: `1px solid rgba(255,255,255,0.08)`, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', opacity: on ? 1 : 0, transition: `opacity 600ms ${E} 260ms` }}>
          {[
            { num: <Counter target={500} suffix="K+" />, label: tx.stat1_label },
            { num: tx.stat2_n,                           label: tx.stat2_label },
            { num: <Counter target={8} />,               label: tx.stat3_label },
            { num: tx.stat4_n,                           label: tx.stat4_label },
          ].map((s, i) => (
            <div key={i} style={{ padding: '24px 0 28px', paddingLeft: i > 0 ? 32 : 0, borderLeft: i > 0 ? `1px solid rgba(255,255,255,0.07)` : 'none' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#fff', marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 72 : 120}px ${isMobile ? 20 : 48}px`, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '0 80px', alignItems: 'start' }}>
          <Reveal>
            <Tag accent={gold}>{tx.prob_tag}</Tag>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(30px, 4.5vw, 56px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.035em', whiteSpace: 'pre-line' }}>{tx.prob_h2}</h2>
          </Reveal>
          <div>
            <Reveal delay={70}>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.48)', lineHeight: 1.85, marginBottom: 32 }}>{tx.prob_text}</p>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { t: tx.prob_c1_t, b: tx.prob_c1, n: '01' },
                { t: tx.prob_c2_t, b: tx.prob_c2, n: '02' },
                { t: tx.prob_c3_t, b: tx.prob_c3, n: '03' },
              ].map((c, i) => (
                <Reveal key={i} delay={i * 65 + 100}>
                  <div style={{
                    padding: '18px 20px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: '2px solid rgba(201,160,85,0.4)',
                    borderRadius: '0 10px 10px 0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(201,160,85,0.45)', letterSpacing: '0.12em', flexShrink: 0 }}>{c.n}</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                        {c.t.replace(/^[^\w\sЀ-ӿ]+\s*/, '')}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.44)', lineHeight: 1.7, paddingLeft: 28 }}>{c.b}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: `${isMobile ? 72 : 120}px ${isMobile ? 20 : 48}px`, background: 'rgba(255,255,255,0.015)', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal style={{ marginBottom: 52 }}>
            <Tag>{tx.feat_tag}</Tag>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>{tx.feat_h2}</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
            {features.map((f, i) => (
              <FCard key={i} {...f}
                col={isMobile ? 'auto' : f.col}
                row={isMobile ? 'auto' : f.row}
                delay={i * 55}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STACK ────────────────────────────────────────────── */}
      <section style={{ padding: `72px ${isMobile ? 20 : 48}px`, maxWidth: 1200, margin: '0 auto' }}>
        <Reveal style={{ marginBottom: 36 }}>
          <Tag>{tx.stack_tag}</Tag>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', maxWidth: '52ch', lineHeight: 1.7 }}>{tx.stack_sub}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
          {TECH.map((name, i) => (
            <Reveal key={i} delay={i * 35}>
              <div
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,160,85,0.32)'; e.currentTarget.style.background = 'rgba(201,160,85,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.025)', border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'default', transition: 'background 200ms ease, border-color 200ms ease',
                }}
              >
                <span style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700,
                  color: 'rgba(201,160,85,0.38)', letterSpacing: '0.1em', flexShrink: 0,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.62)' }}>{name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 72 : 100}px ${isMobile ? 20 : 48}px`, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal style={{ marginBottom: 52 }}>
            <Tag>{tx.team_tag}</Tag>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{tx.team_h2}</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
            {team.map((m, i) => <TCard key={i} {...m} delay={i * 70} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: `${isMobile ? 90 : 150}px ${isMobile ? 20 : 48}px`, textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${PHOTO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', filter: 'brightness(0.12) saturate(0.5)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(201,160,85,0.14) 0%, rgba(13,13,13,0.65) 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: GRAIN }} />
        <Reveal style={{ position: 'relative', zIndex: 1 }}>
          <Tag accent={gold} center>{tx.cta_tag}</Tag>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 5.5vw, 68px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: 20, whiteSpace: 'pre-line' }}>{tx.cta_h2}</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: '40ch', margin: '0 auto 44px', lineHeight: 1.72 }}>{tx.cta_sub}</p>
          <button
            onClick={() => navigate('/')}
            onMouseDown={press}
            onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(201,160,85,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
            style={{ padding: '14px 36px', borderRadius: 8, background: gold, border: 'none', color: '#0d0d0d', fontWeight: 800, fontSize: 15, cursor: 'pointer', letterSpacing: '-0.01em', transition: `transform 160ms ${E}, box-shadow 200ms ease` }}
          >{tx.cta_btn}</button>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding: `24px ${isMobile ? 20 : 48}px`, borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em' }}>
          dead<span style={{ color: gold }}>end</span>
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>{tx.footer}</span>
      </footer>

    </div>
  );
}
