'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  X,
  Shirt,
  Sparkles,
  Edit3,
  Trash2,
  Camera,
  Image as ImageIcon,
  Heart,
  Hand,
  Clock,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: '可用', color: 'bg-muted text-muted-foreground', icon: Shirt },
  wearing: { label: '穿着中', color: 'bg-primary/10 text-primary', icon: Heart },
  washing: { label: '洗衣中', color: 'bg-info-bg text-info', icon: Hand },
  lent: { label: '已借出', color: 'bg-warning-bg text-warning', icon: Clock },
  pending_review: { label: '待确认', color: 'bg-accent text-accent-foreground', icon: AlertTriangle },
};

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
  const [editItem, setEditItem] = useState<ClothingItem | null>(null);
  const [uploadedItems, setUploadedItems] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fabOffset, setFabOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  // Item counts per category
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wardrobeItems.length };
    wardrobeItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [wardrobeItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = wardrobeItems;
    if (activeCategory !== 'all') {
      items = items.filter((item) => item.category === activeCategory);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const newItems: ClothingItem[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: `新衣物 ${wardrobeItems.length + index + 1}`,
        category: '上装',
        subCategory: 'T恤',
        primaryColor: '#808080',
        colors: ['灰色'],
        season: ['春夏'],
        occasions: ['日常'],
        style: ['简约'],
        material: '棉',
        status: 'pending_review' as ClothingItem['status'],
        imageUrl: URL.createObjectURL(file),
        description: '新上传的衣物',
        wearCount: 0,
      }));
      setUploadedItems(newItems);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleConfirmUpload = () => {
    uploadedItems.forEach((item) => addItem(item));
    setUploadedItems([]);
    setIsUploadSheetOpen(false);
    toast.success(`已添加 ${uploadedItems.length} 件衣物`);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateItem(editItem.id, editItem);
    setEditItem(null);
    setSelectedItem(null);
    toast.success('已保存修改');
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
      {/* Simplified Header - 2 layers */}
      <header className="sticky top-0 z-40 glass-surface border-b border-border">
        <div className="px-4 pt-[env(safe-area-inset-top)]">
          {/* Layer 1: Title + View Mode + Search Toggle */}
          <div className="flex items-center gap-2 h-12">
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('items')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'items'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                单品
              </button>
              <button
                onClick={() => setViewMode('outfits')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'outfits'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                搭配
              </button>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Layer 2: Search (collapsible) + Category Chips */}
          <div className={`overflow-hidden transition-all duration-200 ${showSearch ? 'max-h-24 pb-2' : 'max-h-12 pb-2'}`}>
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索衣物名称、颜色..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-none text-sm"
                  autoFocus
                />
              </div>
            )}
            {/* Category Chips with scroll hint */}
            <div className="relative">
              <div
                ref={categoryScrollRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                      activeCategory === cat.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.label}
                    <span className="text-xs opacity-70">{itemCounts[cat.key] || 0}</span>
                  </button>
                ))}
              </div>
              {/* Scroll hint gradient */}
              {showScrollHint && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
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
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[item.status]?.color || ''}`}>
                      {STATUS_CONFIG[item.status]?.label || item.status}
                    </div>
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
            /* Empty State with Illustration */
            <div className="flex flex-col items-center justify-center py-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/empty-wardrobe.jpeg" alt="衣橱为空" className="w-40 h-40 object-contain mb-4 opacity-80" />
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery ? '没有找到匹配的衣物' : '衣橱还是空的'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsUploadSheetOpen(true)} className="bg-primary hover:bg-primary-hover mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一件衣物
                </Button>
              )}
            </div>
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
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground">
                      AI
                    </div>
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
            <div className="flex flex-col items-center justify-center py-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/empty-styling.jpeg" alt="暂无搭配" className="w-40 h-40 object-contain mb-4 opacity-80" />
              <p className="text-sm text-muted-foreground mb-2">还没有保存的搭配</p>
              <Button onClick={() => router.push('/ai-styling')} className="bg-primary hover:bg-primary-hover mt-2">
                <Sparkles className="w-4 h-4 mr-2" />
                去创建搭配
              </Button>
            </div>
          )
        )}
      </div>

      {/* FAB - with scroll offset and view-mode awareness */}
      <button
        onClick={() => viewMode === 'items' ? setIsUploadSheetOpen(true) : router.push('/ai-styling')}
        className="fixed z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        style={{
          bottom: `calc(6rem + ${fabOffset}px)`,
          right: 'max(1rem, calc((100vw - 36rem) / 2 + 1rem))',
        }}
      >
        {viewMode === 'items' ? <Plus className="w-6 h-6" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {/* Item Detail Sheet - Bottom Sheet instead of Dialog */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>衣物详情</SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <div className="overflow-y-auto h-full pb-4">
              {/* Large Image - 4:5 ratio */}
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-muted mx-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Info - List style with icons */}
              <div className="px-4 mt-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.subCategory}</p>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}

                {/* Attribute Tags - 横向并列展示 */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedItem.primaryColor }} />
                    {selectedItem.primaryColor}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground">
                    <Shirt className="w-3 h-3 text-muted-foreground" />
                    {selectedItem.category}/{selectedItem.subCategory}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    穿{selectedItem.wearCount}次
                  </span>
                  {selectedItem.season.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground">
                      <Heart className="w-3 h-3 text-muted-foreground" />
                      {s}
                    </span>
                  ))}
                  {selectedItem.material && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 text-xs text-foreground">
                      <Hand className="w-3 h-3 text-muted-foreground" />
                      {selectedItem.material}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions - 底部三按钮 */}
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
                  className="flex-1 h-11 border-border text-foreground"
                  onClick={() => setEditItem({ ...selectedItem })}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle>编辑衣物</DialogTitle>
            <DialogDescription>修改衣物信息</DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">名称</label>
                <Input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">描述</label>
                <Input
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">子分类</label>
                  <Input
                    value={editItem.subCategory}
                    onChange={(e) => setEditItem({ ...editItem, subCategory: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">材质</label>
                  <Input
                    value={editItem.material}
                    onChange={(e) => setEditItem({ ...editItem, material: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1 bg-primary hover:bg-primary-hover">
                  <Check className="w-4 h-4 mr-2" />
                  保存
                </Button>
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
        <AlertDialogContent className="rounded-xl">
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
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
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
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
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
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
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
                        <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
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
