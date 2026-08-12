/**
 * Dynamic weather utility
 * Generates realistic weather data based on current date and season.
 * For production, replace with a real weather API (e.g., OpenWeatherMap, QWeather).
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  city: string;
}

// Seasonal temperature ranges for Shanghai (can be adjusted per city)
const SEASONAL_RANGES: Record<string, { min: number; max: number; conditions: string[] }> = {
  spring: { min: 10, max: 22, conditions: ['晴', '多云', '阴', '小雨'] },
  summer: { min: 25, max: 35, conditions: ['晴', '多云', '雷阵雨', '晴转多云'] },
  autumn: { min: 12, max: 24, conditions: ['晴', '多云', '晴转多云', '阴'] },
  winter: { min: 2, max: 10, conditions: ['晴', '多云', '阴', '小雨', '雨夹雪'] },
};

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// Seeded random based on date for consistent results within a day
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getCurrentWeather(city: string = '上海'): WeatherData {
  const now = new Date();
  const month = now.getMonth() + 1;
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const season = getSeason(month);
  const range = SEASONAL_RANGES[season];

  // Use day as seed for consistent weather within the same day
  const seed = now.getFullYear() * 10000 + (month) * 100 + now.getDate();
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  const rand3 = seededRandom(seed + 2);

  const temperature = Math.round(range.min + rand1 * (range.max - range.min));
  const conditionIndex = Math.floor(rand2 * range.conditions.length);
  const condition = range.conditions[conditionIndex];

  // Feels like: slightly different from actual temp
  const feelsLikeOffset = Math.round((rand3 - 0.5) * 4);
  const feelsLike = temperature + feelsLikeOffset;

  // Humidity varies by season
  const baseHumidity = season === 'summer' ? 70 : season === 'winter' ? 40 : 55;
  const humidity = baseHumidity + Math.round((rand1 - 0.5) * 20);

  // Wind speed
  const baseWind = season === 'spring' ? 15 : season === 'autumn' ? 12 : 8;
  const windSpeed = baseWind + Math.round(rand2 * 10);

  return {
    temperature,
    condition,
    feelsLike,
    humidity,
    windSpeed,
    city,
  };
}
