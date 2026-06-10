import { useState, useEffect } from 'react';

export function useWeather(coords) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coords?.lat || !coords?.lng) return;
    setLoading(true);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}`
      + `&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m`
      + `&daily=temperature_2m_min,temperature_2m_max,wind_speed_10m_max,precipitation_probability_max,weather_code`
      + `&timezone=Asia%2FAqtau&forecast_days=2`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        setWeather({
          current: {
            temp: Math.round(d.current.temperature_2m),
            wind: Math.round(d.current.wind_speed_10m),
            humidity: d.current.relative_humidity_2m,
            code: d.current.weather_code,
          },
          today: {
            tempMax: Math.round(d.daily.temperature_2m_max[0]),
            tempMin: Math.round(d.daily.temperature_2m_min[0]),
            windMax: Math.round(d.daily.wind_speed_10m_max[0]),
            rainChance: d.daily.precipitation_probability_max[0],
            code: d.daily.weather_code[0],
          },
          tomorrow: {
            tempMax: Math.round(d.daily.temperature_2m_max[1]),
            tempMin: Math.round(d.daily.temperature_2m_min[1]),
            windMax: Math.round(d.daily.wind_speed_10m_max[1]),
            rainChance: d.daily.precipitation_probability_max[1],
            code: d.daily.weather_code[1],
          },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [coords?.lat, coords?.lng]);

  return { weather, loading };
}

export function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

const MAMA_TIP_TEXT = {
  kz: {
    windTomorrow: (v) => `Ертең желдің жылдамдығы ${v} м/с. Жеңіл киім алма, желден қорған.`,
    windToday:    (v) => `Бүгін желдің жылдамдығы ${v} м/с. Желтоқсан кезінде ашық жерде ұзақ тұрма.`,
    coldNight:    (v) => `Ертең түнде температура +${v}°C. Жылы кофта, ұйқы қабы ал.`,
    coldEvening:  (v) => `Кешке +${v}°C. Қайту уақытыңды ескер.`,
    rainTomorrow: (v) => `Ертең жаңбыр мүмкіндігі ${v}%. Жолдар сырғанақ болуы мүмкін.`,
    rainToday:    (v) => `Бүгін жаңбыр болуы мүмкін (${v}%). Су өткізбейтін киім ал.`,
    allGood:      (max, wind) => `Ауа-райы қолайлы. Бүгін +${max}°C, жел ${wind} м/с. Жақсы сапар!`,
  },
  ru: {
    windTomorrow: (v) => `Завтра скорость ветра до ${v} м/с. Не надевай только лёгкую одежду, защитись от ветра.`,
    windToday:    (v) => `Сегодня скорость ветра до ${v} м/с. Не стой долго на открытом месте.`,
    coldNight:    (v) => `Завтра ночью температура +${v}°C. Возьми тёплую кофту и спальник.`,
    coldEvening:  (v) => `Вечером +${v}°C. Учти время возвращения.`,
    rainTomorrow: (v) => `Завтра вероятность дождя ${v}%. Дороги могут быть скользкими.`,
    rainToday:    (v) => `Сегодня возможен дождь (${v}%). Возьми непромокаемую одежду.`,
    allGood:      (max, wind) => `Погода благоприятная. Сегодня +${max}°C, ветер ${wind} м/с. Хорошей поездки!`,
  },
  en: {
    windTomorrow: (v) => `Wind speed up to ${v} m/s tomorrow. Don't take only light clothes — protect yourself from the wind.`,
    windToday:    (v) => `Wind speed up to ${v} m/s today. Don't stay long in open areas.`,
    coldNight:    (v) => `Tomorrow night temperature +${v}°C. Take a warm sweater and a sleeping bag.`,
    coldEvening:  (v) => `Evening temperature +${v}°C. Plan your return time accordingly.`,
    rainTomorrow: (v) => `Rain chance ${v}% tomorrow. Roads may be slippery.`,
    rainToday:    (v) => `Rain possible today (${v}%). Take waterproof clothing.`,
    allGood:      (max, wind) => `Weather looks good. Today +${max}°C, wind ${wind} m/s. Have a great trip!`,
  },
};

export function getMamaTips(weather, lang = 'ru') {
  if (!weather) return [];
  const tips = [];
  const { today, tomorrow } = weather;
  const tx = MAMA_TIP_TEXT[lang] || MAMA_TIP_TEXT.ru;

  if (tomorrow.windMax >= 15)
    tips.push({ icon: '💨', text: tx.windTomorrow(tomorrow.windMax), type: 'warning' });
  else if (today.windMax >= 12)
    tips.push({ icon: '💨', text: tx.windToday(today.windMax), type: 'warning' });

  if (tomorrow.tempMin <= 10)
    tips.push({ icon: '🌙', text: tx.coldNight(tomorrow.tempMin), type: 'info' });

  if (today.tempMin <= 12)
    tips.push({ icon: '🧥', text: tx.coldEvening(today.tempMin), type: 'info' });

  if (tomorrow.rainChance >= 40)
    tips.push({ icon: '🌧️', text: tx.rainTomorrow(tomorrow.rainChance), type: 'warning' });

  if (today.rainChance >= 50)
    tips.push({ icon: '☔', text: tx.rainToday(today.rainChance), type: 'warning' });

  if (tips.length === 0)
    tips.push({ icon: '✅', text: tx.allGood(today.tempMax, today.windMax), type: 'success' });

  return tips;
}
