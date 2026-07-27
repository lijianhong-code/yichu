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
  Shirt,
  ImageIcon,
  Plus,
  Pencil,
  Sparkles as SparklesIcon,
  X,
  Undo2,
  Redo2,
  RotateCcw,
  BookmarkPlus,
  Trash2,
  MoveHorizontal,
  Briefcase,
  Wine,
  Sun,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Briefcase: <Briefcase className="h-3.5 w-3.5" />,
  Wine: <Wine className="h-3.5 w-3.5" />,
  Sun: <Sun className="h-3.5 w-3.5" />,
  ClipboardList: <ClipboardList className="h-3.5 w-3.5" />,
};

// V1.4: Page states
type PageState = 'empty' | 'loading' | 'preview' | 'editing';

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
  const [selectedItem, setSelectedItem] = useState<CanvasItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  // Candidate state
  const [candidates] = useState(mockCandidates);
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState(0);

  // Canvas / editing state
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<{ items: CanvasItem[] }[]>([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState(-1);

  const previewOutfit = candidates[previewCandidateIndex]?.outfit ?? todayOutfit;

  // Initialize canvas from outfit
  const initCanvasFromOutfit = useCallback((outfit: typeof todayOutfit) => {
    const items: CanvasItem[] = outfit.items.map((wardrobeItem, index) => {
      const totalItems = outfit.items.length;
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
    setEditHistory([{ items }]);
    setEditHistoryIndex(0);
    setSelectedItem(null);
  }, []);

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
    setPreviewCandidateIndex(0);
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
      setTimeout(() => setPageState('preview'), 300);
    }, totalDuration);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [pageState]);

  // Load candidate to canvas and enter editing
  const handleLoadToCanvas = (index: number) => {
    setPreviewCandidateIndex(index);
    initCanvasFromOutfit(candidates[index].outfit);
    setPageState('editing');
    setTrayOpen(false);
  };

  // Enter manual editing
  const handleManualEdit = () => {
    setCanvasItems([]);
    setEditHistory([{ items: [] }]);
    setEditHistoryIndex(0);
    setSelectedItem(null);
    setPageState('editing');
    setTrayOpen(true);
  };

  // Exit editing
  const handleExitEditing = () => {
    setPageState('preview');
    setTrayOpen(false);
    setSelectedItem(null);
  };

  // Add item from tray
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

  // Remove item from canvas
  const handleRemoveFromCanvas = (itemId: string) => {
    const newItems = canvasItems.filter((ci) => ci.itemId !== itemId);
    setCanvasItems(newItems);
    pushEditHistory(newItems);
    setSelectedItem(null);
  };

  // Toggle lock on item
  const handleToggleLock = (itemId: string) => {
    const newItems = canvasItems.map((ci) =>
      ci.itemId === itemId ? { ...ci, locked: !ci.locked } : ci
    );
    setCanvasItems(newItems);
    pushEditHistory(newItems);
  };

  // AI Complete missing slots
  const handleAIComplete = () => {
    const existingCategories = new Set(
      canvasItems.map((ci) => ci.item.category)
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

  // Restore layout
  const handleRestoreLayout = () => {
    const newItems = canvasItems.map((ci, index) => {
      const totalItems = canvasItems.length;
      const cols = Math.min(3, totalItems);
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...ci,
        x: 20 + col * 30,
        y: 15 + row * 35,
      };
    });
    setCanvasItems(newItems);
    pushEditHistory(newItems);
  };

  // Restore size
  const handleRestoreSize = () => {
    if (!selectedItem) return;
    const newItems = canvasItems.map((ci) =>
      ci.id === selectedItem.id ? { ...ci, scale: 1 } : ci
    );
    setCanvasItems(newItems);
    pushEditHistory(newItems);
    setSelectedItem({ ...selectedItem, scale: 1 });
  };

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-background ${pageState === 'editing' ? 'pb-4' : 'pb-24'}`}>
        {/* ==================== CONTEXT BAR (always visible) ==================== */}
        <header className="sticky top-0 z-20 glass-surface border-b border-border/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(pageState === 'preview' || pageState === 'editing') && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageState('empty')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  {pageState === 'editing' ? '编辑搭配' : '搭配'}
                </h1>
                {pageState !== 'empty' && (
                  <p className="text-[10px] text-muted-foreground">
                    上海 · 22-28°C · {pageState === 'loading' ? '生成中' : previewOutfit.occasion}
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

        {/* ==================== PERMANENT OUTFIT AREA ==================== */}
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

            {/* LOADING STATE */}
            {pageState === 'loading' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[48vh] py-8 px-6">
                <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg bg-muted/60" />
                  ))}
                </div>
                <div className="w-full max-w-[280px] space-y-4">
                  <div className="space-y-2.5">
                    {loadingStages.map((stage, index) => (
                      <div key={stage.label} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          index < currentStage
                            ? 'bg-primary text-primary-foreground'
                            : index === currentStage
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground/40'
                        }`}>
                          {index < currentStage ? (
                            <Check className="h-3 w-3" />
                          ) : index === currentStage ? (
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        <span className={`text-xs transition-all duration-300 ${
                          index <= currentStage ? 'text-foreground font-medium' : 'text-muted-foreground/50'
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Progress value={progress} className="h-1.5 rounded-full" />
                </div>
              </div>
            )}

            {/* PREVIEW STATE - 3 candidate thumbnails */}
            {pageState === 'preview' && (
              <div className="flex flex-col h-full min-h-[48vh]">
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">点击方案加载到画布进行编辑</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(candidates || []).map((candidate, index) => (
                        <button
                          key={candidate.id}
                          onClick={() => handleLoadToCanvas(index)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200 hover:shadow-md card-interactive ${
                            index === previewCandidateIndex
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border/30 bg-background/60'
                          }`}
                        >
                          <div className="flex -space-x-1">
                            {(candidate.outfit.items || []).slice(0, 3).map((item, idx) => (
                              item ? (
                              <div key={item.id || idx} className="h-8 w-8 rounded-full bg-muted overflow-hidden border border-background">
                                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                              </div>
                              ) : null
                            ))}
                          </div>
                          <span className={`text-xs font-medium ${
                            index === previewCandidateIndex ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {candidate.label}
                          </span>
                        </button>
                      ))}
                    </div>
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
                onAddFromWardrobe={() => setTrayOpen(true)}
              />
            )}
          </div>
        </div>

        {/* ==================== CONTEXTUAL BOTTOM ACTION AREA ==================== */}
        
        {/* EMPTY STATE actions */}
        {pageState === 'empty' && (
          <div className="px-4 pt-5 space-y-3">
            {/* AI input area - OpenAI style */}
            <div className="relative rounded-xl bg-muted/20 border border-border/30 overflow-hidden">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气..."
                className="min-h-[80px] pr-12 bg-transparent border-none rounded-none text-sm resize-none placeholder:text-muted-foreground/40 focus-visible:ring-0 transition-all"
              />
              {/* Action bar below input */}
              <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    参考图
                  </Button>
                  <div className="h-3 w-px bg-border/40" />
                  {(quickScenarios || []).slice(0, 3).map((scenario) => (
                    <Button
                      key={scenario.label}
                      variant="ghost"
                      size="sm"
                      onClick={() => setInputValue(scenario.label)}
                      className="h-7 px-2.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1"
                    >
                      {iconMap[scenario.icon] || null}
                      {scenario.label}
                    </Button>
                  ))}
                </div>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={handleGenerate}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* AI 帮我搭 & 手动搭一套 - side by side */}
            <div className="flex gap-2">
              <Button
                className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/90 text-sm font-medium btn-primary-glow transition-all"
                onClick={handleGenerate}
                disabled={!inputValue.trim()}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                AI 帮我搭
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-lg text-sm border-border/60 hover:bg-muted/40"
                onClick={handleManualEdit}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                手动搭一套
              </Button>
            </div>
          </div>
        )}

        {/* PREVIEW STATE actions */}
        {pageState === 'preview' && (
          <div className="px-4 pt-4 space-y-3">
            {/* Explanation */}
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-ai-400 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed flex-1">{previewOutfit.explanation}</p>
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
              <Button variant="outline" className="flex-1 h-12 rounded-lg text-sm border-border/60 hover:bg-muted/40" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
            </div>
          </div>
        )}

        {/* EDITING STATE actions */}
        {pageState === 'editing' && (
          <div className="px-4 pt-3 space-y-3">
            {/* Selected item toolbar */}
            {selectedItem && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs text-muted-foreground shrink-0">
                  {selectedItem.item.subCategory}
                </span>
                <div className="h-4 w-px bg-border/40 shrink-0" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs shrink-0"
                      onClick={() => handleToggleLock(selectedItem.itemId)}
                    >
                      {selectedItem.locked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5 mr-1" />
                          取消保留
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                          保留
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{selectedItem.locked ? '取消保留，AI 可以替换' : '保留这件，AI 不会替换'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs shrink-0"
                      onClick={handleRestoreSize}
                    >
                      <MoveHorizontal className="h-3.5 w-3.5 mr-1" />
                      恢复大小
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>重置单品尺寸</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFromCanvas(selectedItem.itemId)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      移除
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>从搭配中移除（不删除衣橱单品）</TooltipContent>
                </Tooltip>
              </div>
            )}

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
                        onClick={handleRestoreLayout}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        恢复排版
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>恢复系统自动布局</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            {/* Complete button */}
            <Button
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-sm"
              onClick={handleExitEditing}
            >
              完成编辑
            </Button>

            {/* Wardrobe Tray */}
            <WardrobeTray
              expanded={trayOpen}
              onToggle={() => setTrayOpen(!trayOpen)}
              existingItemIds={canvasItems.map((ci) => ci.item.id)}
              selectedItems={[]}
              onItemSelect={(item) => handleAddFromTray(item)}
              onItemDeselect={() => {}}
              onConfirmAdd={() => setTrayOpen(false)}
            />
          </div>
        )}

        {/* ==================== SHEETS ==================== */}

        {/* Why Sheet */}
        <Sheet open={showWhy} onOpenChange={setShowWhy}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>推荐理由</SheetTitle>
              <SheetDescription>AI 搭配的关键考量</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">场合匹配</p>
                    <p className="text-xs text-muted-foreground mt-0.5">商务休闲风格，适合办公环境</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">温度适宜</p>
                    <p className="text-xs text-muted-foreground mt-0.5">22-28°C，针织衫厚度适中</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-ai-50 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-ai-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">色彩协调</p>
                    <p className="text-xs text-muted-foreground mt-0.5">米白 + 深蓝 + 棕色，经典配色</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* History Sheet */}
        <Sheet open={showHistory} onOpenChange={setShowHistory}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>历史方案</SheetTitle>
              <SheetDescription>查看之前的搭配记录</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 py-4">
                <p className="text-sm text-muted-foreground text-center py-8">暂无历史方案</p>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* More Menu Sheet */}
        <Sheet open={showMoreMenu} onOpenChange={setShowMoreMenu}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>更多操作</SheetTitle>
            </SheetHeader>
            <div className="space-y-2 py-4">
              <Button variant="ghost" className="w-full justify-start h-11">
                <Check className="h-4 w-4 mr-3" />
                保存搭配
              </Button>
              <Button variant="ghost" className="w-full justify-start h-11">
                <Send className="h-4 w-4 mr-3" />
                分享图片
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
