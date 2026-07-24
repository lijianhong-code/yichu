'use client';

import { useState } from 'react';
import {
  CloudSun,
  MapPin,
  Send,
  RefreshCw,
  Check,
  ChevronRight,
  Shirt,
  Image,
  Sparkles,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardrobeItems, outfits, quickScenarios } from '@/lib/mock-data';

// Today's recommended outfit (simulated AI result)
const todayOutfit = {
  items: [wardrobeItems[2], wardrobeItems[0], wardrobeItems[1], wardrobeItems[5], wardrobeItems[11]],
  name: '商务休闲通勤',
  explanation: '黑色西装搭配白T和牛仔裤，正式但不刻板，适合今日多云天气',
  weather: '18-24°C 多云',
  occasion: '通勤',
};

const alternativeOutfits = [
  todayOutfit,
  {
    items: [wardrobeItems[10], wardrobeItems[7], wardrobeItems[4], wardrobeItems[6], wardrobeItems[9]],
    name: '轻松层次感',
    explanation: '藏青风衣内搭条纹衬衫，搭配卡其阔腿裤，春秋经典组合',
    weather: '18-24°C 多云',
    occasion: '通勤',
  },
  {
    items: [wardrobeItems[3], wardrobeItems[1], wardrobeItems[6], wardrobeItems[5]],
    name: '温柔日常',
    explanation: '米色针织衫搭配牛仔裤和白色运动鞋，轻松舒适的日常穿搭',
    weather: '18-24°C 多云',
    occasion: '日常',
  },
];

export default function HomePage() {
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [worn, setWorn] = useState(false);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());

  const currentOutfit = alternativeOutfits[currentOutfitIndex];

  const handleWorn = () => {
    setWorn(true);
    setTimeout(() => setWorn(false), 2000);
  };

  const handleNextOutfit = () => {
    setCurrentOutfitIndex((prev) => (prev + 1) % alternativeOutfits.length);
  };

  const toggleLock = (itemId: string) => {
    setLockedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-25">
      {/* Top bar - weather & greeting */}
      <header className="px-4 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-neutral-900">
              下午好，小明
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              7月24日 周四
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] text-neutral-600 shadow-sm transition-wardrobe hover:bg-neutral-50">
            <CloudSun size={14} className="text-ai-400" />
            <span>上海 24°C</span>
          </button>
        </div>
      </header>

      {/* Quick input */}
      <section className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="今天有什么安排？"
              className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 pr-10 text-[14px] text-neutral-900 placeholder:text-neutral-500 focus:border-brand-600 focus:outline-none transition-wardrobe"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-brand-600 p-1.5 text-white transition-wardrobe hover:bg-brand-700">
              <Send size={14} />
            </button>
          </div>
        </div>
        {/* Quick scenario chips */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {quickScenarios.map((s) => (
            <button
              key={s.label}
              className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] text-neutral-600 transition-wardrobe hover:border-brand-600 hover:text-brand-700"
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Today's outfit - main visual */}
      <section className="px-4 py-2">
        <div className="outfit-stage relative overflow-hidden rounded-xl p-4">
          {/* Outfit items layout */}
          <div className="flex items-center justify-center gap-3 py-4">
            {currentOutfit.items.map((item, idx) => (
              <div
                key={item.id}
                className="group relative"
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-lg transition-wardrobe',
                    lockedItems.has(item.id)
                      ? 'ring-2 ring-brand-600'
                      : 'ring-1 ring-neutral-200/50 hover:ring-brand-600'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-24 w-20 object-contain bg-neutral-50 p-1.5"
                  />
                  {lockedItems.has(item.id) && (
                    <div className="absolute right-1 top-1 rounded-full bg-brand-600 p-0.5">
                      <Lock size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="mt-1.5 max-w-[5rem] truncate text-center text-[11px] text-neutral-600">
                  {item.name}
                </p>
              </div>
            ))}
          </div>

          {/* Outfit info */}
          <div className="mt-2 text-center">
            <h3 className="text-[15px] font-semibold text-neutral-900">
              {currentOutfit.name}
            </h3>
            <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">
              {currentOutfit.explanation}
            </p>
          </div>

          {/* Alternative dots */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {alternativeOutfits.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentOutfitIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-wardrobe',
                  idx === currentOutfitIndex
                    ? 'w-5 bg-brand-600'
                    : 'w-1.5 bg-neutral-300'
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <section className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleWorn}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-medium transition-wardrobe',
              worn
                ? 'bg-success-bg text-success-fg'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700'
            )}
          >
            {worn ? (
              <>
                <Check size={18} />
                已记录
              </>
            ) : (
              <>
                <Check size={18} />
                今天穿
              </>
            )}
          </button>
          <button
            onClick={handleNextOutfit}
            className="flex h-12 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-5 text-[14px] font-medium text-neutral-900 transition-wardrobe hover:bg-neutral-50"
          >
            <RefreshCw size={15} />
            换一套
          </button>
        </div>
      </section>

      {/* Secondary entries */}
      <section className="px-4 py-2">
        <div className="flex items-center gap-3">
          <button className="flex flex-1 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 transition-wardrobe hover:bg-neutral-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <Shirt size={18} className="text-brand-600" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium text-neutral-900">添加衣物</p>
              <p className="text-[11px] text-neutral-500">拍照或从相册导入</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-neutral-300" />
          </button>
          <button className="flex flex-1 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 transition-wardrobe hover:bg-neutral-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ai-50">
              <Image size={18} className="text-ai-600" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium text-neutral-900">参考图搭配</p>
              <p className="text-[11px] text-neutral-500">用你的衣物复刻</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-neutral-300" />
          </button>
        </div>
      </section>

      {/* AI insight card */}
      <section className="px-4 py-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-ai-400" />
            <span className="text-[12px] font-medium text-ai-600">AI 洞察</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
            你本周穿了 12 件衣物，衣橱利用率 68%。有 5 件单品超过 2 周未穿，要不要为它们搭配新方案？
          </p>
        </div>
      </section>
    </div>
  );
}
