'use client';

import { useState } from 'react';
import {
  Send,
  CloudSun,
  ChevronLeft,
  Clock,
  Lock,
  RefreshCw,
  Check,
  ArrowUpDown,
  Sparkles,
  X,
  Shirt,
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

  const handleGenerate = () => {
    setPageState('loading');
    setTimeout(() => {
      setPageState('result');
    }, 2500);
  };

  const handleWorn = () => {
    setWorn(true);
    setTimeout(() => setWorn(false), 2000);
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

  const candidates = selectedItemId ? candidateReplacements[selectedItemId] || [] : [];

  return (
    <div className="min-h-screen bg-neutral-25">
      {pageState === 'input' && (
        <>
          {/* Context bar */}
          <header className="px-4 pb-2 pt-4">
            <h1 className="text-[20px] font-semibold text-neutral-900">AI 搭配</h1>
            <button className="mt-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] text-neutral-600 shadow-sm">
              <CloudSun size={14} className="text-ai-400" />
              <span>上海 · 24°C · 多云</span>
              <span className="mx-1 text-neutral-300">|</span>
              <span>7月24日</span>
            </button>
          </header>

          {/* Input area */}
          <section className="px-4 py-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-ai-400" />
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气，要走很多路"
                  className="min-h-[88px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600">
                    <Shirt size={12} />
                    必穿单品
                  </button>
                  <button className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600">
                    <Sparkles size={12} className="text-ai-400" />
                    参考图
                  </button>
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-medium text-white transition-wardrobe hover:bg-brand-700"
                >
                  <Send size={14} />
                  开始搭配
                </button>
              </div>
            </div>
          </section>

          {/* Quick scenarios */}
          <section className="px-4">
            <p className="mb-2 text-[12px] text-neutral-500">高频场景</p>
            <div className="grid grid-cols-2 gap-2">
              {quickScenarios.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setInputValue(s.label === '通勤上班' ? '今天上班穿，需要正式但不刻板' : s.label === '约会聚餐' ? '晚上约会，希望看起来有气质' : s.label === '周末出游' ? '周末出去逛街，舒适休闲为主' : '下午有商务会议，需要正式一些');
                  }}
                  className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-3 transition-wardrobe hover:border-brand-600 hover:bg-brand-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                    <Sparkles size={14} className="text-brand-600" />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-900">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* History */}
          <section className="px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-neutral-500">历史方案</p>
              <button className="text-[12px] text-brand-600">查看全部</button>
            </div>
            <div className="mt-2 space-y-2">
              {['商务休闲通勤 · 7/22', '周末休闲出行 · 7/20', '优雅约会装扮 · 7/18'].map((text) => (
                <button
                  key={text}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5 transition-wardrobe hover:bg-neutral-50"
                >
                  <span className="text-[13px] text-neutral-900">{text}</span>
                  <ChevronLeft size={14} className="rotate-180 text-neutral-300" />
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {pageState === 'loading' && (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
          <div className="ai-loading h-16 w-16 rounded-full" />
          <div className="mt-6 space-y-2 text-center">
            <p className="text-[15px] font-medium text-neutral-900">正在为你搭配</p>
            <p className="text-[12px] text-neutral-500" id="loading-stage">正在理解场合需求...</p>
          </div>
          <style jsx>{`
            @keyframes stageChange {
              0%, 30% { opacity: 1; }
              33%, 63% { opacity: 0; }
              66%, 100% { opacity: 0; }
            }
          `}</style>
          <LoadingStages />
        </div>
      )}

      {pageState === 'result' && (
        <>
          {/* Result header */}
          <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/98 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPageState('input')}
                className="rounded-full p-1 transition-wardrobe hover:bg-neutral-100"
              >
                <ChevronLeft size={20} className="text-neutral-900" />
              </button>
              <div className="text-center">
                <p className="text-[14px] font-medium text-neutral-900">{generatedOutfit.name}</p>
                <p className="text-[11px] text-neutral-500">
                  上海 · {generatedOutfit.weather} · {generatedOutfit.occasion}
                </p>
              </div>
              <button className="rounded-full p-1 transition-wardrobe hover:bg-neutral-100">
                <Clock size={18} className="text-neutral-600" />
              </button>
            </div>
          </header>

          {/* Outfit result area */}
          <section className="px-4 py-4">
            <div className="outfit-stage rounded-xl p-4">
              <div className="flex items-center justify-center gap-3 py-4">
                {generatedOutfit.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                    className="group relative"
                  >
                    <div
                      className={cn(
                        'relative overflow-hidden rounded-lg transition-wardrobe',
                        selectedItemId === item.id
                          ? 'ring-2 ring-brand-600'
                          : lockedItems.has(item.id)
                          ? 'ring-2 ring-brand-600/50'
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
                      {selectedItemId === item.id && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] text-white">
                          替换
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-[5rem] truncate text-center text-[11px] text-neutral-600">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              <div className="mt-2 text-center">
                <p className="text-[13px] text-neutral-600">{generatedOutfit.explanation}</p>
                <button
                  onClick={() => setShowWhy(!showWhy)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-ai-600"
                >
                  <Sparkles size={11} />
                  为什么这样搭
                </button>
              </div>
            </div>
          </section>

          {/* Why explanation */}
          {showWhy && (
            <section className="px-4 pb-2">
              <div className="rounded-lg bg-ai-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-ai-600">搭配理由</span>
                  <button onClick={() => setShowWhy(false)}>
                    <X size={14} className="text-ai-600" />
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {generatedOutfit.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] text-neutral-600">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ai-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Replacement candidates */}
          {selectedItemId && candidates.length > 0 && (
            <section className="px-4 pb-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-neutral-900">替换候选</span>
                  <button onClick={() => setSelectedItemId(null)}>
                    <X size={14} className="text-neutral-500" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      className="flex flex-col items-center rounded-lg border border-neutral-200 p-2 transition-wardrobe hover:border-brand-600"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt={c.name} className="h-14 w-12 object-contain" />
                      <span className="mt-1 max-w-[4rem] truncate text-[10px] text-neutral-600">{c.name}</span>
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
                  'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-medium transition-wardrobe',
                  worn
                    ? 'bg-success-bg text-success-fg'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                )}
              >
                {worn ? <><Check size={18} /> 已记录</> : <><Check size={18} /> 今天穿</>}
              </button>
              <button
                onClick={() => { setPageState('loading'); setTimeout(() => setPageState('result'), 2000); }}
                className="flex h-12 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 text-[13px] font-medium text-neutral-900 transition-wardrobe hover:bg-neutral-50"
              >
                <RefreshCw size={14} />
                再生成
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <button
                onClick={() => selectedItemId && toggleLock(selectedItemId)}
                className="flex items-center gap-1 text-[12px] text-neutral-600 transition-wardrobe hover:text-brand-600"
              >
                <Lock size={13} />
                {selectedItemId ? (lockedItems.has(selectedItemId) ? '已锁定' : '锁定单品') : '点击单品后锁定'}
              </button>
              <button className="flex items-center gap-1 text-[12px] text-neutral-600 transition-wardrobe hover:text-brand-600">
                <ArrowUpDown size={13} />
                保存穿搭
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LoadingStages() {
  const [stage, setStage] = useState(0);
  const stages = [
    '正在理解场合需求...',
    '正在从 86 件衣物中筛选...',
    '正在检查天气适配度...',
    '正在生成搭配方案...',
  ];

  useState(() => {
    const timer = setInterval(() => {
      setStage((prev) => {
        if (prev >= stages.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  });

  return (
    <p className="mt-2 text-[12px] text-neutral-500">{stages[stage]}</p>
  );
}
