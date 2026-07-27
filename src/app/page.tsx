'use client';

import { useState, useEffect } from 'react';
import {
  CloudSun,
  Send,
  RefreshCw,
  Check,
  ChevronRight,
  Shirt,
  Image as ImageIcon,
  Sparkles,
  Lock,
  ChevronDown,
  ThumbsUp,
  Thermometer,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardrobeItems, quickScenarios } from '@/lib/mock-data';

const todayOutfit = {
  items: [wardrobeItems[2], wardrobeItems[0], wardrobeItems[1], wardrobeItems[5], wardrobeItems[11]],
  name: '商务休闲通勤',
  explanation: '黑色西装搭配白T和牛仔裤，正式但不刻板，适合今日多云天气',
  weather: '18-24°C 多云',
  occasion: '通勤',
  reasons: [
    '黑色西装提升正式度，适合日常办公',
    '白T+牛仔裤平衡休闲感，不会过于严肃',
    '温度18-24°C，西装厚度适中',
  ],
};

const alternativeOutfits = [
  todayOutfit,
  {
    items: [wardrobeItems[10], wardrobeItems[7], wardrobeItems[4], wardrobeItems[6], wardrobeItems[9]],
    name: '轻松层次感',
    explanation: '藏青风衣内搭条纹衬衫，搭配卡其阔腿裤，春秋经典组合',
    weather: '18-24°C 多云',
    occasion: '通勤',
    reasons: [
      '藏青风衣挡风保暖，适合多云天气',
      '条纹衬衫增加层次感',
      '阔腿裤舒适且修饰腿型',
    ],
  },
  {
    items: [wardrobeItems[3], wardrobeItems[1], wardrobeItems[6], wardrobeItems[5]],
    name: '温柔日常',
    explanation: '米色针织衫搭配牛仔裤和白色运动鞋，轻松舒适的日常穿搭',
    weather: '18-24°C 多云',
    occasion: '日常',
    reasons: [
      '米色针织衫柔软舒适，适合日常',
      '经典蓝牛仔裤百搭不过时',
      '白色运动鞋轻松休闲',
    ],
  },
];

export default function HomePage() {
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [worn, setWorn] = useState(false);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [showWhy, setShowWhy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const currentOutfit = alternativeOutfits[currentOutfitIndex];

  const handleWorn = () => {
    setWorn(true);
    setTimeout(() => {
      setShowFeedback(true);
    }, 600);
  };

  const handleNextOutfit = () => {
    setCurrentOutfitIndex((prev) => (prev + 1) % alternativeOutfits.length);
  };

  const toggleLock = (itemId: string) => {
    setLockedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div className="min-h-screen bg-neutral-25 pb-4">
      {/* Top bar */}
      <header className="px-4 pb-1 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
              {greeting}，小明
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">{dateStr}</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[12px] text-neutral-600 ring-1 ring-neutral-200/60 transition-wardrobe hover:bg-white">
            <CloudSun size={14} className="text-ai-400" />
            <span className="tabular-nums">上海 24°C</span>
          </button>
        </div>
      </header>

      {/* Quick input */}
      <section className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-ai-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="今天有什么安排？"
              className="h-11 w-full rounded-lg bg-white pl-6 pr-11 text-[14px] text-neutral-900 ring-1 ring-neutral-200/80 placeholder:text-neutral-500 focus:ring-1 focus:ring-brand-600 focus:outline-none transition-wardrobe"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-brand-600 p-2 text-white transition-wardrobe hover:bg-brand-700 active:scale-95">
              <Send size={14} />
            </button>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {quickScenarios.map((s) => (
            <button
              key={s.label}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] text-neutral-600 ring-1 ring-neutral-200/60 transition-wardrobe hover:ring-brand-600 hover:text-brand-700 active:scale-[0.97]"
            >
              <span className="text-[11px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Today's outfit - main visual */}
      <section className="px-4 py-1">
        <div className="outfit-stage relative overflow-hidden rounded-xl p-5">
          {/* Outfit items layout */}
          <div className="flex items-end justify-center gap-2.5 py-3 stagger-children">
            {currentOutfit.items.map((item, idx) => {
              const isLocked = lockedItems.has(item.id);
              const isCenter = idx === 0;
              return (
                <div key={item.id} className="group relative">
                  <button
                    onClick={() => toggleLock(item.id)}
                    className={cn(
                      'relative overflow-hidden rounded-lg transition-wardrobe',
                      isLocked
                        ? 'animate-ring-appear ring-2 ring-brand-600'
                        : 'ring-1 ring-neutral-200/40 hover:ring-brand-600/50'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={cn(
                        'object-contain bg-neutral-50 p-1.5 transition-wardrobe',
                        isCenter ? 'h-28 w-24' : 'h-24 w-20'
                      )}
                    />
                    {isLocked && (
                      <div className="absolute right-1 top-1 rounded-full bg-brand-600 p-0.5 shadow-sm">
                        <Lock size={9} className="text-white" />
                      </div>
                    )}
                  </button>
                  <p className="mt-1.5 max-w-[5.5rem] truncate text-center text-[11px] text-neutral-600">
                    {item.name}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Outfit info */}
          <div className="mt-3 text-center">
            <h3 className="text-[15px] font-semibold text-neutral-900">
              {currentOutfit.name}
            </h3>
            <p className="mx-auto mt-1.5 max-w-[280px] text-[12px] leading-relaxed text-neutral-600">
              {currentOutfit.explanation}
            </p>
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] text-ai-600 transition-wardrobe hover:bg-white/90"
            >
              <Sparkles size={10} />
              为什么这样搭
              <ChevronDown size={10} className={cn('transition-wardrobe', showWhy && 'rotate-180')} />
            </button>
          </div>

          {/* Why explanation */}
          {showWhy && (
            <div className="mt-3 rounded-lg bg-white/70 p-3 animate-fade-in-up">
              <ul className="space-y-1.5">
                {currentOutfit.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[12px] text-neutral-600">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ai-400" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {alternativeOutfits.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentOutfitIndex(idx)}
                className={cn(
                  'rounded-full transition-wardrobe',
                  idx === currentOutfitIndex
                    ? 'h-1.5 w-5 bg-brand-600'
                    : 'h-1.5 w-1.5 bg-neutral-300 hover:bg-neutral-400'
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
            disabled={worn}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-medium transition-wardrobe active:scale-[0.98]',
              worn
                ? 'bg-success-bg text-success-fg'
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20'
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
            className="flex h-12 items-center gap-1.5 rounded-lg bg-white px-5 text-[14px] font-medium text-neutral-900 ring-1 ring-neutral-200 transition-wardrobe hover:bg-neutral-50 active:scale-[0.98]"
          >
            <RefreshCw size={15} />
            换一套
          </button>
        </div>
      </section>

      {/* Secondary entries */}
      <section className="px-4 py-1">
        <div className="flex items-center gap-3">
          <button className="flex flex-1 items-center gap-3 rounded-lg bg-white p-3.5 ring-1 ring-neutral-200/60 transition-wardrobe hover:ring-neutral-300 active:scale-[0.98]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <Shirt size={18} className="text-brand-600" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium text-neutral-900">添加衣物</p>
              <p className="text-[11px] text-neutral-500">拍照或从相册导入</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-neutral-300" />
          </button>
          <button className="flex flex-1 items-center gap-3 rounded-lg bg-white p-3.5 ring-1 ring-neutral-200/60 transition-wardrobe hover:ring-neutral-300 active:scale-[0.98]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ai-50">
              <ImageIcon size={18} className="text-ai-600" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium text-neutral-900">参考图搭配</p>
              <p className="text-[11px] text-neutral-500">用你的衣物复刻</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-neutral-300" />
          </button>
        </div>
      </section>

      {/* Feedback dialog */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center backdrop-fade" onClick={() => setShowFeedback(false)}>
          <div
            className="w-full max-w-lg animate-slide-up rounded-t-xl bg-white p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-neutral-900">整体感觉如何？</h3>
              <button onClick={() => setShowFeedback(false)} className="rounded-full p-1 hover:bg-neutral-100">
                <X size={18} className="text-neutral-500" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '刚好', icon: ThumbsUp, color: 'brand' },
                { label: '太热', icon: Thermometer, color: 'warning' },
                { label: '太冷', icon: Thermometer, color: 'info' },
              ].map((fb) => (
                <button
                  key={fb.label}
                  onClick={() => setShowFeedback(false)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg py-3 transition-wardrobe active:scale-95',
                    fb.color === 'brand' ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  <fb.icon size={20} />
                  <span className="text-[12px] font-medium">{fb.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFeedback(false)}
              className="mt-3 w-full text-center text-[12px] text-neutral-500"
            >
              跳过
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
