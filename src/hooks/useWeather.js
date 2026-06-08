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

export function getMamaTips(weather) {
  if (!weather) return [];
  const tips = [];
  const { today, tomorrow } = weather;

  if (tomorrow.windMax >= 15)
    tips.push({ icon: '💨', text: `Ертең желдің жылдамдығы ${tomorrow.windMax} м/с. Жеңіл киім алма, желден қорған.`, type: 'warning' });
  else if (today.windMax >= 12)
    tips.push({ icon: '💨', text: `Бүгін желдің жылдамдығы ${today.windMax} м/с. Желтоқсан кезінде ашық жерде ұзақ тұрма.`, type: 'warning' });

  if (tomorrow.tempMin <= 10)
    tips.push({ icon: '🌙', text: `Ертең түнде температура +${tomorrow.tempMin}°C. Жылы кофта, ұйқы қабы ал.`, type: 'info' });

  if (today.tempMin <= 12)
    tips.push({ icon: '🧥', text: `Кешке +${today.tempMin}°C. Қайту уақытыңды ескер.`, type: 'info' });

  if (tomorrow.rainChance >= 40)
    tips.push({ icon: '🌧️', text: `Ертең жаңбыр мүмкіндігі ${tomorrow.rainChance}%. Жолдар сырғанақ болуы мүмкін.`, type: 'warning' });

  if (today.rainChance >= 50)
    tips.push({ icon: '☔', text: `Бүгін жаңбыр болуы мүмкін (${today.rainChance}%). Су өткізбейтін киім ал.`, type: 'warning' });

  if (tips.length === 0)
    tips.push({ icon: '✅', text: `Ауа-райы қолайлы. Бүгін +${today.tempMax}°C, жел ${today.windMax} м/с. Жақсы сапар!`, type: 'success' });

  return tips;
}
