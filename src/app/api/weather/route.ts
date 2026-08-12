/**
 * 天气 API 路由
 * 
 * 代理和风天气 (QWeather) API 调用，提供实时天气数据。
 * 
 * 环境变量：
 * - QWEATHER_API_KEY: 和风天气 API Key（免费版在 devapi.qweather.com 注册获取）
 * 
 * 接口：
 * - GET /api/weather?city=上海  — 按城市名查询实时天气
 * - GET /api/weather?location=116.41,39.92  — 按经纬度查询实时天气
 * 
 * 返回格式：
 * {
 *   "code": "200",
 *   "data": {
 *     "temp": "25",           // 温度 ℃
 *     "feelsLike": "27",      // 体感温度
 *     "text": "多云",          // 天气状况文字
 *     "icon": "101",          // 天气图标代码
 *     "humidity": "65",       // 相对湿度 %
 *     "windDir": "东南风",     // 风向
 *     "windScale": "3",       // 风力等级
 *     "windSpeed": "15",      // 风速 km/h
 *     "vis": "25",            // 能见度 km
 *     "pressure": "1013",     // 气压 hPa
 *     "cloud": "70",          // 云量
 *     "dew": "18"             // 露点温度
 *   },
 *   "city": "上海",
 *   "updateTime": "2025-01-15T10:00:00+08:00"
 * }
 * 
 * 降级策略：
 * - 如果 QWEATHER_API_KEY 未配置，返回模拟天气数据（基于季节）
 * - 如果 API 调用失败，返回缓存或模拟数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSeasonalWeather } from '@/lib/weather';

// 和风天气 API 端点（免费版）
const QWEATHER_DEV_API = 'https://devapi.qweather.com';
const QWEATHER_GEO_API = 'https://geoapi.qweather.com';

interface QWeatherNowResponse {
  code: string;
  now?: {
    obsTime: string;
    temp: string;
    feelsLike: string;
    icon: string;
    text: string;
    wind360: string;
    windDir: string;
    windScale: string;
    windSpeed: string;
    humidity: string;
    precip: string;
    vis: string;
    pressure: string;
    cloud: string;
    dew: string;
  };
}

interface QWeatherGeoResponse {
  code: string;
  location?: Array<{
    name: string;
    id: string;
    lat: string;
    lon: string;
    adm2: string;
    adm1: string;
    country: string;
  }>;
}

/**
 * 通过城市名查询城市 ID
 */
async function lookupCity(city: string, apiKey: string): Promise<string | null> {
  try {
    const url = `${QWEATHER_GEO_API}/v2/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // 缓存 1 小时
    const data: QWeatherGeoResponse = await res.json();
    
    if (data.code === '200' && data.location && data.location.length > 0) {
      return data.location[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 查询实时天气
 */
async function fetchCurrentWeather(location: string, apiKey: string): Promise<QWeatherNowResponse | null> {
  try {
    const url = `${QWEATHER_DEV_API}/v7/weather/now?location=${location}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // 缓存 10 分钟
    const data: QWeatherNowResponse = await res.json();
    
    if (data.code === '200' && data.now) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const location = searchParams.get('location'); // 格式: "经度,纬度" 或城市ID

  const apiKey = process.env.QWEATHER_API_KEY;

  // 如果没有配置 API Key，返回模拟数据
  if (!apiKey) {
    const fallback = getSeasonalWeather(city || '上海');
    return NextResponse.json({
      code: '200',
      source: 'fallback',
      city: city || '上海',
      ...fallback,
      message: '未配置 QWEATHER_API_KEY，返回模拟天气数据',
    });
  }

  try {
    let locationId: string | null = null;
    const cityName = city || '上海';

    // 如果传了经纬度，直接使用
    if (location) {
      locationId = location;
    } 
    // 如果传了城市名，先查询城市 ID
    else if (city) {
      locationId = await lookupCity(city, apiKey);
      if (!locationId) {
        // 城市查询失败，返回模拟数据
        const fallback = getSeasonalWeather(city);
        return NextResponse.json({
          code: '200',
          source: 'fallback',
          city,
          ...fallback,
          message: `城市 "${city}" 查询失败，返回模拟数据`,
        });
      }
    }

    if (!locationId) {
      const fallback = getSeasonalWeather('上海');
      return NextResponse.json({
        code: '200',
        source: 'fallback',
        city: '上海',
        ...fallback,
      });
    }

    // 查询实时天气
    const weatherData = await fetchCurrentWeather(locationId, apiKey);
    
    if (!weatherData || !weatherData.now) {
      const fallback = getSeasonalWeather(cityName);
      return NextResponse.json({
        code: '200',
        source: 'fallback',
        city: cityName,
        ...fallback,
        message: '天气数据获取失败，返回模拟数据',
      });
    }

    const now = weatherData.now;
    return NextResponse.json({
      code: '200',
      source: 'qweather',
      city: cityName,
      data: {
        temp: now.temp,
        feelsLike: now.feelsLike,
        text: now.text,
        icon: now.icon,
        humidity: now.humidity,
        windDir: now.windDir,
        windScale: now.windScale,
        windSpeed: now.windSpeed,
        vis: now.vis,
        pressure: now.pressure,
        cloud: now.cloud,
        dew: now.dew,
      },
      updateTime: now.obsTime,
    });
  } catch {
    const fallback = getSeasonalWeather(city || '上海');
    return NextResponse.json({
      code: '200',
      source: 'fallback',
      city: city || '上海',
      ...fallback,
      message: '天气服务异常，返回模拟数据',
    });
  }
}
