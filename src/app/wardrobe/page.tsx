'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  ChevronDown,
  Shirt,
  Sparkles,
  Edit3,
  Trash2,
  MoreVertical,
  Camera,
  Image as ImageIcon,
  Heart,
  Hand,
  Clock,
  Check,
  AlertTriangle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWardrobe } from '@/lib/store';
import { toast } from '@/lib/toast';
import { type ClothingItem, type ClothingStatus, type ClothingCategory, CATEGORIES } from '@/lib/mock-data';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: '可用', color: 'bg-muted text-muted-foreground', icon: Shirt },
  wearing: { label: '穿着中', color: 'bg-primary/10 text-primary', icon: Heart },
  washing: { label: '洗衣中', color: 'bg-info-bg text-info', icon: Hand },
  lent: { label: '已借出', color: 'bg-warning-bg text-warning', icon: Clock },
  pending_review: { label: '待确认', color: 'bg-accent text-accent-foreground', icon: AlertTriangle },
};

export default function WardrobePage() {
  const { state, addItem, updateItem, deleteItem, getStats } = useWardrobe();
  const wardrobeItems = state.items;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'items' | 'outfits'>('items');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ClothingItem | null>(null);
  const [editItem, setEditItem] = useState<ClothingItem | null>(null);
  const [uploadedItems, setUploadedItems] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

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

  // Mock outfits
  const mockOutfits = useMemo(() => [
    {
      id: 'outfit-1',
      name: '春日通勤',
      items: wardrobeItems.slice(0, 3),
      occasion: 'work' as const,
      lastWorn: '2天前',
      isAI: true,
    },
    {
      id: 'outfit-2',
      name: '周末约会',
      items: wardrobeItems.slice(2, 5),
      occasion: 'date' as const,
      lastWorn: '5天前',
      isAI: true,
    },
    {
      id: 'outfit-3',
      name: '运动休闲',
      items: wardrobeItems.slice(4, 7),
      occasion: 'casual' as const,
      lastWorn: '1周前',
      isAI: false,
    },
  ], [wardrobeItems]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAnalyzing(true);
    // Simulate AI recognition
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
    setIsMoreSheetOpen(false);
    toast.success('已删除衣物');
  };

  const handleBatchStatus = (status: ClothingStatus) => {
    if (!selectedItem) return;
    updateItem(selectedItem.id, { status });
    setSelectedItem({ ...selectedItem, status });
    setIsMoreSheetOpen(false);
    toast.success(`已标记为${STATUS_CONFIG[status].label}`);
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 glass-surface border-b border-border">
        <div className="px-4 pt-[env(safe-area-inset-top)]">
          {/* Title Row */}
          <div className="flex items-center justify-between h-12">
            <div>
              <h1 className="text-lg font-semibold text-foreground">我的衣橱</h1>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {stats.totalItems} 件
              </Badge>
            </div>
          </div>

          {/* View Mode + Search in one row */}
          <div className="flex items-center gap-2 pb-2">
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索衣物..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-none text-sm"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              全部
              <span className="text-xs opacity-70">{itemCounts.all}</span>
            </button>
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
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {viewMode === 'items' ? (
          /* Items Grid */
          <div className="grid grid-cols-2 gap-3">
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

                {/* Item Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-white/70 text-xs">{item.subCategory}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Outfits Grid */
          <div className="grid grid-cols-2 gap-3">
            {mockOutfits.map((outfit) => (
              <div
                key={outfit.id}
                className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-muted shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Outfit Preview - Stacked Items */}
                <div className="w-full h-full p-3">
                  <div className="relative w-full h-full">
                    {outfit.items.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id}
                        className="absolute inset-0 rounded-md bg-background/80 shadow-sm overflow-hidden transition-transform group-hover:scale-[1.02]"
                        style={{
                          transform: `translateY(${index * 4}px) scale(${1 - index * 0.05})`,
                          zIndex: 3 - index,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item Count Badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center text-xs font-medium text-foreground shadow-sm">
                  {outfit.items.length}
                </div>

                {/* AI Badge */}
                {outfit.isAI && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground">
                    AI
                  </div>
                )}

                {/* Outfit Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">{outfit.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/70 text-xs capitalize">{outfit.occasion}</span>
                    <span className="text-white/50 text-xs">·</span>
                    <span className="text-white/70 text-xs">{outfit.lastWorn}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && viewMode === 'items' && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shirt className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">没有找到匹配的衣物</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsUploadSheetOpen(true)}
        className="fixed bottom-28 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>衣物详情</DialogTitle>
            <DialogDescription>查看衣物详细信息</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Large Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.subCategory}</p>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">颜色：</span>
                    <span className="text-foreground">{selectedItem.primaryColor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">材质：</span>
                    <span className="text-foreground">{selectedItem.material}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">季节：</span>
                    <span className="text-foreground">{selectedItem.season.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">穿着次数：</span>
                    <span className="text-foreground">{selectedItem.wearCount} 次</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    setSelectedItem(null);
                    // Navigate to AI styling with this item
                    window.location.href = `/ai-styling?item=${selectedItem.id}`;
                  }}
                  className="flex-1 bg-primary hover:bg-primary-hover"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  用它搭配
                </Button>
                <Sheet open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <SheetHeader>
                      <SheetTitle>更多操作</SheetTitle>
                    </SheetHeader>
                    <div className="py-4 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setEditItem({ ...selectedItem });
                          setIsMoreSheetOpen(false);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        编辑信息
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleBatchStatus('washing')}
                      >
                        <Hand className="w-4 h-4 mr-2" />
                        标记为洗衣中
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleBatchStatus('lent')}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        标记为已借出
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive"
                        onClick={() => {
                          setDeleteConfirmItem(selectedItem);
                          setIsMoreSheetOpen(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除单品
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
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
        <AlertDialogContent>
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
        <SheetContent side="bottom" className="h-auto">
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
    </div>
  );
}
