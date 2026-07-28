'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Camera,
  Image as ImageIcon,
  Shirt,
  X,
  Heart,
  MoreHorizontal,
  Edit3,
  Trash2,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { wardrobeItems, categories } from '@/lib/mock-data';
import type { WardrobeItem } from '@/lib/mock-data';

export default function WardrobePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

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
          item.category.toLowerCase().includes(q) ||
          item.colors.some((c) => c.toLowerCase().includes(q))
      );
    }
    return items;
  }, [searchQuery, activeCategory]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wardrobeItems.length };
    wardrobeItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, []);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-surface border-b border-border/30">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">我的衣橱</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{wardrobeItems.length} 件单品</p>
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

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索衣物，如 &quot;黑色通勤上衣&quot;"
              className="pl-9 h-10 bg-muted/30 border-border/40 rounded-lg text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          {/* Category chips */}
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
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4">
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
                  {getStatusBadge(item.status)}
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
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">相册批量导入</p>
                <p className="text-xs text-muted-foreground">从相册选择多张图片</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-4 justify-start gap-4 rounded-lg bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-primary/15"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shirt className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">添加整套穿搭</p>
                <p className="text-xs text-muted-foreground">手动创建一套搭配</p>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {selectedItem && (
            <>
              {/* Image */}
              <div className="aspect-square bg-muted/40 relative">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Info */}
              <div className="p-4 space-y-4">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-lg">{selectedItem.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-2">
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
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 h-10 bg-primary hover:bg-primary/90 text-sm btn-primary-glow">
                    用它搭配
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MoreHorizontal className="h-4 w-4" />
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
            <Button variant="outline" className="flex-1 h-10">重置</Button>
            <Button className="flex-1 h-10 bg-primary hover:bg-primary/90 btn-primary-glow" onClick={() => setShowFilter(false)}>
              查看 {filteredItems.length} 件结果
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
