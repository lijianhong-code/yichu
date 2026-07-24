'use client';

import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Camera,
  Image,
  Layers,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardrobeItems, categories, outfits } from '@/lib/mock-data';

type ViewMode = 'items' | 'outfits';

export default function WardrobePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFab, setShowFab] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filteredItems = wardrobeItems.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !searchQuery ||
      item.name.includes(searchQuery) ||
      item.primaryColor.includes(searchQuery) ||
      item.category.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-25">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-sm">
        <div className="px-4 pb-2 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-neutral-900">我的衣橱</h1>
              <p className="text-[12px] text-neutral-500">{wardrobeItems.length} 件单品</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5">
            <Search size={16} className="text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索衣物，如&quot;黑色通勤上衣&quot;"
              className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={14} className="text-neutral-500" />
              </button>
            )}
            <button className="ml-1 rounded-md p-1 transition-wardrobe hover:bg-neutral-100">
              <SlidersHorizontal size={16} className="text-neutral-600" />
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-0 border-b border-neutral-200 px-4">
          <button
            onClick={() => setViewMode('items')}
            className={cn(
              'relative px-4 py-2.5 text-[14px] font-medium transition-wardrobe',
              viewMode === 'items'
                ? 'text-brand-700'
                : 'text-neutral-500'
            )}
          >
            单品
            {viewMode === 'items' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
          <button
            onClick={() => setViewMode('outfits')}
            className={cn(
              'relative px-4 py-2.5 text-[14px] font-medium transition-wardrobe',
              viewMode === 'outfits'
                ? 'text-brand-700'
                : 'text-neutral-500'
            )}
          >
            穿搭
            {viewMode === 'outfits' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        </div>

        {/* Category chips */}
        {viewMode === 'items' && (
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-wardrobe',
                  activeCategory === cat.value
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-brand-600'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-4 py-3">
        {viewMode === 'items' ? (
          /* Items grid */
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                className={cn(
                  'group overflow-hidden rounded-lg border bg-white transition-wardrobe',
                  selectedItem === item.id
                    ? 'border-brand-600 ring-1 ring-brand-600'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                {/* Image area - 4:5 ratio */}
                <div className="relative aspect-[4/5] bg-neutral-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                  {item.status === 'pending_review' && (
                    <span className="absolute right-2 top-2 rounded bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning-fg">
                      待确认
                    </span>
                  )}
                </div>
                {/* Name */}
                <div className="px-2.5 py-2">
                  <p className="truncate text-[13px] font-medium text-neutral-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {item.category} · {item.colors[0]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Outfits grid */
          <div className="grid grid-cols-2 gap-3">
            {outfits.map((outfit) => (
              <button
                key={outfit.id}
                className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition-wardrobe hover:border-neutral-300"
              >
                {/* Outfit thumbnail - 3:4 ratio */}
                <div className="relative aspect-[3/4] bg-neutral-50 p-2">
                  <div className="flex h-full flex-wrap items-center justify-center gap-1">
                    {outfit.items.slice(0, 4).map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-10 rounded object-contain bg-white p-0.5"
                      />
                    ))}
                  </div>
                  {outfit.source === 'ai_text' && (
                    <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-ai-50 px-1.5 py-0.5 text-[10px] text-ai-600">
                      AI
                    </span>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-[13px] font-medium text-neutral-900">
                    {outfit.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {outfit.occasion}
                    {outfit.lastWorn && ` · 最近 ${outfit.lastWorn.slice(5)}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-40">
        {showFab ? (
          <div className="mb-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50">
              <Camera size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">拍摄单件</span>
            </button>
            <div className="mx-3 border-t border-neutral-100" />
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50">
              <Image size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">相册批量导入</span>
            </button>
            <div className="mx-3 border-t border-neutral-100" />
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50">
              <Layers size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">添加整套穿搭</span>
            </button>
          </div>
        ) : null}
        <button
          onClick={() => setShowFab(!showFab)}
          className={cn(
            'flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-wardrobe',
            showFab
              ? 'bg-neutral-900 rotate-45'
              : 'bg-brand-600 hover:bg-brand-700'
          )}
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>

      {/* Item detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
          <div className="w-full max-w-lg animate-in slide-in-from-bottom rounded-t-xl bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-semibold text-neutral-900">单品详情</h3>
              <button onClick={() => setSelectedItem(null)} className="rounded-full p-1 hover:bg-neutral-100">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            {(() => {
              const item = wardrobeItems.find(i => i.id === selectedItem);
              if (!item) return null;
              return (
                <div>
                  <div className="mx-auto aspect-square w-40 rounded-lg bg-neutral-50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                  </div>
                  <h4 className="mt-4 text-center text-[15px] font-semibold text-neutral-900">{item.name}</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                    <div className="rounded-lg bg-neutral-50 p-2.5">
                      <span className="text-neutral-500">品类</span>
                      <p className="mt-0.5 font-medium text-neutral-900">{item.category} / {item.subCategory}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-2.5">
                      <span className="text-neutral-500">颜色</span>
                      <p className="mt-0.5 font-medium text-neutral-900">{item.colors.join(', ')}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-2.5">
                      <span className="text-neutral-500">季节</span>
                      <p className="mt-0.5 font-medium text-neutral-900">{item.season.join(', ')}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-2.5">
                      <span className="text-neutral-500">穿着次数</span>
                      <p className="mt-0.5 font-medium text-neutral-900">{item.wearCount} 次</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 rounded-lg bg-brand-600 py-2.5 text-[14px] font-medium text-white transition-wardrobe hover:bg-brand-700">
                      用它搭配
                    </button>
                    <button className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-[14px] font-medium text-neutral-900 transition-wardrobe hover:bg-neutral-50">
                      编辑
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
