'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  CloudSun,
  ChevronLeft,
  Clock,
  Lock,
  RefreshCw,
  Check,
  Sparkles,
  X,
  Shirt,
  MoreHorizontal,
  Save,
  Share2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardrobeItems, quickScenarios } from '@/lib/mock-data';

type PageState = 'input' | 'loading' | 'result';

const generatedOutfit = {
  items: [wardrobeItems[2], wardrobeItems[0], wardrobeItems[1], wardrobeItems[5], wardrobeItems[11]],
  name: '商务休闲通勤',
  explanation: '黑色西装搭配白T和牛仔裤，正式但不刻板，适合今日天气和通勤场合',
  weather: '18-24°C 多云',
  occasion: '商务休闲',
  reasons: [
    '黑色西装提升正式度，适合客户会面',
    '白T+牛仔裤平衡休闲感，不会过于严肃',
    '温度18-24°C，西装厚度适中',
  ],
};

const candidateReplacements: Record<string, typeof wardrobeItems> = {
  'item-001': [wardrobeItems[3], wardrobeItems[7]],
  'item-002': [wardrobeItems[4]],
  'item-003': [wardrobeItems[10]],
  'item-005': [wardrobeItems[6], wardrobeItems[11]],
  'item-011': [wardrobeItems[6]],
};

export default function AIStylingPage() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [inputValue, setInputValue] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [worn, setWorn] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);

  const handleGenerate = () => {
    setPageState('loading');
    setTimeout(() => {
      setPageState('result');
    }, 3000);
  };

  const handleWorn = () => {
    setWorn(true);
    setTimeout(() => setWorn(false), 2000);
  };

  const toggleLock = (itemId: string) => {
    setLockedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleReplace = useCallback((itemId: string) => {
    setUndoVisible(true);
    setTimeout(() => setUndoVisible(false), 4000);
  }, []);

  const candidates = selectedItemId ? candidateReplacements[selectedItemId] || [] : [];

  return (
    <div className="min-h-screen bg-neutral-25">
      {pageState === 'input' && (
        <>
          {/* Context bar */}
          <header className="px-4 pb-2 pt-5">
            <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">AI 搭配</h1>
            <button className="mt-2.5 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] text-neutral-600 ring-1 ring-neutral-200/60 transition-wardrobe hover:ring-neutral-300">
              <CloudSun size={14} className="text-ai-400" />
              <span>上海 · 24°C · 多云</span>
              <span className="mx-1 text-neutral-200">|</span>
              <span>7月24日</span>
            </button>
          </header>

          {/* Input area */}
          <section className="px-4 py-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200/60">
              <div className="flex items-start gap-2.5">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ai-400" />
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气，要走很多路"
                  className="min-h-[88px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600 transition-wardrobe hover:bg-neutral-100">
                    <Shirt size={12} />
                    必穿单品
                  </button>
                  <button className="flex items-center gap-1 rounded-md bg-ai-50 px-2 py-1 text-[11px] text-ai-600 transition-wardrobe hover:bg-ai-100/30">
                    <Sparkles size={12} />
                    参考图
                  </button>
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-medium text-white transition-wardrobe hover:bg-brand-700 active:scale-[0.97] shadow-sm shadow-brand-600/15"
                >
                  <Send size={14} />
                  开始搭配
                </button>
              </div>
            </div>
          </section>

          {/* Quick scenarios */}
          <section className="px-4 py-2">
            <p className="mb-2.5 text-[12px] font-medium text-neutral-500">高频场景</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickScenarios.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    const prompts: Record<string, string> = {
                      '通勤上班': '今天上班穿，需要正式但不刻板',
                      '约会聚餐': '晚上约会，希望看起来有气质',
                      '周末出游': '周末出去逛街，舒适休闲为主',
                      '商务会议': '下午有商务会议，需要正式一些',
                    };
                    setInputValue(prompts[s.label] || s.label);
                  }}
                  className="flex items-center gap-2.5 rounded-lg bg-white p-3.5 ring-1 ring-neutral-200/60 transition-wardrobe hover:ring-brand-600/40 hover:bg-brand-50/30 active:scale-[0.98]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                    <span className="text-[14px]">{s.icon}</span>
                  </div>
                  <span className="text-[13px] font-medium text-neutral-900">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* History */}
          <section className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium text-neutral-500">历史方案</p>
              <button className="text-[12px] text-brand-600 transition-wardrobe hover:text-brand-700">查看全部</button>
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                { title: '商务休闲通勤', date: '7/22' },
                { title: '周末休闲出行', date: '7/20' },
                { title: '优雅约会装扮', date: '7/18' },
              ].map((h) => (
                <button
                  key={h.title}
                  className="flex w-full items-center justify-between rounded-lg bg-white px-3.5 py-3 ring-1 ring-neutral-200/50 transition-wardrobe hover:ring-neutral-300 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-50">
                      <Sparkles size={12} className="text-neutral-400" />
                    </div>
                    <div className="text-left">
                      <span className="text-[13px] text-neutral-900">{h.title}</span>
                      <p className="text-[11px] text-neutral-500">{h.date}</p>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="rotate-180 text-neutral-300" />
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {pageState === 'loading' && (
        <LoadingState />
      )}

      {pageState === 'result' && (
        <>
          {/* Result header */}
          <header className="sticky top-0 z-40 bg-white/98 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPageState('input')}
                className="rounded-full p-1.5 transition-wardrobe hover:bg-neutral-100"
              >
                <ChevronLeft size={20} className="text-neutral-900" />
              </button>
              <div className="text-center">
                <p className="text-[14px] font-medium text-neutral-900">{generatedOutfit.name}</p>
                <p className="text-[11px] text-neutral-500">
                  上海 · {generatedOutfit.weather} · {generatedOutfit.occasion}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="rounded-full p-1.5 transition-wardrobe hover:bg-neutral-100"
                >
                  <MoreHorizontal size={18} className="text-neutral-600" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-10 w-36 overflow-hidden rounded-lg bg-white shadow-[0_8px_24px_rgba(24,28,26,0.12)] animate-scale-in z-50">
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-neutral-900 hover:bg-neutral-50 transition-wardrobe">
                      <Save size={14} className="text-neutral-500" /> 保存穿搭
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-neutral-900 hover:bg-neutral-50 transition-wardrobe">
                      <Copy size={14} className="text-neutral-500" /> 复制方案
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-neutral-900 hover:bg-neutral-50 transition-wardrobe">
                      <Share2 size={14} className="text-neutral-500" /> 分享图片
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Outfit result area */}
          <section className="px-4 py-4">
            <div className="outfit-stage rounded-xl p-5">
              <div className="flex items-end justify-center gap-2.5 py-3 stagger-children">
                {generatedOutfit.items.map((item, idx) => {
                  const isSelected = selectedItemId === item.id;
                  const isLocked = lockedItems.has(item.id);
                  const isCenter = idx === 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItemId(isSelected ? null : item.id);
                        if (!isSelected && candidates.length > 0) handleReplace(item.id);
                      }}
                      className="group relative"
                    >
                      <div
                        className={cn(
                          'relative overflow-hidden rounded-lg transition-wardrobe',
                          isSelected
                            ? 'animate-ring-appear ring-2 ring-brand-600'
                            : isLocked
                            ? 'ring-2 ring-brand-600/40'
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
                        {isSelected && (
                          <div className="absolute inset-x-0 bottom-0 bg-brand-600/90 py-0.5 text-center">
                            <span className="text-[9px] font-medium text-white">点击替换</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 max-w-[5.5rem] truncate text-center text-[11px] text-neutral-600">
                        {item.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="mt-3 text-center">
                <p className="text-[13px] text-neutral-600">{generatedOutfit.explanation}</p>
                <button
                  onClick={() => setShowWhy(!showWhy)}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] text-ai-600 transition-wardrobe hover:bg-white/90"
                >
                  <Sparkles size={10} />
                  为什么这样搭
                </button>
              </div>
            </div>
          </section>

          {/* Why explanation */}
          {showWhy && (
            <section className="px-4 pb-2 animate-fade-in-up">
              <div className="rounded-lg bg-ai-50 p-3.5 ring-1 ring-ai-100/50">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-ai-600">
                    <Sparkles size={11} />
                    搭配理由
                  </span>
                  <button onClick={() => setShowWhy(false)} className="rounded-full p-0.5 hover:bg-ai-100/50 transition-wardrobe">
                    <X size={14} className="text-ai-600" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {generatedOutfit.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] leading-relaxed text-neutral-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ai-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Undo toast */}
          {undoVisible && (
            <div className="px-4 pb-2 animate-fade-in-up">
              <div className="flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-2.5">
                <span className="text-[12px] text-white">已替换单品</span>
                <button
                  onClick={() => setUndoVisible(false)}
                  className="text-[12px] font-medium text-brand-500 transition-wardrobe hover:text-brand-100"
                >
                  撤销
                </button>
              </div>
            </div>
          )}

          {/* Replacement candidates drawer */}
          {selectedItemId && candidates.length > 0 && (
            <section className="px-4 pb-2 animate-fade-in-up">
              <div className="rounded-xl bg-white p-3.5 ring-1 ring-neutral-200/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-neutral-900">替换候选</span>
                  <button onClick={() => setSelectedItemId(null)} className="rounded-full p-0.5 hover:bg-neutral-100 transition-wardrobe">
                    <X size={14} className="text-neutral-500" />
                  </button>
                </div>
                {/* Quick directions */}
                <div className="mb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {['更舒适', '更正式', '换个颜色', '更保暖'].map((dir) => (
                    <button
                      key={dir}
                      className="shrink-0 rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-600 transition-wardrobe hover:bg-neutral-100 active:scale-[0.96]"
                    >
                      {dir}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2.5">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      className="flex flex-col items-center rounded-lg bg-neutral-50 p-2.5 ring-1 ring-neutral-200/50 transition-wardrobe hover:ring-brand-600/50 active:scale-[0.96]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt={c.name} className="h-14 w-12 object-contain" />
                      <span className="mt-1.5 max-w-[4.5rem] truncate text-[10px] text-neutral-600">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Action buttons */}
          <section className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleWorn}
                className={cn(
                  'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-medium transition-wardrobe active:scale-[0.98]',
                  worn
                    ? 'bg-success-bg text-success-fg'
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20'
                )}
              >
                {worn ? <><Check size={18} /> 已记录</> : <><Check size={18} /> 今天穿</>}
              </button>
              <button
                onClick={() => { setPageState('loading'); setTimeout(() => setPageState('result'), 2500); }}
                className="flex h-12 items-center gap-1.5 rounded-lg bg-white px-4 text-[13px] font-medium text-neutral-900 ring-1 ring-neutral-200 transition-wardrobe hover:bg-neutral-50 active:scale-[0.98]"
              >
                <RefreshCw size={14} />
                再生成
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-5">
              <button
                onClick={() => selectedItemId && toggleLock(selectedItemId)}
                className={cn(
                  'flex items-center gap-1 text-[12px] transition-wardrobe',
                  selectedItemId && lockedItems.has(selectedItemId)
                    ? 'text-brand-600 font-medium'
                    : 'text-neutral-500 hover:text-brand-600'
                )}
              >
                <Lock size={13} />
                {selectedItemId ? (lockedItems.has(selectedItemId) ? '已锁定' : '锁定单品') : '点击单品后锁定'}
              </button>
              <button className="flex items-center gap-1 text-[12px] text-neutral-500 transition-wardrobe hover:text-brand-600">
                <Save size={13} />
                保存穿搭
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    '正在理解场合需求...',
    '正在从 86 件衣物中筛选...',
    '正在检查天气适配度...',
    '正在生成搭配方案...',
  ];

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStage((prev) => {
        if (prev >= stages.length - 1) {
          clearInterval(stageTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 750);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-8">
      {/* Animated indicator */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-ai-50 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-ai-100/60 flex items-center justify-center animate-dot-pulse">
            <Sparkles size={20} className="text-ai-600" />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[16px] font-semibold text-neutral-900">正在为你搭配</p>
        <p className="mt-2 text-[13px] text-neutral-500 transition-all duration-300">{stages[stage]}</p>
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-48">
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage dots */}
      <div className="mt-6 flex items-center gap-3">
        {stages.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all duration-300',
              idx <= stage ? 'bg-brand-600 scale-100' : 'bg-neutral-200 scale-75'
            )}
          />
        ))}
      </div>
    </div>
  );
}
