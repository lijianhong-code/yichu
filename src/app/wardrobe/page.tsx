'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  X,
  Shirt,
  Sparkles,
  Trash2,
  Camera,
  Image as ImageIcon,
  Heart,
  Hand,
  Clock,
  Check,
  AlertTriangle,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWardrobe } from '@/lib/store';
import { toast } from '@/lib/toast';
import { type ClothingItem, CATEGORIES, type Outfit } from '@/lib/mock-data';
import { OutfitCanvas } from '@/components/outfit-canvas';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Spinner } from '@/components/ui/spinner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: '可用', color: 'bg-muted text-muted-foreground', icon: Shirt },
  archived: { label: '归档', color: 'bg-muted/50 text-muted-foreground/50', icon: Archive },
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('无法读取图片'));
    reader.readAsDataURL(file);
  });
}

function normalizeDetectedCategory(category?: string): string {
  if (!category) return '上装';
  if (category.includes('连')) return '连体';
  if (category.includes('鞋')) return '鞋';
  if (category.includes('包')) return '包';
  if (category.includes('配饰') || category.includes('饰品')) return '配饰';
  if (category.includes('外套') || category.includes('夹克') || category.includes('大衣')) return '外套';
  if (category.includes('裤') || category.includes('裙') || category.includes('下装')) return '下装';
  return '上装';
}

export default function WardrobePage() {
  const router = useRouter();
  const { state, addItem, updateItem, deleteItem, getStats } = useWardrobe();
  const wardrobeItems = state.items;

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'items' | 'outfits'>('items');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ClothingItem | null>(null);
  const [uploadedItems, setUploadedItems] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fabOffset, setFabOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [inlineEditField, setInlineEditField] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');

  // Item counts per category
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wardrobeItems.length };
    wardrobeItems.forEach((item) => {
      const categoryKey = item.category === '连衣裙' ? '连体' : item.category;
      counts[categoryKey] = (counts[categoryKey] || 0) + 1;
    });
    return counts;
  }, [wardrobeItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = wardrobeItems;
    if (activeCategory !== 'all') {
      items = items.filter((item) => activeCategory === '连体'
        ? item.category === '连体' || item.category === '连衣裙'
        : item.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.primaryColor.toLowerCase().includes(q) ||
          item.category.includes(q)
      );
    }
    return items;
  }, [wardrobeItems, activeCategory, searchQuery]);

  // Outfits from store
  const storeOutfits = state.outfits;

  // Scroll handling for FAB
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setFabOffset(Math.min(scrollY * 0.3, 40));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Category scroll hint
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      setShowScrollHint(el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    const uploadId = Date.now();
    const results = await Promise.allSettled(files.map(async (file, index): Promise<ClothingItem> => {
      const imageUrl = await readFileAsDataUrl(file);
      let detected: {
        category?: string;
        sub_category?: string;
        colors?: string[];
        material_appearance?: string;
        pattern?: string;
      } | undefined;

      try {
        const response = await fetch('/api/ai/analyze-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });
        if (response.ok) {
          const payload = await response.json() as { analysis?: { garments?: typeof detected[] } };
          detected = payload.analysis?.garments?.[0];
        }
      } catch {
        // A local draft is still useful when AI is not configured or unavailable.
      }

      const category = normalizeDetectedCategory(detected?.category);
      const confidence = detected ? 0.72 : 0.25;
      return {
        id: `new-${uploadId}-${index}`,
        name: detected?.sub_category ? `${category} · ${detected.sub_category}` : `待确认衣物 ${wardrobeItems.length + index + 1}`,
        category,
        subCategory: detected?.sub_category || '待确认',
        primaryColor: '#A3ABA5',
        colors: detected?.colors?.length ? detected.colors : ['待确认'],
        season: ['全年'],
        occasions: ['日常'],
        style: ['简约'],
        material: detected?.material_appearance || '待确认',
        pattern: detected?.pattern || '未知',
        status: 'available' as ClothingItem['status'],
        imageUrl,
        description: detected
          ? `${detected.colors?.join('、') || '颜色待确认'} · ${detected.material_appearance || '材质待确认'}，保存前请确认识别结果`
          : '图片已导入，AI 未完成识别，请在保存前补充属性',
        wearCount: 0,
        confidence,
      } satisfies ClothingItem;
    }));

    const newItems = results
      .filter((result): result is PromiseFulfilledResult<ClothingItem> => result.status === 'fulfilled')
      .map(result => result.value);
    setUploadedItems(newItems);
    setIsAnalyzing(false);
    if (newItems.some(item => (item.confidence || 0) < 0.6)) {
      toast.warning('部分图片未能完成识别，请确认分类和属性');
    }
    e.target.value = '';
  };

  const handleConfirmUpload = () => {
    uploadedItems.forEach((item) => addItem(item));
    setUploadedItems([]);
    setIsUploadSheetOpen(false);
    toast.success(`已添加 ${uploadedItems.length} 件衣物`);
  };

  const handleDelete = () => {
    if (!deleteConfirmItem) return;
    deleteItem(deleteConfirmItem.id);
    setDeleteConfirmItem(null);
    setSelectedItem(null);
    toast.success('已删除衣物');
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="我的衣橱"
        description={`${wardrobeItems.length} 件单品 · ${storeOutfits.length} 套搭配`}
        leading={(
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            aria-label={showSearch ? '关闭搜索' : '打开搜索'}
            className={showSearch ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
        )}
        actions={(
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as 'items' | 'outfits')}
            variant="outline"
            size="sm"
            className="bg-muted/80 p-1"
          >
            <ToggleGroupItem value="items" className="gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
              <Shirt className="w-3.5 h-3.5" />
              单品
            </ToggleGroupItem>
            <ToggleGroupItem value="outfits" className="gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              搭配
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      >
        {/* Layer 2: Search (collapsible) + Category Filters */}
        <div className={`overflow-hidden transition-all duration-200 ${showSearch ? 'max-h-24 pb-3' : 'max-h-12 pb-3'}`}>
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索衣物名称、颜色..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted/50 border-none text-sm"
                  autoFocus
                />
              </div>
            )}
            {/* Category filters with scroll hint */}
            <div className="relative">
              <div
                ref={categoryScrollRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar"
              >
                <ToggleGroup
                  type="single"
                  value={activeCategory}
                  onValueChange={(value) => value && setActiveCategory(value)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                {CATEGORIES.map((cat) => (
                  <ToggleGroupItem
                    key={cat.key}
                    value={cat.key}
                    className="h-10 min-w-fit gap-1 rounded-full px-3 text-sm whitespace-nowrap"
                  >
                    {cat.label}
                    <span className="text-xs opacity-70">{itemCounts[cat.key] || 0}</span>
                  </ToggleGroupItem>
                ))}
                </ToggleGroup>
              </div>
              {/* Scroll hint gradient */}
              {showScrollHint && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              )}
            </div>
          </div>
      </PageHeader>

      {/* Content */}
      <div className="px-4 pt-5 pb-6">
        {viewMode === 'items' ? (
          /* Items Grid */
          filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-muted shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Status Badge */}
                  {item.status !== 'available' && (
                    <Badge className={`absolute top-2 left-2 text-[10px] ${STATUS_CONFIG[item.status]?.color || ''}`}>
                      {STATUS_CONFIG[item.status]?.label || item.status}
                    </Badge>
                  )}
                  {item.status === 'available' && item.confidence !== undefined && item.confidence < 0.6 && (
                    <Badge variant="outline" className="absolute top-2 left-2 border-warning/40 bg-warning-bg/90 text-[10px] text-warning-fg">
                      待确认
                    </Badge>
                  )}

                  {/* Color Indicator */}
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: item.primaryColor }} />

                  {/* Item Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-white/70 text-xs">{item.subCategory}</p>
                      {item.wearCount > 0 && (
                        <span className="text-white/50 text-[10px]">穿过{item.wearCount}次</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              imageSrc="/empty-wardrobe.jpeg"
              title={searchQuery ? '没有找到匹配的衣物' : '衣橱还是空的'}
              description={searchQuery ? '试试更换关键词或筛选条件' : '添加衣物后，AI 才能根据你的真实衣橱进行搭配'}
              action={!searchQuery ? (
                <Button onClick={() => setIsUploadSheetOpen(true)}>
                  <Plus className="w-4 h-4" />
                  添加第一件衣物
                </Button>
              ) : undefined}
            />
          )
        ) : (
          /* Outfits Grid */
          storeOutfits.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {storeOutfits.map((outfit) => (
                <button
                  key={outfit.id}
                  onClick={() => setSelectedOutfit(outfit)}
                  className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-muted shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 text-left"
                >
                  {/* Outfit Preview - Canvas Layout */}
                  <div className="w-full h-full p-2">
                    <OutfitCanvas
                      initialItems={outfit.items.map((item, index) => ({
                        id: `${outfit.id}-${item.id}-${index}`,
                        itemId: item.id,
                        item,
                        x: 20 + (index * 25),
                        y: 30 + (index * 15),
                        scale: 0.4,
                        locked: false,
                        zIndex: index,
                      }))}
                      editable={false}
                    />
                  </div>

                  {/* Item Count Badge */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center text-xs font-medium text-foreground shadow-sm">
                    {outfit.items.length}
                  </div>

                  {/* AI Badge */}
                  {outfit.source === 'ai_text' && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
                      AI
                    </Badge>
                  )}

                  {/* Outfit Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">{outfit.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/70 text-xs">{outfit.occasion}</span>
                      <span className="text-white/50 text-xs">·</span>
                      <span className="text-white/70 text-xs">{outfit.createdAt}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              imageSrc="/empty-styling.jpeg"
              title="还没有保存的搭配"
              description="先让 AI 根据场合和天气生成一套搭配"
              action={(
                <Button onClick={() => router.push('/ai-styling')}>
                  <Sparkles className="w-4 h-4" />
                  去创建搭配
                </Button>
              )}
            />
          )
        )}
      </div>

      {/* FAB - with scroll offset and view-mode awareness */}
      <Button
        onClick={() => viewMode === 'items' ? setIsUploadSheetOpen(true) : router.push('/ai-styling')}
        aria-label={viewMode === 'items' ? '添加衣物' : '创建搭配'}
        className="fixed z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-primary-hover"
        style={{
          bottom: `calc(4.5rem + env(safe-area-inset-bottom) + ${fabOffset}px)`,
          right: 'max(1rem, calc((100vw - 36rem) / 2 + 1rem))',
        }}
      >
        {viewMode === 'items' ? <Plus className="w-6 h-6" /> : <Sparkles className="w-5 h-5" />}
      </Button>

      {/* Item Detail Sheet - Bottom Sheet instead of Dialog */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>衣物详情</SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <div className="overflow-y-auto h-full pb-4">
              {/* Image - 16:9 ratio, smaller */}
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mx-4 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>

              {/* Info */}
              <div className="px-4 mt-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.subCategory}</p>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}

                {/* Attribute Tags - 两列网格布局，双击编辑 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 颜色 */}
                  {inlineEditField === 'color' ? (
                    <div className="col-span-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                      <span className="text-xs text-muted-foreground mb-1.5 block">选择颜色：</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['#FFFFFF', '#000000', '#808080', '#C0C0C0', '#8B4513', '#A0522D', '#D2691E', '#F5DEB3', '#FF0000', '#DC143C', '#FF6347', '#FFA07A', '#FF8C00', '#FFD700', '#FFFF00', '#F0E68C', '#32CD32', '#228B22', '#006400', '#98FB98', '#0000FF', '#4169E1', '#1E90FF', '#87CEEB', '#800080', '#9370DB', '#BA55D3', '#DDA0DD', '#FF69B4', '#FF1493', '#FFB6C1'].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              updateItem(selectedItem.id, { primaryColor: color });
                              setSelectedItem({ ...selectedItem, primaryColor: color });
                              setInlineEditField(null);
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                              selectedItem.primaryColor === color ? 'border-primary scale-110' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInlineEditField(null)}
                        className="mt-2 text-xs h-6"
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                      onDoubleClick={() => {
                        setInlineEditField('color');
                      }}
                      title="双击编辑颜色"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedItem.primaryColor }} />
                      <span className="text-muted-foreground">颜色：</span>
                      {selectedItem.primaryColor}
                    </span>
                  )}

                  {/* 分类 */}
                  {inlineEditField === 'category' ? (
                    <div className="col-span-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                      <span className="text-xs text-muted-foreground mb-1.5 block">选择分类：</span>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                          <button
                            key={c.key}
                            onClick={() => {
                              updateItem(selectedItem.id, { category: c.key });
                              setSelectedItem({ ...selectedItem, category: c.key });
                              setInlineEditField(null);
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              selectedItem.category === c.key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-foreground hover:bg-muted'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInlineEditField(null)}
                        className="mt-2 text-xs h-6"
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                      onDoubleClick={() => {
                        setInlineEditField('category');
                      }}
                      title="双击编辑分类"
                    >
                      <Shirt className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">分类：</span>
                      {selectedItem.category}
                    </span>
                  )}

                  {/* 季节 */}
                  {inlineEditField === 'season' ? (
                    <div className="col-span-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                      <span className="text-xs text-muted-foreground mb-1.5 block">选择季节：</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['春', '夏', '秋', '冬'].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              const newSeasons = selectedItem.season.includes(s)
                                ? selectedItem.season.filter(x => x !== s)
                                : [...selectedItem.season, s];
                              updateItem(selectedItem.id, { season: newSeasons });
                              setSelectedItem({ ...selectedItem, season: newSeasons });
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              selectedItem.season.includes(s)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-foreground hover:bg-muted'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInlineEditField(null)}
                        className="mt-2 text-xs h-6"
                      >
                        完成
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                      onDoubleClick={() => {
                        setInlineEditField('season');
                      }}
                      title="双击编辑季节"
                    >
                      <Heart className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">季节：</span>
                      {selectedItem.season.join('/')}
                    </span>
                  )}

                  {/* 材质 */}
                  {inlineEditField === 'material' ? (
                    <div className="col-span-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                      <span className="text-xs text-muted-foreground mb-1.5 block">输入材质：</span>
                      <Input
                        type="text"
                        value={inlineEditValue}
                        onChange={(e) => setInlineEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateItem(selectedItem.id, { material: inlineEditValue });
                            setSelectedItem({ ...selectedItem, material: inlineEditValue });
                            setInlineEditField(null);
                          } else if (e.key === 'Escape') {
                            setInlineEditField(null);
                          }
                        }}
                        className="h-7 text-xs bg-background"
                        placeholder="如：棉、羊毛、丝绸..."
                        autoFocus
                      />
                      <div className="flex justify-between mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInlineEditField(null)}
                          className="text-xs h-6"
                        >
                          取消
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateItem(selectedItem.id, { material: inlineEditValue });
                            setSelectedItem({ ...selectedItem, material: inlineEditValue });
                            setInlineEditField(null);
                          }}
                          className="text-xs h-6 text-primary"
                        >
                          确定
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                      onDoubleClick={() => {
                        setInlineEditField('material');
                        setInlineEditValue(selectedItem.material || '');
                      }}
                      title="双击编辑材质"
                    >
                      <Hand className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">材质：</span>
                      {selectedItem.material || '未设置'}
                    </span>
                  )}
                </div>

                {/* 提示 */}
                <p className="text-[11px] text-muted-foreground/60 mt-2">双击标签可快速编辑属性</p>
              </div>

              {/* Actions - 底部两按钮 */}
              <div className="px-4 mt-4 pb-6 flex items-center gap-3">
                <Button
                  onClick={() => {
                    setSelectedItem(null);
                    router.push(`/ai-styling?item=${selectedItem.id}`);
                  }}
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  用它穿搭
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-11 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirmItem(selectedItem)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteConfirmItem?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Sheet */}
      <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-lg">
          <SheetHeader>
            <SheetTitle>添加衣物</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {uploadedItems.length === 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => {
                    setUploadMode('single');
                    fileInputRef.current?.click();
                  }}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm">拍摄单件</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => {
                    setUploadMode('batch');
                    fileInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm">相册批量导入</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center py-8">
                    <Spinner className="size-8 text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">AI 正在识别衣物...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedItems.map((item) => (
                        <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleConfirmUpload} className="flex-1 bg-primary hover:bg-primary-hover">
                        确认添加 ({uploadedItems.length})
                      </Button>
                      <Button variant="outline" onClick={() => setUploadedItems([])}>
                        重新选择
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={uploadMode === 'batch'}
            className="hidden"
            onChange={handleFileUpload}
          />
        </SheetContent>
      </Sheet>

      {/* Outfit Detail Sheet */}
      <Sheet open={!!selectedOutfit} onOpenChange={() => setSelectedOutfit(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-lg">
          <SheetHeader>
            <SheetTitle>{selectedOutfit?.name || '搭配详情'}</SheetTitle>
          </SheetHeader>
          {selectedOutfit && (
            <div className="overflow-y-auto h-full pb-4">
              {/* Canvas Preview */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mx-4 mb-4">
                <OutfitCanvas
                  initialItems={selectedOutfit.items.map((item, index) => {
                    const totalItems = selectedOutfit.items.length;
                    const cols = Math.min(3, totalItems);
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    return {
                      id: `detail-${item.id}-${index}`,
                      itemId: item.id,
                      item,
                      x: 15 + col * 28,
                      y: 10 + row * 35,
                      scale: 0.8,
                      locked: true,
                      zIndex: index,
                    };
                  })}
                  editable={false}
                />
              </div>

              {/* Outfit Info */}
              <div className="px-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedOutfit.occasion}</Badge>
                  <Badge variant="outline">{selectedOutfit.style}</Badge>
                  <Badge variant="outline">{selectedOutfit.season}</Badge>
                  {selectedOutfit.source === 'ai_text' && (
                    <Badge className="bg-accent text-accent-foreground">AI</Badge>
                  )}
                </div>

                {selectedOutfit.explanation && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedOutfit.explanation}</p>
                )}

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">包含单品 ({selectedOutfit.items.length})</h4>
                  {selectedOutfit.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-md bg-card overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.name || '衣物图片'} className="w-full h-full object-contain p-1" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category} / {item.subCategory}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      setSelectedOutfit(null);
                      router.push('/ai-styling');
                    }}
                    className="flex-1 h-11 bg-primary hover:bg-primary-hover"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    基于此搭配
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
