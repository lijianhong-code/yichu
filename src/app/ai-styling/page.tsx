'use client';

import { useState, useEffect, useCallback } from 'react';
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
  X,
  Undo2,
  Redo2,
  MoveHorizontal,
  RotateCcw,
  BookmarkPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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

// V1.4: 4 states sharing the same outfit area
type PageState = 'empty' | 'loading' | 'result' | 'editing';

const loadingStages = [
  { label: '正在理解场合', duration: 800 },
  { label: '正在查询天气', duration: 600 },
  { label: '正在从 86 件衣物中筛选', duration: 1200 },
  { label: '正在生成搭配方案', duration: 1000 },
];

// Mock 3 candidate outfits
const mockCandidates = [
  {
    id: 'candidate-1',
    label: '稳妥通勤',
    outfit: todayOutfit,
  },
  {
    id: 'candidate-2',
    label: '更轻松',
    outfit: {
      ...todayOutfit,
      name: '轻松商务风',
      explanation: '针织衫搭配休闲裤，舒适又不失体面，适合轻松的办公环境。',
      items: todayOutfit.items.slice(0, 3),
    },
  },
  {
    id: 'candidate-3',
    label: '更有风格',
    outfit: {
      ...todayOutfit,
      name: '时尚通勤风',
      explanation: '衬衫搭配高腰裤与乐福鞋，经典配色中融入个性细节。',
      items: [todayOutfit.items[0], todayOutfit.items[2], todayOutfit.items[4]],
    },
  },
];

export default function AIStylingPage() {
  const [pageState, setPageState] = useState<PageState>('empty');
  const [inputValue, setInputValue] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [showReplacement, setShowReplacement] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // V1.4: Candidate switching
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);
  const [hasViewedAll, setHasViewedAll] = useState(false);
  const [candidates, setCandidates] = useState(mockCandidates);

  // Canvas / editing state
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [canvasSource, setCanvasSource] = useState<'ai' | 'manual' | 'edit'>('ai');
  const [trayOpen, setTrayOpen] = useState(false);
  const [selectedTrayItems, setSelectedTrayItems] = useState<WardrobeItem[]>([]);
  const [editHistory, setEditHistory] = useState<{ items: CanvasItem[] }[]>([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState(-1);

  const currentOutfit = candidates[activeCandidateIndex]?.outfit ?? todayOutfit;
  const outfitItems = currentOutfit?.items ?? [];

  // Initialize canvas from outfit
  const initCanvasFromOutfit = useCallback((source: 'ai' | 'manual' | 'edit', outfitData?: typeof todayOutfit) => {
    setCanvasSource(source);
    const data = outfitData ?? currentOutfit;
    if (source === 'manual') {
      setCanvasItems([]);
      setTrayOpen(true);
    } else {
      const items: CanvasItem[] = (data?.items ?? []).map((wardrobeItem, index) => {
        const totalItems = (data?.items ?? []).length;
        const cols = Math.min(3, totalItems);
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
          id: `canvas-${wardrobeItem.id}`,
          itemId: wardrobeItem.id,
          item: wardrobeItem,
          x: 20 + col * 30,
          y: 15 + row * 35,
          scale: 1,
          locked: false,
          zIndex: index,
        };
      });
      setCanvasItems(items);
      setTrayOpen(false);
    }
    setEditHistory([{ items: canvasItems }]);
    setEditHistoryIndex(0);
  }, [currentOutfit, canvasItems]);

  // Push edit history
  const pushEditHistory = useCallback((newItems: CanvasItem[]) => {
    setEditHistory(prev => {
      const truncated = prev.slice(0, editHistoryIndex + 1);
      const next = [...truncated, { items: newItems }].slice(-20);
      setEditHistoryIndex(next.length - 1);
      return next;
    });
  }, [editHistoryIndex]);

  const handleUndo = useCallback(() => {
    if (editHistoryIndex > 0) {
      const newIndex = editHistoryIndex - 1;
      setEditHistoryIndex(newIndex);
      setCanvasItems(editHistory[newIndex].items);
    }
  }, [editHistory, editHistoryIndex]);

  const handleRedo = useCallback(() => {
    if (editHistoryIndex < editHistory.length - 1) {
      const newIndex = editHistoryIndex + 1;
      setEditHistoryIndex(newIndex);
      setCanvasItems(editHistory[newIndex].items);
    }
  }, [editHistory, editHistoryIndex]);

  // Generate
  const handleGenerate = () => {
    if (!inputValue.trim()) return;
    setPageState('loading');
    setCurrentStage(0);
    setProgress(0);
    setHasViewedAll(false);
    setActiveCandidateIndex(0);
  };

  // Loading animation
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

  // Track viewing all candidates
  useEffect(() => {
    if (pageState === 'result' && activeCandidateIndex >= 2) {
      setHasViewedAll(true);
    }
  }, [activeCandidateIndex, pageState]);

  const handleItemSelect = (item: WardrobeItem) => {
    if (pageState === 'editing') return;
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
    if (pageState === 'editing') {
      setShowUnsavedDialog(true);
      return;
    }
    setPageState('empty');
    setCurrentStage(0);
    setProgress(0);
  };

  const handleEnterEditing = (source: 'ai' | 'manual' | 'edit') => {
    initCanvasFromOutfit(source);
    setPageState('editing');
  };

  const handleEditingComplete = () => {
    setPageState('result');
    setTrayOpen(false);
  };

  const handleAIComplete = () => {
    const existingCategories = new Set(
      canvasItems.map((ci) => wardrobeItems.find((w) => w.id === ci.itemId)?.category)
    );
    const missingCategories = ['bottoms', 'shoes'].filter((c) => !existingCategories.has(c));

    const newItems = [...canvasItems];
    missingCategories.forEach((cat) => {
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
    pushEditHistory(newItems);
  };

  const handleAddFromTray = (item: WardrobeItem) => {
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
    const newItems = [...canvasItems, newItem];
    setCanvasItems(newItems);
    pushEditHistory(newItems);
  };

  // Candidate switching
  const handleCandidateSelect = (index: number) => {
    if (index === activeCandidateIndex) return;
    setActiveCandidateIndex(index);
    setSelectedItem(null);
  };

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-background ${pageState === 'editing' ? 'pb-4' : 'pb-24'}`}>
        {/* ==================== CONTEXT BAR (always visible) ==================== */}
        <header className="sticky top-0 z-20 glass-surface border-b border-border/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(pageState === 'result' || pageState === 'editing') && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  {pageState === 'editing'
                    ? (canvasSource === 'manual' ? '手动搭配' : '编辑搭配')
                    : '搭配'}
                </h1>
                {pageState !== 'empty' && (
                  <p className="text-[10px] text-muted-foreground">
                    上海 · 22-28°C · {pageState === 'loading' ? '生成中' : currentOutfit.occasion}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {pageState === 'editing' ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={editHistoryIndex <= 0}>
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>撤销</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={editHistoryIndex >= editHistory.length - 1}>
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>重做</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(true)}>
                    <History className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMoreMenu(true)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ==================== PERMANENT OUTFIT AREA (48-56% height) ==================== */}
        <div className="px-4 pt-4">
          <div className="rounded-xl outfit-stage noise-texture relative overflow-hidden" style={{ minHeight: '48vh', maxHeight: '56vh' }}>
            
            {/* EMPTY STATE */}
            {pageState === 'empty' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[48vh] py-8">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Shirt className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">当前没有搭配</p>
                <p className="text-xs text-muted-foreground/60">描述需求让 AI 帮你搭，或手动组合</p>
              </div>
            )}

            {/* LOADING STATE - skeleton in outfit area */}
            {pageState === 'loading' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[48vh] py-8 px-6">
                {/* Skeleton items */}
                <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg" />
                  ))}
                </div>
                {/* Progress */}
                <div className="w-full max-w-xs space-y-3">
                  <Progress value={progress} className="h-1" />
                  <div className="text-center space-y-1">
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

            {/* RESULT STATE - outfit display */}
            {pageState === 'result' && (
              <div className="flex flex-col h-full min-h-[48vh]">
                <div className="flex-1 flex items-center justify-center gap-3 flex-wrap p-4">
                  {outfitItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={`group relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg bg-background overflow-hidden transition-all duration-200 hover:shadow-lg card-interactive ${
                        selectedItem?.id === item.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'border border-border/20'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {lockedItems.has(item.id) && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                          <Lock className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1.5 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
                        <p className="text-[10px] text-white/90 truncate font-medium">{item.subCategory}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Candidate thumbnails at bottom of outfit area */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2">
                    {candidates.map((candidate, index) => (
                      <button
                        key={candidate.id}
                        onClick={() => handleCandidateSelect(index)}
                        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                          index === activeCandidateIndex
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border/30 bg-background/60 hover:border-border/60'
                        }`}
                      >
                        <div className="flex -space-x-1">
                          {candidate.outfit.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="h-6 w-6 rounded-full bg-muted overflow-hidden border border-background">
                              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <span className={`text-xs font-medium truncate ${
                          index === activeCandidateIndex ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {candidate.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EDITING STATE - canvas */}
            {pageState === 'editing' && (
              <OutfitCanvas
                initialItems={canvasItems}
                editable
                onSave={(items) => {
                  setCanvasItems(items);
                  pushEditHistory(items);
                }}
                onAIComplete={(lockedIds) => {
                  console.log('AI complete locked:', lockedIds);
                }}
                onAddFromWardrobe={() => setTrayOpen(true)}
                onReplaceItem={() => {}}
              />
            )}
          </div>
        </div>

        {/* ==================== CONTEXTUAL BOTTOM ACTION AREA ==================== */}
        
        {/* EMPTY STATE actions */}
        {pageState === 'empty' && (
          <div className="px-4 pt-5 space-y-3">
            {/* AI input */}
            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气..."
                className="min-h-[80px] pr-12 bg-muted/20 border-border/40 rounded-lg text-sm resize-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-ai-400" />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-md bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={handleGenerate}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick scenarios */}
            <div className="flex flex-wrap gap-2">
              {quickScenarios.map((scenario) => (
                <Button
                  key={scenario.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(scenario.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 hover:bg-muted/50 border-border/30 text-xs font-medium text-foreground transition-all hover:border-primary/20"
                >
                  {iconMap[scenario.icon]}
                  {scenario.label}
                </Button>
              ))}
            </div>

            {/* Primary: AI Generate */}
            <Button
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-sm font-medium btn-primary-glow transition-all"
              onClick={handleGenerate}
              disabled={!inputValue.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 帮我搭
            </Button>

            {/* Secondary: Manual outfit */}
            <Button
              variant="outline"
              className="w-full h-11 rounded-lg text-sm border-border/60 hover:bg-muted/40"
              onClick={() => handleEnterEditing('manual')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              手动搭一套
            </Button>

            {/* Reference image entry */}
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-4 justify-start gap-3 rounded-lg bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-primary/15"
            >
              <div className="h-10 w-10 rounded-full bg-ai-50/80 flex items-center justify-center ai-glow">
                <ImageIcon className="h-5 w-5 text-ai-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-foreground">用参考图搭配</p>
                <p className="text-xs text-muted-foreground">上传一张图片，AI 用你的衣物模仿风格</p>
              </div>
            </Button>
          </div>
        )}

        {/* RESULT STATE actions */}
        {pageState === 'result' && (
          <div className="px-4 pt-4 space-y-3">
            {/* Explanation */}
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-ai-400 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed flex-1">{currentOutfit.explanation}</p>
            </div>
            <button
              onClick={() => setShowWhy(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              查看推荐理由
            </button>

            <Separator />

            {/* Main actions */}
            <div className="flex gap-3">
              <Button className="flex-1 h-12 rounded-lg bg-primary hover:bg-primary/90 text-sm btn-primary-glow transition-all">
                <Check className="h-4 w-4 mr-2" />
                今天穿
              </Button>
              {hasViewedAll ? (
                <Button variant="outline" className="flex-1 h-12 rounded-lg text-sm border-border/60 hover:bg-muted/40" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 h-12 rounded-lg text-sm border-border/60 hover:bg-muted/40" onClick={() => {
                  const next = (activeCandidateIndex + 1) % candidates.length;
                  handleCandidateSelect(next);
                }}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  下一套
                </Button>
              )}
            </div>

            {/* Edit outfit */}
            <Button
              variant="outline"
              className="w-full h-11 rounded-lg border-border/50 hover:bg-muted/30 text-sm"
              onClick={() => handleEnterEditing('edit')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              编辑搭配
            </Button>

            {/* Selected item actions */}
            {selectedItem && (
              <div className="flex gap-2">
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
                      取消保留
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                      保留这件
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Continue input */}
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
        )}

        {/* EDITING STATE actions */}
        {pageState === 'editing' && (
          <div className="px-4 pt-3 space-y-3">
            {/* Canvas Toolbar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg text-xs shrink-0"
                    onClick={() => setTrayOpen(!trayOpen)}
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
                        onClick={handleAIComplete}
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
                          const event = new CustomEvent('canvas-restore-layout');
                          window.dispatchEvent(event);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        恢复排版
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>恢复系统自动布局</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg text-xs shrink-0"
                        onClick={() => {
                          const event = new CustomEvent('canvas-restore-size');
                          window.dispatchEvent(event);
                        }}
                      >
                        <MoveHorizontal className="h-3.5 w-3.5 mr-1" />
                        恢复大小
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>重置选中单品尺寸</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            {/* Complete button */}
            <Button
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-sm"
              onClick={handleEditingComplete}
            >
              完成编辑
            </Button>

            {/* Wardrobe Tray */}
            <WardrobeTray
              expanded={trayOpen}
              onToggle={() => setTrayOpen(!trayOpen)}
              existingItemIds={canvasItems.map((ci) => ci.item.id)}
              selectedItems={selectedTrayItems}
              onItemSelect={(item) => setSelectedTrayItems((prev) => [...prev, item])}
              onItemDeselect={(item) => setSelectedTrayItems((prev) => prev.filter((i) => i.id !== item.id))}
              onConfirmAdd={() => {
                selectedTrayItems.forEach((item) => handleAddFromTray(item));
                setSelectedTrayItems([]);
                setTrayOpen(false);
              }}
            />
          </div>
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
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="h-auto p-0 flex-col items-stretch overflow-hidden hover:bg-muted/50"
                      >
                        <div className="relative aspect-[3/4] bg-muted/30">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-1.5 w-full text-left">
                          <p className="text-[10px] text-foreground truncate">{item.name}</p>
                        </div>
                      </Button>
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
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full h-auto p-3 justify-start gap-3 hover:bg-muted/50"
                  >
                    <div className="h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                      <Shirt className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">搭配方案 #{i}</p>
                      <p className="text-xs text-muted-foreground">2026-07-{20 - i} · 通勤</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  </Button>
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

        {/* More Menu Sheet */}
        <Sheet open={showMoreMenu} onOpenChange={setShowMoreMenu}>
          <SheetContent className="sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>更多操作</SheetTitle>
              <SheetDescription>对当前搭配进行更多操作</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start h-11" onClick={() => setShowMoreMenu(false)}>
                <RefreshCw className="h-4 w-4 mr-3" />
                重新生成
              </Button>
              <Button variant="ghost" className="w-full justify-start h-11" onClick={() => setShowMoreMenu(false)}>
                <ArrowRightLeft className="h-4 w-4 mr-3" />
                复制方案
              </Button>
              <Button variant="ghost" className="w-full justify-start h-11" onClick={() => setShowMoreMenu(false)}>
                <Send className="h-4 w-4 mr-3" />
                分享图片
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Unsaved changes dialog */}
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
                  handleEditingComplete();
                }}
              >
                保存草稿
              </Button>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  setPageState('empty');
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
