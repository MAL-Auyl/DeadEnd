import { useState } from 'react';

const MAX_KM = 10000;

const REAL_WORLD = [
  { km: 0,     text: 'Старт. Путь только начинается.' },
  { km: 150,   text: 'Алматы → Бишкек. Пешком — около 4 дней.' },
  { km: 500,   text: 'Астана → Алматы по прямой. Пешком — около 2 недель.' },
  { km: 1300,  text: 'Москва → Варшава. Пешком — около месяца.' },
  { km: 2000,  text: 'Лондон → Москва. Пешком — почти 2 месяца.' },
  { km: 3000,  text: 'Ширина Казахстана с запада на восток. Пешком — 2,5 месяца.' },
  { km: 5000,  text: 'Москва → Владивосток (половина Транссиба). Пешком — 4 месяца.' },
  { km: 7500,  text: 'Через всю Европу и часть Азии. Пешком — полгода.' },
  { km: 10000, text: 'Почти четверть окружности Земли. Пешком — около 8 месяцев без остановок.' },
];

const UNIVERSES = [
  {
    id: 'lotr',
    label: 'Властелин колец',
    milestones: [
      { km: 0,    text: 'Хоббитон, Шир. Кольцо спит — путешествие ещё не началось.' },
      { km: 200,  text: 'Бри, трактир «Гарцующий пони». Хоббиты впервые встречают Бродяжника.' },
      { km: 676,  text: 'Ривенделл. Совет у Элронда — Братство Кольца формируется.' },
      { km: 1020, text: 'Мория. Гэндальф пал в схватке с Барлогом — путь не остановить.' },
      { km: 1150, text: 'Лотлориэн. Галадриэль увидела Кольцо — и отказалась от него.' },
      { km: 1650, text: 'Минас Тирит. Война Кольца у самых стен города.' },
      { km: 2863, text: 'Роковая гора. Кольцо уничтожено — именно столько прошли Фродо и Сэм.' },
      { km: 5726, text: 'Путь до Роковой горы и обратно в Шир — дважды. Фродо давно дома.' },
    ],
  },
  {
    id: 'got',
    label: 'Игра престолов',
    milestones: [
      { km: 0,    text: 'Винтерфелл. Зима близко, но путь ещё не начат.' },
      { km: 300,  text: 'Ров Кейлин — граница Севера и Юга, ворота на юг.' },
      { km: 700,  text: 'Близнецы. Переправа через Трезубец у Фреев.' },
      { km: 1200, text: 'Харренхол — самый зловещий замок Вестероса позади.' },
      { km: 1800, text: 'Риверран. До столицы рукой подать.' },
      { km: 2350, text: 'Королевская Гавань. Столько Нед Старк ехал верхом — около месяца пути.' },
      { km: 4700, text: 'Путь туда и обратно — Дейенерис дважды пересекла бы Узкое море.' },
      { km: 8000, text: 'Ты обогнул весь Вестерос несколько раз. Север помнит.' },
    ],
  },
  {
    id: 'aot',
    label: 'Атака титанов',
    milestones: [
      { km: 0,    text: 'Внутри стены Сина. Здесь безопасно — пока что.' },
      { km: 143,  text: 'Половина окружности стены Сина пройдена.' },
      { km: 287,  text: 'Полная окружность стены Сина — самого внутреннего кольца.' },
      { km: 420,  text: 'Половина окружности стены Роза.' },
      { km: 841,  text: 'Полная окружность стены Роза пройдена.' },
      { km: 1603, text: 'Полная окружность стены Мария — самой большой стены Эльдии.' },
      { km: 3206, text: 'Стену Марии — дважды по периметру. Эрен бы оценил.' },
      { km: 6000, text: 'Путь от Парадиза до Марли через океан — и обратно.' },
    ],
  },
  {
    id: 'naruto',
    label: 'Наруто',
    milestones: [
      { km: 0,    text: 'Конохагакуре. Первая миссия класса D ещё впереди.' },
      { km: 80,   text: 'Граница Страны Огня — патрульный отряд генинов.' },
      { km: 200,  text: 'Страна Волн. Миссия против Забузы и Хаку.' },
      { km: 500,  text: 'Полпути через пустыню до Сунагакуре.' },
      { km: 800,  text: 'Сунагакуре. Спасение Гаары от Акацуки.' },
      { km: 1500, text: 'Путь Наруто за Саске после предательства — он не останавливался.' },
      { km: 3000, text: 'Путь до Деревни Облака и обратно без единой остановки.' },
      { km: 6000, text: 'Ты пересёк весь Континент шиноби несколько раз вдоль и поперёк.' },
    ],
  },
  {
    id: 'avatar',
    label: 'Аватар',
    milestones: [
      { km: 0,    text: 'Южный полюс. Аанг только проснулся во льдах — Огненная Нация ещё не знает.' },
      { km: 600,  text: 'Южный воздушный храм. Аанг находит первые следы своего народа.' },
      { km: 1300, text: 'Полпути до Ба Синг Се — Аппа уже порядком устал.' },
      { km: 2000, text: 'Озеро Лаогай на подступах к городу.' },
      { km: 2600, text: 'Ба Синг Се. Величайший город мира — «здесь нет войны».' },
      { km: 4000, text: 'Через океан до Огненной Нации — логово Озая.' },
      { km: 5200, text: 'Аанг облетел бы на Аппе весь этот маршрут дважды.' },
      { km: 8000, text: 'Почти кругосветка по миру Аватара — на одном Аппе.' },
    ],
  },
  {
    id: 'witcher',
    label: 'Ведьмак',
    milestones: [
      { km: 0,    text: 'Каэр Морхен. Геральт точит мечи перед дальней дорогой.' },
      { km: 200,  text: 'Велен. Болота, Дикая Охота уже идёт по следу.' },
      { km: 400,  text: 'Новиград — крупнейший город Континента.' },
      { km: 700,  text: 'Скеллиге. Шторм за штормом, но Цири где-то рядом.' },
      { km: 1000, text: 'Туссент — далеко на юге, винные погреба и турниры.' },
      { km: 1300, text: 'Весь маршрут поисков Цири пройден от и до.' },
      { km: 2600, text: 'Геральт и Цири вместе прошли этот путь дважды.' },
      { km: 5000, text: 'Дальше Чёрных Болот ещё никто не забирался. Кроме тебя.' },
    ],
  },
];

function getFact(milestones, km) {
  let match = milestones[0];
  for (const m of milestones) {
    if (km >= m.km) match = m; else break;
  }
  return match;
}

export default function KmTracker({ initialKm = 0 }) {
  const [km, setKm] = useState(Math.min(Math.max(initialKm, 0), MAX_KM));
  const [universeId, setUniverseId] = useState(UNIVERSES[0].id);

  const universe = UNIVERSES.find(u => u.id === universeId);
  const realWorld = getFact(REAL_WORLD, km);
  const fact = getFact(universe.milestones, km);
  const pct = Math.min((km / MAX_KM) * 100, 100);

  function handleChange(value) {
    const n = Math.min(Math.max(Number(value) || 0, 0), MAX_KM);
    setKm(n);
  }

  return (
    <div className="km-tracker">
      {/* BIG NUMBER */}
      <div className="km-tracker-number">
        {km.toLocaleString()}
        <span className="km-tracker-unit">км</span>
      </div>
      <div className="km-tracker-realworld">{realWorld.text}</div>

      {/* PROGRESS BAR */}
      <div className="km-tracker-progress">
        <div className="km-tracker-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="km-tracker-range-labels">
        <span>0</span>
        <span>{MAX_KM.toLocaleString()} км</span>
      </div>

      {/* CONTROLS */}
      <div className="km-tracker-controls">
        <input
          type="range"
          className="km-tracker-slider"
          min={0}
          max={MAX_KM}
          step={10}
          value={km}
          onChange={e => handleChange(e.target.value)}
          style={{ background: `linear-gradient(to right, var(--gold) ${pct}%, var(--border) ${pct}%)` }}
        />
        <div className="km-tracker-input-wrap">
          <input
            type="number"
            className="km-tracker-input"
            min={0}
            max={MAX_KM}
            value={km}
            onChange={e => handleChange(e.target.value)}
          />
          <span className="km-tracker-input-suffix">км</span>
        </div>
      </div>

      {/* UNIVERSE PICKER */}
      <div className="km-tracker-universe-label">Выбери вселенную</div>
      <div className="km-tracker-universes">
        {UNIVERSES.map(u => (
          <button
            key={u.id}
            type="button"
            className={`km-tracker-universe-btn${u.id === universeId ? ' active' : ''}`}
            onClick={() => setUniverseId(u.id)}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* CURRENT FACT CARD */}
      <div className="km-tracker-card">
        <div className="km-tracker-card-tag">{universe.label}</div>
        <div className="km-tracker-card-text">{fact.text}</div>
      </div>

      {/* MILESTONE LIST */}
      <div className="km-tracker-milestones">
        {universe.milestones.map(m => {
          const reached = km >= m.km;
          return (
            <div key={m.km} className={`km-tracker-milestone${reached ? ' reached' : ''}`}>
              <span className="km-tracker-milestone-dot" />
              <span className="km-tracker-milestone-km">{m.km.toLocaleString()} км</span>
              <span className="km-tracker-milestone-text">{m.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
