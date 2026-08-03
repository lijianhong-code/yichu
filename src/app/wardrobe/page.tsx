'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Camera,
  Image as ImageIcon,
  Shirt,
  X,
  MoreHorizontal,
  Edit3,
  Trash2,
  Package,
  Heart,
  Calendar,
  Eye,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  wardrobeItems,
  categories,
  outfits,
  wearLogs,
} from '@/lib/mock-data';
import type { WardrobeItem, Outfit } from '@/lib/mock-data';

type ViewMode = 'items' | 'outfits';

export default function WardrobePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showItemActions, setShowItemActions] = useState(false);
  const [itemStatus, setItemStatus] = useState<Record<string, WardrobeItem['status']>>({});
  const [uploadedItems, setUploadedItems] = useState<WardrobeItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload (simulates AI recognition)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newItems: WardrobeItem[] = Array.from(files).map((file, index) => {
      const itemId = `uploaded-${Date.now()}-${index}`;
      // Create a local URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      // Generate a mock item based on file name
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      return {
        id: itemId,
        name: fileName || `新衣物 ${index + 1}`,
        category: '上装',
        subCategory: 'T恤',
        primaryColor: '#808080',
        colors: ['灰色'],
        season: ['春夏', '秋冬'],
        occasions: ['日常'],
        style: ['简约'],
        material: '棉',
        pattern: '纯色',
        status: 'available' as const,
        wearCount: 0,
        lastWorn: '',
        imageUrl,
        addedAt: new Date().toISOString().split('T')[0],
      };
    });

    setUploadedItems((prev) => [...newItems, ...prev]);
    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredItems = useMemo(() => {
    let items = [...wardrobeItems, ...uploadedItems];
    if (activeCategory !== 'all') {
      items = items.filter((item) => item.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.colors.some((c) => c.toLowerCase().includes(q))
      );
    }
    return items;
  }, [searchQuery, activeCategory, uploadedItems]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wardrobeItems.length };
    wardrobeItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, []);

  const getItemStatus = (item: WardrobeItem): WardrobeItem['status'] => {
    return itemStatus[item.id] || item.status;
  };

  const getStatusBadge = (status: WardrobeItem['status']) => {
    switch (status) {
      case 'washing':
        return <Badge className="text-[10px] absolute top-2 right-2 bg-warning-bg/90 text-warning-fg border-0 backdrop-blur-sm">洗衣中</Badge>;
      case 'lent':
        return <Badge className="text-[10px] absolute top-2 right-2 bg-info-bg/90 text-info-fg border-0 backdrop-blur-sm">借出</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="text-[10px] absolute top-2 right-2 border-warning-fg text-warning-fg bg-background/80 backdrop-blur-sm">待确认</Badge>;
      default:
        return null;
    }
  };

  // Get wear log for an outfit
  const getOutfitWearLog = (outfitId: string) => {
    return wearLogs.find(log => log.outfitId === outfitId);
  };

  // Handle "use this item to style"
  const handleUseItemToStyle = () => {
    if (!selectedItem) return;
    setSelectedItem(null);
    router.push('/ai-styling');
  };

  // Handle mark item status
  const handleMarkStatus = (status: WardrobeItem['status']) => {
    if (!selectedItem) return;
    setItemStatus(prev => ({ ...prev, [selectedItem.id]: status }));
    setShowItemActions(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-surface border-b border-border/30">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">我的衣橱</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {viewMode === 'items'
                  ? `${wardrobeItems.length} 件单品`
                  : `${outfits.length} 套搭配`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setShowFilter(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 mb-3 p-1 rounded-lg bg-muted/30 border border-border/20">
            <button
              onClick={() => setViewMode('items')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium transition-all ${
                viewMode === 'items'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              单品
              <span className="opacity-50">{wardrobeItems.length}</span>
            </button>
            <button
              onClick={() => setViewMode('outfits')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium transition-all ${
                viewMode === 'outfits'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shirt className="h-3.5 w-3.5" />
              搭配
              <span className="opacity-50">{outfits.length}</span>
            </button>
          </div>

          {/* Search - only show in items view */}
          {viewMode === 'items' && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索衣物，如 &quot;黑色通勤上衣&quot;"
                className="pl-9 h-10 bg-muted/30 border-border/40 rounded-lg text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
              />
            </div>
          )}

          {/* Category chips - only show in items view */}
          {viewMode === 'items' && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.value)}
                    className={`rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      activeCategory === cat.value
                        ? 'chip-selected text-primary border-0'
                        : 'bg-background/60 text-muted-foreground border-border/30 hover:bg-muted/50'
                    }`}
                  >
                    {cat.label}
                    <span className="ml-1 opacity-60">{itemCounts[cat.value] || 0}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Items View */}
        {viewMode === 'items' && (
          <>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <Shirt className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">没有找到匹配的衣物</p>
                <p className="text-xs text-muted-foreground">试试其他搜索词或筛选条件</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group relative rounded-lg bg-muted/20 border border-border/20 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/15 active:scale-[0.98] card-interactive text-left"
                  >
                    {/* Image area - 4:5 ratio */}
                    <div className="relative aspect-[4/5] bg-muted/40 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {getStatusBadge(getItemStatus(item))}
                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.subCategory}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Outfits View */}
        {viewMode === 'outfits' && (
          <>
            {outfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                  <Shirt className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">还没有保存的搭配</p>
                <p className="text-xs text-muted-foreground">去搭配页面创建你的第一套搭配</p>
                <Button
                  className="mt-4 bg-primary hover:bg-primary/90 btn-primary-glow"
                  onClick={() => router.push('/ai-styling')}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  去搭配
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {outfits.map((outfit) => {
                  const wearLog = getOutfitWearLog(outfit.id);
                  return (
                    <button
                      key={outfit.id}
                      onClick={() => setSelectedOutfit(outfit)}
                      className="w-full group relative rounded-xl bg-muted/20 border border-border/20 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/15 active:scale-[0.99] card-interactive text-left"
                    >
                      <div className="flex">
                        {/* Outfit items preview */}
                        <div className="flex shrink-0 p-3 pr-0">
                          <div className="flex -space-x-2">
                            {outfit.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={item.id}
                                className="h-16 w-16 rounded-lg bg-muted/40 overflow-hidden border-2 border-background"
                                style={{ zIndex: 3 - idx }}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Outfit info */}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {outfit.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Tag className="h-2.5 w-2.5" />
                                  {outfit.occasion}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {outfit.season}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                          </div>
                          {/* Meta info */}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {outfit.items.length} 件单品
                            </span>
                            {wearLog && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                上次 {wearLog.date.slice(5)}
                              </span>
                            )}
                            {outfit.source === 'ai_text' && (
                              <span className="text-[10px] text-ai-600 flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" />
                                AI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 fab-shadow"
          onClick={() => setShowAddMenu(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Add Menu Sheet */}
      <Sheet open={showAddMenu} onOpenChange={setShowAddMenu}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>添加衣物</SheetTitle>
            <SheetDescription>选择添加方式</SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-3 stagger-children">
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-4 justify-start gap-4 rounded-lg bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-primary/15"
              onClick={() => {
                setShowAddMenu(false);
                fileInputRef.current?.setAttribute('capture', 'environment');
                fileInputRef.current?.click();
              }}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">拍摄单件</p>
                <p className="text-xs text-muted-foreground">拍照自动识别衣物信息</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-4 justify-start gap-4 rounded-lg bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-primary/15"
              onClick={() => {
                setShowAddMenu(false);
                fileInputRef.current?.removeAttribute('capture');
                fileInputRef.current?.setAttribute('multiple', 'multiple');
                fileInputRef.current?.click();
              }}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">相册批量导入</p>
                <p className="text-xs text-muted-foreground">从相册选择多张图片</p>
              </div>
            </Button>
          </div>
          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </SheetContent>
      </Sheet>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem && !showItemActions} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">衣物详情信息</DialogDescription>
          {selectedItem && (
            <>
              {/* Image - Large Preview */}
              <div className="aspect-square bg-muted/40 relative group">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay actions on image */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <button
                  onClick={() => setShowItemActions(true)}
                  className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-background transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-foreground" />
                </button>
              </div>
              {/* Info */}
              <div className="p-4 space-y-4">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-lg">{selectedItem.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{selectedItem.category}</Badge>
                    <Badge variant="outline" className="text-xs">{selectedItem.subCategory}</Badge>
                    {selectedItem.brand && (
                      <span className="text-xs text-muted-foreground">{selectedItem.brand}</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Attributes */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">颜色</p>
                    <p className="text-foreground">{selectedItem.colors.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">材质</p>
                    <p className="text-foreground">{selectedItem.material || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">季节</p>
                    <p className="text-foreground">{selectedItem.season.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">穿着次数</p>
                    <p className="text-foreground">{selectedItem.wearCount} 次</p>
                  </div>
                  {selectedItem.lastWorn && (
                    <div>
                      <p className="text-xs text-muted-foreground">上次穿着</p>
                      <p className="text-foreground">{selectedItem.lastWorn}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">风格</p>
                    <p className="text-foreground">{selectedItem.style.join(', ')}</p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-10 bg-primary hover:bg-primary/90 text-sm btn-primary-glow"
                    onClick={handleUseItemToStyle}
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    用它搭配
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setShowItemActions(true)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Actions Sheet */}
      <Sheet open={showItemActions} onOpenChange={setShowItemActions}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>
              {selectedItem?.name || '操作'}
            </SheetTitle>
            <SheetDescription>选择要执行的操作</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 gap-3"
              onClick={handleUseItemToStyle}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">用它搭配</p>
                <p className="text-xs text-muted-foreground">以此单品为基础创建搭配</p>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 gap-3"
              onClick={() => {
                setShowItemActions(false);
                // Edit functionality - could open edit form
              }}
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Edit3 className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">编辑信息</p>
                <p className="text-xs text-muted-foreground">修改名称、分类、标签等</p>
              </div>
            </Button>
            <Separator />
            <p className="text-xs text-muted-foreground px-2">标记状态</p>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 gap-3"
              onClick={() => handleMarkStatus('washing')}
            >
              <div className="h-7 w-7 rounded-full bg-warning-bg/50 flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-warning-fg" />
              </div>
              <span className="text-sm">标记为洗衣中</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 gap-3"
              onClick={() => handleMarkStatus('available')}
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm">标记为可用</span>
            </Button>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start h-11 gap-3 text-destructive hover:text-destructive"
              onClick={() => {
                setShowItemActions(false);
                setSelectedItem(null);
              }}
            >
              <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm">删除单品</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Outfit Detail Dialog */}
      <Dialog open={!!selectedOutfit} onOpenChange={(open) => { if (!open) setSelectedOutfit(null); }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">搭配详情信息</DialogDescription>
          {selectedOutfit && (
            <>
              {/* Outfit items preview */}
              <div className="bg-muted/30 p-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {selectedOutfit.items.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="h-20 w-20 rounded-lg bg-background overflow-hidden border border-border/30 shadow-sm">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-1 truncate max-w-[80px]">
                        {item.subCategory}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outfit info */}
              <div className="p-4 space-y-4">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-lg">{selectedOutfit.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{selectedOutfit.occasion}</Badge>
                    <Badge variant="outline" className="text-xs">{selectedOutfit.style}</Badge>
                    <Badge variant="outline" className="text-xs">{selectedOutfit.season}</Badge>
                    {selectedOutfit.source !== 'manual' && (
                      <span className="text-[10px] text-ai-600 flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        {selectedOutfit.source === 'ai_text' ? 'AI 文字生成' : 'AI 参考图'}
                      </span>
                    )}
                  </div>
                </div>

                {selectedOutfit.explanation && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-ai-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedOutfit.explanation}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">创建日期</p>
                    <p className="text-foreground">{selectedOutfit.createdAt}</p>
                  </div>
                  {selectedOutfit.lastWorn && (
                    <div>
                      <p className="text-xs text-muted-foreground">上次穿着</p>
                      <p className="text-foreground">{selectedOutfit.lastWorn}</p>
                    </div>
                  )}
                  {selectedOutfit.weather && (
                    <div>
                      <p className="text-xs text-muted-foreground">天气</p>
                      <p className="text-foreground">{selectedOutfit.weather}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">单品数量</p>
                    <p className="text-foreground">{selectedOutfit.items.length} 件</p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-10 bg-primary hover:bg-primary/90 text-sm btn-primary-glow"
                    onClick={() => {
                      setSelectedOutfit(null);
                      router.push('/ai-styling');
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    基于此搭配
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      setSelectedOutfit(null);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Sheet */}
      <Sheet open={showFilter} onOpenChange={setShowFilter}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>筛选</SheetTitle>
            <SheetDescription>按条件筛选你的衣物</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-5">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">品类</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? 'secondary' : 'outline'}
                    size="sm"
                    className={`rounded-full text-xs ${
                      activeCategory === cat.value
                        ? 'chip-selected text-primary border-0'
                        : 'bg-muted/30 text-muted-foreground border-border/30'
                    }`}
                    onClick={() => {
                      setActiveCategory(cat.value);
                    }}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">颜色</p>
              <div className="flex flex-wrap gap-2">
                {['黑色', '白色', '蓝色', '灰色', '棕色'].map((color) => (
                  <Button key={color} variant="outline" size="sm" className="rounded-full text-xs bg-muted/20 border-border/30">
                    {color}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">季节</p>
              <div className="flex flex-wrap gap-2">
                {['春夏', '春秋', '秋冬', '四季'].map((season) => (
                  <Button key={season} variant="outline" size="sm" className="rounded-full text-xs bg-muted/20 border-border/30">
                    {season}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 glass-surface-strong border-t border-border/30 flex gap-3">
            <Button variant="outline" className="flex-1 h-10" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>重置</Button>
            <Button className="flex-1 h-10 bg-primary hover:bg-primary/90 btn-primary-glow" onClick={() => setShowFilter(false)}>
              查看 {filteredItems.length} 件结果
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
