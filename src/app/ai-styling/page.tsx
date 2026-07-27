'use client';

import { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  ChevronLeft,
  RefreshCw,
  Check,
  ArrowRightLeft,
  Lock,
  Unlock,
  History,
  MoreHorizontal,
  ThermometerSun,
  Shirt,
  Clock,
  Briefcase,
  Wine,
  Sun,
  ClipboardList,
  ImageIcon,
  Plus,
  Pencil,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { OutfitCanvas, type CanvasItem } from '@/components/outfit-canvas';
import { WardrobeTray } from '@/components/wardrobe-tray';
import { todayOutfit, wardrobeItems, quickScenarios } from '@/lib/mock-data';
import type { WardrobeItem } from '@/lib/mock-data';

const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="h-4 w-4" />,
  Wine: <Wine className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
};

// V1.3: 4 states - input, loading, result, canvas
type PageState = 'input' | 'loading' | 'result' | 'canvas';

const loadingStages = [
  { label: '正在理解场合', duration: 800 },
  { label: '正在查询天气', duration: 600 },
  { label: '正在从 86 件衣物中筛选', duration: 1200 },
  { label: '正在生成搭配方案', duration: 1000 },
];

export default function AIStylingPage() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [inputValue, setInputValue] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [showReplacement, setShowReplacement] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Canvas state
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [canvasSource, setCanvasSource] = useState<'ai' | 'manual' | 'edit'>('ai');
  const [trayOpen, setTrayOpen] = useState(false);
  const [selectedTrayItems, setSelectedTrayItems] = useState<WardrobeItem[]>([]);

  const outfit = todayOutfit;

  // Initialize canvas items from outfit
  const initCanvasFromOutfit = (source: 'ai' | 'manual' | 'edit') => {
    setCanvasSource(source);
    if (source === 'manual') {
      setCanvasItems([]);
      setTrayOpen(true); // Open tray by default for manual mode
    } else {
      // Convert outfit items to canvas items with auto-layout positions
      const items: CanvasItem[] = outfit.items.map((wardrobeItem, index) => {
        const totalItems = outfit.items.length;
        const cols = Math.min(3, totalItems);
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
          id: `canvas-${wardrobeItem.id}`,
          itemId: wardrobeItem.id,
          item: wardrobeItem,
          x: 20 + col * 30, // percentage
          y: 15 + row * 35, // percentage
          scale: 1,
          locked: false,
          zIndex: index,
        };
      });
      setCanvasItems(items);
      setTrayOpen(false);
    }
  };

  const handleGenerate = () => {
    if (!inputValue.trim()) return;
    setPageState('loading');
    setCurrentStage(0);
    setProgress(0);
  };

  useEffect(() => {
    if (pageState !== 'loading') return;

    let totalElapsed = 0;
    const totalDuration = loadingStages.reduce((sum, s) => sum + s.duration, 0);

    const timers = loadingStages.map((stage, index) => {
      return setTimeout(() => {
        setCurrentStage(index);
        totalElapsed = loadingStages.slice(0, index + 1).reduce((sum, s) => sum + s.duration, 0);
        setProgress(Math.round((totalElapsed / totalDuration) * 100));
      }, loadingStages.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
    });

    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setPageState('result'), 300);
    }, totalDuration);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [pageState]);

  const handleItemSelect = (item: WardrobeItem) => {
    setSelectedItem(item);
    setShowReplacement(true);
  };

  const toggleLock = (itemId: string) => {
    setLockedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleBack = () => {
    if (pageState === 'canvas') {
      setShowUnsavedDialog(true);
      return;
    }
    setPageState('input');
    setCurrentStage(0);
    setProgress(0);
  };

  const handleEnterCanvas = (source: 'ai' | 'manual' | 'edit') => {
    initCanvasFromOutfit(source);
    setPageState('canvas');
  };

  const handleCanvasComplete = () => {
    // Save and return to result or input
    setPageState('result');
  };

  const handleAIComplete = () => {
    // AI completion: add missing slots
    // In a real app, this would call the AI service
    const existingCategories = new Set(
      canvasItems.map((ci) => wardrobeItems.find((w) => w.id === ci.itemId)?.category)
    );
    const missingCategories = ['bottoms', 'shoes'].filter((c) => !existingCategories.has(c));

    const newItems = [...canvasItems];
    missingCategories.forEach((cat, index) => {
      const candidate = wardrobeItems.find((w) => w.category === cat && !newItems.some((ni) => ni.item.id === w.id));
      if (candidate) {
        newItems.push({
          id: `canvas-${candidate.id}`,
          itemId: candidate.id,
          item: candidate,
          x: 20 + (newItems.length % 3) * 30,
          y: 15 + Math.floor(newItems.length / 3) * 35,
          scale: 1,
          locked: false,
          zIndex: newItems.length,
        });
      }
    });
    setCanvasItems(newItems);
  };

  const handleAddFromTray = (item: WardrobeItem) => {
    // Check if already in canvas
    if (canvasItems.some((ci) => ci.item.id === item.id)) return;

    const newItem: CanvasItem = {
      id: `canvas-${item.id}`,
      itemId: item.id,
      item: item,
      x: 35,
      y: 35,
      scale: 1,
      locked: false,
      zIndex: canvasItems.length,
    };
    setCanvasItems((prev) => [...prev, newItem]);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-24">
        {/* ==================== INPUT STATE ==================== */}
        {pageState === 'input' && (
          <>
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
              <div className="px-4 py-3">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">AI 搭配</h1>
                <p className="text-xs text-muted-foreground mt-0.5">描述你的需求，AI 从衣橱中为你搭配</p>
              </div>
            </header>

            {/* Context bar */}
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/30">
                <ThermometerSun className="h-4 w-4 text-accent-foreground" />
                <span className="text-xs text-foreground">上海</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">22-28°C 多云</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">今天</span>
              </div>
            </div>

            {/* Input area */}
            <div className="px-4 pt-4">
              <div className="relative">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气..."
                  className="min-h-[100px] pr-12 bg-muted/30 border-border/50 rounded-lg text-sm resize-none placeholder:text-muted-foreground/50"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {/* AI indicator dot - 4px per PRD */}
                  <div className="h-1 w-1 rounded-full bg-ai-400" />
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-md bg-primary hover:bg-primary/90"
                    onClick={handleGenerate}
                    disabled={!inputValue.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick scenarios */}
              <div className="flex flex-wrap gap-2 mt-3">
                {quickScenarios.map((scenario) => (
                  <button
                    key={scenario.label}
                    onClick={() => setInputValue(scenario.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted/60 border border-border/30 text-xs font-medium text-foreground transition-colors"
                  >
                    {iconMap[scenario.icon]}
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>

            {/* V1.3: Two entry points - AI generate + Manual outfit */}
            <div className="px-4 pt-5 space-y-3">
              {/* Primary: AI Generate */}
              <Button
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-sm font-medium"
                onClick={handleGenerate}
                disabled={!inputValue.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                开始搭配
              </Button>

              {/* V1.3: Secondary - Manual outfit entry */}
              <Button
                variant="outline"
                className="w-full h-11 rounded-lg text-sm"
                onClick={() => handleEnterCanvas('manual')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                手动搭一套
              </Button>
            </div>

            {/* Reference image entry */}
            <div className="px-4 pt-4">
              <button className="w-full flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-ai-50 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-ai-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">用参考图搭配</p>
                  <p className="text-xs text-muted-foreground">上传一张图片，AI 用你的衣物模仿风格</p>
                </div>
              </button>
            </div>

            {/* History entry */}
            <div className="px-4 pt-4">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                查看历史方案
              </button>
            </div>
          </>
        )}

        {/* ==================== LOADING STATE ==================== */}
        {pageState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-xs space-y-6 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {loadingStages[currentStage]?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  请稍候，正在为你寻找最佳搭配
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {loadingStages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index <= currentStage
                        ? 'w-4 bg-primary'
                        : 'w-1.5 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== RESULT STATE ==================== */}
        {pageState === 'result' && (
          <>
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-medium text-foreground">{outfit.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      上海 · 22-28°C · {outfit.occasion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(true)}>
                    <History className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </header>

            {/* Outfit result area - 55-62% of height */}
            <div className="px-4 pt-4">
              <div className="rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 p-4 min-h-[320px]">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {outfit.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={`group relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg bg-background border-2 overflow-hidden transition-all duration-200 hover:shadow-md ${
                        selectedItem?.id === item.id
                          ? 'border-primary shadow-md'
                          : 'border-border/30 hover:border-primary/30'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {lockedItems.has(item.id) && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Lock className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/40 to-transparent">
                        <p className="text-[10px] text-white truncate">{item.subCategory}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="px-4 pt-4">
              <p className="text-sm text-foreground leading-relaxed">{outfit.explanation}</p>
              <button
                onClick={() => setShowWhy(true)}
                className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Sparkles className="h-3 w-3 text-ai-400" />
                查看推荐理由
              </button>
            </div>

            {/* V1.3: Actions - Today wear, Change, Edit outfit */}
            <div className="px-4 pt-5 flex gap-3">
              <Button className="flex-1 h-12 rounded-lg bg-primary hover:bg-primary/90 text-sm">
                <Check className="h-4 w-4 mr-2" />
                今天穿
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-lg text-sm" onClick={handleBack}>
                <RefreshCw className="h-4 w-4 mr-2" />
                换一套
              </Button>
            </div>

            {/* V1.3: Edit outfit entry - enters canvas editing state */}
            <div className="px-4 pt-3">
              <button
                onClick={() => handleEnterCanvas('edit')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-sm text-foreground"
              >
                <Pencil className="h-4 w-4" />
                编辑搭配
              </button>
            </div>

            {/* Selected item actions */}
            {selectedItem && (
              <div className="px-4 pt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-xs"
                  onClick={() => setShowReplacement(true)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                  替换
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-xs"
                  onClick={() => toggleLock(selectedItem.id)}
                >
                  {lockedItems.has(selectedItem.id) ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 mr-1.5" />
                      解锁
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      锁定
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Continue input */}
            <div className="px-4 pt-5">
              <div className="relative">
                <Input
                  placeholder="继续调整，如：鞋子换成平底"
                  className="pr-20 h-10 bg-muted/30 border-border/50 rounded-lg text-sm"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-ai-400" />
                  <Button size="icon" className="h-7 w-7 rounded-md bg-primary">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== CANVAS EDITING STATE (V1.3) ==================== */}
        {pageState === 'canvas' && (
          <>
            {/* Canvas Header */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <p className="text-sm font-medium text-foreground">
                    {canvasSource === 'manual' ? '手动搭配' : '编辑搭配'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Undo - handled by canvas component
                          const event = new CustomEvent('canvas-undo');
                          window.dispatchEvent(event);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 rotate-180" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>撤销</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const event = new CustomEvent('canvas-redo');
                          window.dispatchEvent(event);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>重做</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </header>

            {/* Canvas Area - 3:4 ratio per PRD */}
            <div className="px-4 pt-4">
              <OutfitCanvas
                initialItems={canvasItems}
                editable
                onSave={(items) => setCanvasItems(items)}
                onAIComplete={(lockedIds) => {
                  // AI complete returns locked IDs - in mock we just keep current items
                  console.log('AI complete locked:', lockedIds)
                }}
                onAddFromWardrobe={() => setTrayOpen(true)}
                onReplaceItem={() => {}}
              />
            </div>

            {/* Canvas Toolbar */}
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg text-xs shrink-0"
                      onClick={() => setTrayOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      添加
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>从衣橱添加单品</TooltipContent>
                </Tooltip>

                {canvasItems.length > 0 && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg text-xs shrink-0"
                          onClick={() => {
                            // AI Complete - fill missing slots
                            handleAIComplete();
                          }}
                        >
                          <SparklesIcon className="h-3.5 w-3.5 mr-1 text-ai-400" />
                          AI 补全
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>AI 补充缺失槽位</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg text-xs shrink-0"
                          onClick={() => {
                            // Restore layout
                            const event = new CustomEvent('canvas-restore-layout');
                            window.dispatchEvent(event);
                          }}
                        >
                          恢复排版
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>恢复系统自动布局</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {/* Canvas Complete Button */}
            <div className="px-4 pt-3">
              <Button
                className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-sm"
                onClick={handleCanvasComplete}
                disabled={canvasItems.length === 0}
              >
                完成
              </Button>
            </div>

            {/* Wardrobe Tray - bottom drawer for adding items */}
            <WardrobeTray
              expanded={trayOpen}
              onToggle={() => setTrayOpen(!trayOpen)}
              existingItemIds={canvasItems.map((ci) => ci.item.id)}
              selectedItems={selectedTrayItems}
              onItemSelect={(item) => setSelectedTrayItems((prev) => [...prev, item])}
              onItemDeselect={(item) => setSelectedTrayItems((prev) => prev.filter((i) => i.id !== item.id))}
              onConfirmAdd={() => {
                selectedTrayItems.forEach((item) => handleAddFromTray(item))
                setSelectedTrayItems([])
                setTrayOpen(false)
              }}
            />
          </>
        )}

        {/* ==================== SHEETS ==================== */}

        {/* Replacement Drawer */}
        <Sheet open={showReplacement} onOpenChange={setShowReplacement}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>替换 {selectedItem?.subCategory}</SheetTitle>
              <SheetDescription>从衣橱中选择一个替代单品</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="py-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['更正式', '更休闲', '换个颜色', '更保暖'].map((dir) => (
                    <Button key={dir} variant="outline" size="sm" className="rounded-full text-xs">
                      {dir}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {wardrobeItems
                    .filter((item) => item.category === selectedItem?.category && item.id !== selectedItem?.id)
                    .map((item) => (
                      <button
                        key={item.id}
                        className="group relative aspect-[3/4] rounded-lg bg-muted/30 border border-border/30 overflow-hidden hover:border-primary/40 transition-colors"
                      >
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/40 to-transparent">
                          <p className="text-[9px] text-white truncate">{item.name}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
              <Button className="w-full h-11 bg-primary hover:bg-primary/90">
                确认替换
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* History Sheet */}
        <Sheet open={showHistory} onOpenChange={setShowHistory}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>历史方案</SheetTitle>
              <SheetDescription>你过去的搭配记录</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="py-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center">
                      <Shirt className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">搭配方案 #{i}</p>
                      <p className="text-xs text-muted-foreground">2026-07-{20 - i} · 通勤</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Why Sheet */}
        <Sheet open={showWhy} onOpenChange={setShowWhy}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>推荐理由</SheetTitle>
              <SheetDescription>AI 为什么推荐这套搭配</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-sm font-medium text-foreground mb-1">场合匹配</p>
                <p className="text-xs text-muted-foreground">商务休闲风格，适合日常通勤和办公环境</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-sm font-medium text-foreground mb-1">天气适配</p>
                <p className="text-xs text-muted-foreground">22-28°C 温度范围，透气舒适不闷热</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-sm font-medium text-foreground mb-1">色彩协调</p>
                <p className="text-xs text-muted-foreground">经典配色方案，简洁大方不出错</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* V1.3: Unsaved changes dialog when leaving canvas */}
        <Sheet open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <SheetContent className="sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>未保存的修改</SheetTitle>
              <SheetDescription>你有未保存的搭配修改，是否保存？</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  handleCanvasComplete();
                }}
              >
                保存草稿
              </Button>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  setPageState('input');
                }}
              >
                不保存
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 text-muted-foreground"
                onClick={() => setShowUnsavedDialog(false)}
              >
                继续编辑
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
