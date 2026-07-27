'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Camera,
  Image as ImageIcon,
  Layers,
  X,
  Heart,
  MoreHorizontal,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredItems = wardrobeItems.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !searchQuery ||
      item.name.includes(searchQuery) ||
      item.primaryColor.includes(searchQuery) ||
      item.category.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const selectedItemData = selectedItem ? wardrobeItems.find(i => i.id === selectedItem) : null;

  return (
    <div className="min-h-screen bg-neutral-25 pb-4">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="px-4 pb-2 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">我的衣橱</h1>
              <p className="text-[12px] text-neutral-500 tabular-nums">{wardrobeItems.length} 件单品</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2.5">
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 ring-1 ring-transparent transition-wardrobe focus-within:ring-1 focus-within:ring-brand-600">
            <Search size={16} className="shrink-0 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索衣物，如&quot;黑色通勤上衣&quot;"
              className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="rounded-full p-0.5 hover:bg-neutral-200 transition-wardrobe">
                <X size={14} className="text-neutral-500" />
              </button>
            )}
            <button className="ml-0.5 rounded-md p-1.5 transition-wardrobe hover:bg-neutral-100">
              <SlidersHorizontal size={16} className="text-neutral-600" />
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center border-b border-neutral-100 px-4">
          <button
            onClick={() => setViewMode('items')}
            className={cn(
              'relative px-4 py-2.5 text-[14px] font-medium transition-wardrobe',
              viewMode === 'items'
                ? 'text-brand-700'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            单品
            {viewMode === 'items' && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-brand-600" />
            )}
          </button>
          <button
            onClick={() => setViewMode('outfits')}
            className={cn(
              'relative px-4 py-2.5 text-[14px] font-medium transition-wardrobe',
              viewMode === 'outfits'
                ? 'text-brand-700'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            穿搭
            {viewMode === 'outfits' && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-brand-600" />
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
                  'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-wardrobe active:scale-[0.96]',
                  activeCategory === cat.value
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-white text-neutral-600 ring-1 ring-neutral-200/70 hover:ring-brand-600/50'
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
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                className={cn(
                  'group overflow-hidden rounded-lg bg-white transition-wardrobe active:scale-[0.98]',
                  selectedItem === item.id
                    ? 'ring-2 ring-brand-600'
                    : 'ring-1 ring-neutral-200/50 hover:ring-neutral-300'
                )}
              >
                {/* Image area - 4:5 ratio */}
                <div className="relative aspect-[4/5] bg-neutral-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain transition-wardrobe group-hover:scale-[1.02]"
                  />
                  {item.status === 'pending_review' && (
                    <span className="absolute right-2 top-2 rounded bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning-fg">
                      待确认
                    </span>
                  )}
                  {item.status === 'washing' && (
                    <span className="absolute right-2 top-2 rounded bg-info-bg px-1.5 py-0.5 text-[10px] font-medium text-info-fg">
                      洗衣中
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
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {outfits.map((outfit) => (
              <button
                key={outfit.id}
                className="group overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200/50 transition-wardrobe hover:ring-neutral-300 active:scale-[0.98]"
              >
                {/* Outfit thumbnail - 3:4 ratio */}
                <div className="relative aspect-[3/4] bg-neutral-50 p-3">
                  <div className="flex h-full flex-wrap items-center justify-center gap-1.5">
                    {outfit.items.slice(0, 4).map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-14 w-11 rounded object-contain bg-white p-0.5 ring-1 ring-neutral-100"
                      />
                    ))}
                  </div>
                  {outfit.source === 'ai_text' && (
                    <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-ai-50 px-1.5 py-0.5 text-[10px] font-medium text-ai-600">
                      <Sparkles size={8} />
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

        {filteredItems.length === 0 && viewMode === 'items' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <Search size={24} className="text-neutral-400" />
            </div>
            <p className="mt-4 text-[14px] text-neutral-600">没有找到匹配的衣物</p>
            <p className="mt-1 text-[12px] text-neutral-500">试试调整搜索词或筛选条件</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-40">
        {showFab && (
          <div className="mb-3 overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(24,28,26,0.12)] animate-scale-in">
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50 active:bg-neutral-100">
              <Camera size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">拍摄单件</span>
            </button>
            <div className="mx-3 border-t border-neutral-100" />
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50 active:bg-neutral-100">
              <ImageIcon size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">相册批量导入</span>
            </button>
            <div className="mx-3 border-t border-neutral-100" />
            <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50 active:bg-neutral-100">
              <Layers size={18} className="text-brand-600" />
              <span className="text-[13px] text-neutral-900">添加整套穿搭</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setShowFab(!showFab)}
          className={cn(
            'flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-[0_8px_24px_rgba(24,28,26,0.12)] transition-wardrobe',
            showFab
              ? 'bg-neutral-900 rotate-45'
              : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
          )}
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>

      {/* Item detail drawer */}
      {selectedItemData && (
        <div className="fixed inset-0 z-50 backdrop-fade" onClick={() => setSelectedItem(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-neutral-200" />
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] font-semibold text-neutral-900">单品详情</h3>
                <button onClick={() => setSelectedItem(null)} className="rounded-full p-1.5 hover:bg-neutral-100 transition-wardrobe">
                  <X size={18} className="text-neutral-500" />
                </button>
              </div>

              {/* Image */}
              <div className="mx-auto aspect-square w-44 rounded-lg bg-neutral-50 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedItemData.imageUrl} alt={selectedItemData.name} className="h-full w-full object-contain" />
              </div>

              <h4 className="mt-4 text-center text-[15px] font-semibold text-neutral-900">{selectedItemData.name}</h4>
              <p className="mt-1 text-center text-[12px] text-neutral-500">
                已穿 {selectedItemData.wearCount} 次
                {selectedItemData.lastWorn && ` · 最近 ${selectedItemData.lastWorn}`}
              </p>

              {/* Attributes grid */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: '品类', value: `${selectedItemData.category} / ${selectedItemData.subCategory}` },
                  { label: '颜色', value: selectedItemData.colors.join(', ') },
                  { label: '季节', value: selectedItemData.season.join(', ') },
                  { label: '场合', value: selectedItemData.occasions.join(', ') },
                  { label: '风格', value: selectedItemData.style.join(', ') },
                  { label: '材质', value: selectedItemData.material || '-' },
                ].map((attr) => (
                  <div key={attr.label} className="rounded-lg bg-neutral-50 p-2.5">
                    <span className="text-[11px] text-neutral-500">{attr.label}</span>
                    <p className="mt-0.5 text-[13px] font-medium text-neutral-900 truncate">{attr.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-lg bg-brand-600 py-2.5 text-[14px] font-medium text-white transition-wardrobe hover:bg-brand-700 active:scale-[0.98]">
                  用它搭配
                </button>
                <button className="flex-1 rounded-lg bg-white py-2.5 text-[14px] font-medium text-neutral-900 ring-1 ring-neutral-200 transition-wardrobe hover:bg-neutral-50 active:scale-[0.98]">
                  编辑
                </button>
                <button className="flex items-center justify-center rounded-lg bg-white px-3 py-2.5 ring-1 ring-neutral-200 transition-wardrobe hover:bg-neutral-50">
                  <MoreHorizontal size={18} className="text-neutral-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkles(props: { size?: number; className?: string }) {
  return (
    <svg
      width={props.size || 12}
      height={props.size || 12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}
