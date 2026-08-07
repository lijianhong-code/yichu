'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Lock,
  Unlock,
  History,
  MoreHorizontal,
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
  Loader2,
  Star,
  XCircle,
  Share2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { wardrobeItems, quickScenarios } from '@/lib/mock-data';
import type { WardrobeItem, Outfit } from '@/lib/mock-data';
import { useWardrobe } from '@/lib/store';
import { toast } from '@/lib/toast';

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
  { label: '正在从衣橱中筛选', duration: 1200 },
  { label: '正在生成搭配方案', duration: 1000 },
];

// Candidate outfit type (matches API response)
interface CandidateOutfit {
  id: string;
  label: string;
  outfit: {
    name: string;
    explanation: string;
    items: WardrobeItem[];
  };
}

export default function AIStylingPage() {
  const router = useRouter();
  const { addRecord, addOutfit, state } = useWardrobe();
  const [pageState, setPageState] = useState<PageState>('empty');
  const [inputValue, setInputValue] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<CanvasItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Candidate state
  const [candidates, setCandidates] = useState<CandidateOutfit[]>([]);
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // AI Complete state
  const [isAICompleting, setIsAICompleting] = useState(false);
  const [aiCompleteResults, setAiCompleteResults] = useState<{ item: WardrobeItem; reason: string }[]>([]);
  const [showAICompleteResults, setShowAICompleteResults] = useState(false);

  // Canvas / editing state
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<{ items: CanvasItem[] }[]>([]);
  const [editHistoryIndex, setEditHistoryIndex] = useState(-1);

  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewOutfit = candidates[previewCandidateIndex]?.outfit ?? { name: '', explanation: '', items: [] as WardrobeItem[] };

  // Initialize canvas from outfit
  const initCanvasFromOutfit = useCallback((outfit: { name: string; explanation: string; items: WardrobeItem[] }) => {
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

  // Generate - call real AI API
  const handleGenerate = async () => {
    if (!inputValue.trim()) return;
    setPageState('loading');
    setCurrentStage(0);
    setProgress(0);
    setPreviewCandidateIndex(0);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/styling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: inputValue,
          weather: { temperature: 18, condition: '晴转多云', feelsLike: 16 },
          referenceImage: referenceImage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI 服务返回 ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.candidates?.length > 0) {
        const apiCandidates: CandidateOutfit[] = data.candidates.map((c: {
          id: string;
          label: string;
          outfit: { name: string; explanation: string; items: WardrobeItem[] };
        }) => ({
          id: c.id,
          label: c.label,
          outfit: {
            name: c.outfit.name,
            explanation: c.outfit.explanation,
            items: c.outfit.items,
          },
        }));

        setCandidates(apiCandidates);
        setProgress(100);
        setPageState('preview');
      } else {
        throw new Error(data.error || 'AI 未能生成搭配方案');
      }
    } catch (error) {
      console.error('[AI Styling] Error:', error);
      setAiError(error instanceof Error ? error.message : 'AI 搭配生成失败，请重试');
      setPageState('empty');
    }
  };

  // Cancel loading
  const handleCancelLoading = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelLoading = () => {
    setShowCancelDialog(false);
    setPageState('empty');
    setProgress(0);
    setCurrentStage(0);
  };

  // Loading animation (progress bar only, API controls state transition)
  useEffect(() => {
    if (pageState !== 'loading') return;

    let totalElapsed = 0;
    const totalDuration = loadingStages.reduce((sum, s) => sum + s.duration, 0);

    const timers = loadingStages.map((stage, index) => {
      return setTimeout(() => {
        setCurrentStage(index);
        totalElapsed = loadingStages.slice(0, index + 1).reduce((sum, s) => sum + s.duration, 0);
        setProgress(Math.round((totalElapsed / totalDuration) * 90));
      }, loadingStages.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [pageState]);

  // Load candidate to canvas and enter editing
  const handleLoadToCanvas = (index: number) => {
    setPreviewCandidateIndex(index);
    initCanvasFromOutfit(candidates[index].outfit);
    setPageState('editing');
    setTrayOpen(false);
  };

  // Open wardrobe tray for manual selection
  const handleOpenTray = () => {
    setTrayOpen(true);
  };

  // Exit editing - check for unsaved changes
  const handleExitEditing = () => {
    const hasChanges = canvasItems.length > 0 && editHistoryIndex > 0;
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      doExitEditing();
    }
  };

  const doExitEditing = () => {
    setPageState('preview');
    setTrayOpen(false);
    setSelectedItem(null);
    setShowUnsavedDialog(false);
  };

  const handleDiscardChanges = () => {
    if (candidates[previewCandidateIndex]) {
      initCanvasFromOutfit(candidates[previewCandidateIndex].outfit);
    }
    doExitEditing();
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
  const handleAIComplete = async () => {
    if (canvasItems.length === 0) return;

    setIsAICompleting(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItemIds: canvasItems.map((ci) => ci.item.id),
          style: inputValue || '日常',
        }),
      });

      if (!response.ok) throw new Error('AI 补全请求失败');

      const data = await response.json();

      if (data.success && data.suggestions?.length > 0) {
        const newItems = [...canvasItems];
        const results: { item: WardrobeItem; reason: string }[] = [];
        
        data.suggestions.forEach((s: { item: WardrobeItem; reason: string }) => {
          const suggested = s.item;
          if (!newItems.some((ni) => ni.item.id === suggested.id)) {
            newItems.push({
              id: `canvas-${suggested.id}`,
              itemId: suggested.id,
              item: suggested,
              x: 20 + (newItems.length % 3) * 30,
              y: 15 + Math.floor(newItems.length / 3) * 35,
              scale: 1,
              locked: false,
              zIndex: newItems.length,
              isAISuggested: true,
            });
            results.push({ item: suggested, reason: s.reason || 'AI 推荐搭配' });
          }
        });
        
        setCanvasItems(newItems);
        pushEditHistory(newItems);
        setAiCompleteResults(results);
        setShowAICompleteResults(true);
        
        setTimeout(() => setShowAICompleteResults(false), 5000);
      } else {
        setAiError('AI 没有找到合适的补充单品');
      }
    } catch (error) {
      console.error('[AI Complete] Error:', error);
      setAiError('AI 补全失败，已使用规则匹配');
      
      const existingCategories = new Set(canvasItems.map((ci) => ci.item.category));
      const neededCategories = ['下装', '鞋', '外套', '包'].filter((c) => !existingCategories.has(c));

      const newItems = [...canvasItems];
      neededCategories.forEach((cat) => {
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
    } finally {
      setIsAICompleting(false);
    }
  };

  // Undo AI complete
  const handleUndoAIComplete = () => {
    const nonAISuggested = canvasItems.filter(item => !item.isAISuggested);
    setCanvasItems(nonAISuggested);
    pushEditHistory(nonAISuggested);
    setShowAICompleteResults(false);
    setAiCompleteResults([]);
  };

  // "今天穿" - mark current outfit as worn today
  const handleWearToday = () => {
    let outfitItems: WardrobeItem[] = [];
    let outfitName = '';
    let outfitId = '';

    if (pageState === 'preview' && candidates[previewCandidateIndex]) {
      outfitItems = candidates[previewCandidateIndex].outfit.items;
      outfitName = candidates[previewCandidateIndex].outfit.name;
      outfitId = candidates[previewCandidateIndex].id;
    } else if (pageState === 'editing' && canvasItems.length > 0) {
      outfitItems = canvasItems.map(ci => ci.item);
      outfitName = '我的搭配';
      outfitId = 'manual';
    } else {
      return;
    }

    const outfit: Outfit = {
      id: outfitId,
      name: outfitName,
      items: outfitItems,
      occasion: 'daily',
      style: '日常',
      season: '春夏',
      source: 'ai_text',
      createdAt: new Date().toISOString().split('T')[0],
      explanation: '',
    };

    addOutfit(outfit);
    const today = new Date().toISOString().split('T')[0];
    addRecord({
      id: `record-${Date.now()}`,
      date: today,
      outfitId,
      outfit,
    });

    toast.success('已记录今天穿搭', outfitName);
  };

  // Save outfit
  const handleSaveOutfit = () => {
    const outfitData = pageState === 'editing'
      ? { name: candidates[previewCandidateIndex]?.outfit?.name || '我的搭配', explanation: '', items: canvasItems.map((ci) => ci.item) }
      : candidates[previewCandidateIndex]?.outfit;

    if (!outfitData) return;

    const outfit: Outfit = {
      id: `outfit-${Date.now()}`,
      name: outfitData.name,
      explanation: outfitData.explanation || '',
      items: outfitData.items,
      occasion: 'daily',
      style: '日常',
      season: '春夏',
      source: 'ai_text',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addOutfit(outfit);
    setShowMoreMenu(false);
    toast.success('已保存搭配', outfitData.name);
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

  // Handle reference image upload
  const handleReferenceImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
        toast.success('参考图已上传', 'AI 将参考这张图片进行搭配');
      };
      reader.readAsDataURL(file);
    }
  };

  // Share outfit as image
  const handleShareImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 750;
      const h = 1000;
      canvas.width = w;
      canvas.height = h;

      // Background
      ctx.fillStyle = '#F7F8F6';
      ctx.fillRect(0, 0, w, h);

      // Title
      ctx.fillStyle = '#181C1A';
      ctx.font = 'bold 32px -apple-system, sans-serif';
      ctx.fillText('我的穿搭', 40, 60);

      // Outfit name
      ctx.fillStyle = '#5D665F';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText(previewOutfit.name || 'AI 搭配方案', 40, 100);

      // Draw item images
      const items = previewOutfit.items;
      const imgSize = 180;
      const gap = 20;
      const startX = 40;
      const startY = 140;

      for (let i = 0; i < Math.min(items.length, 6); i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = startX + col * (imgSize + gap);
        const y = startY + row * (imgSize + gap + 30);

        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = items[i].imageUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, imgSize, imgSize);
              resolve();
            };
            img.onerror = () => resolve();
          });
        } catch {
          ctx.fillStyle = '#ECEFEB';
          ctx.fillRect(x, y, imgSize, imgSize);
        }

        ctx.fillStyle = '#181C1A';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText(items[i].name, x, y + imgSize + 18);
      }

      // Footer
      ctx.fillStyle = '#858E87';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText('衣橱助手 · AI 智能搭配', 40, h - 40);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `outfit-${previewOutfit.name || 'share'}.png`;
      link.href = dataUrl;
      link.click();

      setShowMoreMenu(false);
      toast.success('已生成分享图片');
    } catch {
      toast.error('生成分享图片失败');
    }
  };

  // Load historical record into canvas
  const handleLoadHistory = (record: typeof state.records[0]) => {
    const items: CanvasItem[] = record.outfit.items.map((wardrobeItem, index) => {
      const totalItems = record.outfit.items.length;
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
    setShowHistory(false);
    setPageState('editing');
    toast.success('已加载历史搭配', record.date);
  };

  // Calculate outfit rating
  const calculateRating = () => {
    if (!previewOutfit.items.length) return 0;
    // Simple rating based on item count and variety
    const categories = new Set(previewOutfit.items.map(i => i.category));
    const varietyScore = Math.min(categories.size / 4, 1) * 2;
    const completenessScore = Math.min(previewOutfit.items.length / 3, 1) * 3;
    return Math.round((varietyScore + completenessScore) * 10) / 10;
  };

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* ==================== SIMPLIFIED HEADER ==================== */}
        <header className="shrink-0 glass-surface border-b border-border/30">
          <div className="px-4 pt-[env(safe-area-inset-top)] pb-2">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-3">
                {(pageState === 'preview' || canvasItems.length > 0) && (
                  <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => { setPageState('empty'); setCanvasItems([]); }}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  搭配
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setShowHistory(true)}>
                  <History className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setShowMoreMenu(true)}>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ==================== CANVAS AREA (沉浸式) ==================== */}
        <div className="flex-1 min-h-0 px-3 pt-2 pb-2 flex flex-col">
          {/* Scene info tag */}
          {(pageState !== 'empty' || canvasItems.length > 0) && (
            <div className="flex items-center justify-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
                <span>上海 · 22-28°C</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span>{pageState === 'loading' ? '生成中' : (previewOutfit as { occasion?: string }).occasion || '日常'}</span>
              </div>
            </div>
          )}
          
          <div className={`flex-1 min-h-0 rounded-2xl outfit-stage noise-texture relative overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-98' : ''}`}>
            {/* Empty state illustration */}
            {pageState === 'empty' && !candidates.length && canvasItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <img src="/empty-styling.jpeg" alt="" className="w-28 h-28 object-contain opacity-50 mb-4" />
                <p className="text-sm text-muted-foreground text-center">描述你的需求，AI 将为你智能搭配</p>
              </div>
            )}

            {/* CANVAS - Always visible */}
            <OutfitCanvas
              initialItems={pageState === 'editing' ? canvasItems : pageState === 'preview' ? (candidates[previewCandidateIndex]?.outfit.items || []).map((item, idx) => {
                const totalItems = (candidates[previewCandidateIndex]?.outfit.items || []).length;
                const cols = Math.min(3, totalItems);
                const row = Math.floor(idx / cols);
                const col = idx % cols;
                return { id: `${item.id}-${idx}`, itemId: item.id, item, x: 15 + col * 28, y: 10 + row * 35, scale: 1, locked: false, zIndex: idx };
              }) : []}
              editable={pageState === 'editing' || canvasItems.length > 0}
              onSave={(items) => {
                setCanvasItems(items);
                pushEditHistory(items);
              }}
              onAddFromWardrobe={() => setTrayOpen(true)}
            />
            
            {/* OVERLAY: Loading state */}
            {pageState === 'loading' && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center py-8 px-6 z-10">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-muted-foreground"
                    onClick={handleCancelLoading}
                  >
                    取消生成
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== CONTEXTUAL BOTTOM ACTION AREA ==================== */}
        
        {/* EMPTY STATE Actions - only show AI input when truly empty (no canvas items) */}
        {pageState === 'empty' && canvasItems.length === 0 && (
          <div className="shrink-0 px-3 pt-2 pb-3 space-y-2 border-t border-border/20 bg-background/80 backdrop-blur-sm">
            {/* AI error message */}
            {aiError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{aiError}</span>
                <button onClick={() => setAiError(null)} className="text-destructive/60 hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* AI input area - OpenAI style */}
            <div className="relative rounded-xl bg-muted/20 border border-border/30 overflow-hidden">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="描述你的需求，如：明天去客户公司，正式但不要太老气..."
                className="min-h-[60px] max-h-[120px] pr-12 bg-transparent border-none rounded-none text-sm resize-none placeholder:text-muted-foreground/40 focus-visible:ring-0 transition-all"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              {/* Action bar below input */}
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2.5 rounded-full text-xs gap-1 ${referenceImage ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                    onClick={handleReferenceImageClick}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {referenceImage ? '已添加' : '参考图'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="h-3.5 w-px bg-border/40" />
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {(quickScenarios || []).map((scenario) => (
                      <Button
                        key={scenario.label}
                        variant="ghost"
                        size="sm"
                        onClick={() => setInputValue(scenario.label)}
                        className="h-8 px-2.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1 shrink-0"
                      >
                        {iconMap[scenario.icon] || null}
                        {scenario.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 shadow-sm shrink-0"
                  onClick={handleGenerate}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Manual styling entry */}
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg text-sm border-border/60 hover:bg-muted/40"
              onClick={handleOpenTray}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              手动搭配
            </Button>
          </div>
        )}

        {/* MANUAL MODE Actions - minimal toolbar when canvas has items but not in editing/preview state */}
        {pageState === 'empty' && canvasItems.length > 0 && (
          <div className="shrink-0 px-3 pt-2 pb-3 border-t border-border/20 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 flex-1 rounded-lg text-sm border-border/60 hover:bg-muted/40"
                onClick={handleOpenTray}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                添加单品
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/60 hover:bg-muted/40"
                onClick={handleUndo}
                disabled={editHistoryIndex <= 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/60 hover:bg-muted/40"
                onClick={handleRedo}
                disabled={editHistoryIndex >= editHistory.length - 1}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                className="h-10 px-4 rounded-lg text-sm btn-primary-glow"
                onClick={() => { setPageState('editing'); }}
              >
                <Save className="h-4 w-4 mr-1.5" />
                保存
              </Button>
            </div>
          </div>
        )}

        {/* PREVIEW STATE ACTIONS - Card-based display */}
        {pageState === 'preview' && (
          <div className="shrink-0 px-3 pt-2 pb-3 space-y-2 border-t border-border/20 bg-background/80 backdrop-blur-sm">
            {/* Candidate cards - horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {(candidates || []).map((candidate, index) => (
                <button
                  key={candidate.id}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setPreviewCandidateIndex(index);
                      setIsTransitioning(false);
                    }, 150);
                  }}
                  className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 hover:shadow-md card-interactive shrink-0 min-w-[140px] ${
                    index === previewCandidateIndex
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/30 bg-background/60'
                  }`}
                >
                  <div className="flex -space-x-1.5">
                    {(candidate.outfit.items || []).slice(0, 3).map((item, idx) => (
                      item ? (
                        <div key={item.id || idx} className="h-9 w-9 rounded-full bg-muted overflow-hidden border-2 border-background">
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null
                    ))}
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-medium block ${
                      index === previewCandidateIndex ? 'text-primary' : 'text-foreground'
                    }`}>
                      {candidate.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {candidate.outfit.items?.length || 0} 件单品
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* AI Rating & Explanation Card */}
            <div className="rounded-2xl bg-muted/30 border border-border/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(calculateRating() / 2)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">AI 推荐指数 {calculateRating().toFixed(1)}</span>
              </div>

              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-ai-400 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed flex-1">{previewOutfit.explanation}</p>
              </div>
              
              <button
                onClick={() => setShowWhy(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                查看推荐理由
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Main actions */}
            <div className="flex gap-3">
              <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-sm btn-primary-glow transition-all" onClick={handleWearToday}>
                <Check className="h-4 w-4 mr-2" />
                今天穿这套
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl text-sm border-border/60 hover:bg-muted/40" onClick={() => { initCanvasFromOutfit(previewOutfit); setPageState('editing'); }}>
                <Pencil className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </div>
            <Button variant="ghost" className="w-full h-11 text-sm text-muted-foreground rounded-xl" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重新生成
            </Button>
          </div>
        )}

        {/* EDITING STATE ACTIONS - show when in editing state OR tray is open */}
        {(pageState === 'editing' || trayOpen) && (
          <div className="shrink-0 px-3 pt-2 pb-3 space-y-2 border-t border-border/20 bg-background/80 backdrop-blur-sm">
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
                        disabled={isAICompleting || canvasItems.length === 0}
                      >
                        {isAICompleting ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-ai-400" />
                        ) : (
                          <SparklesIcon className="h-3.5 w-3.5 mr-1 text-ai-400" />
                        )}
                        {isAICompleting ? 'AI 思考中...' : 'AI 补全'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>AI 补充缺失槽位</TooltipContent>
                  </Tooltip>

                  {/* Undo AI Complete button - shows after AI complete */}
                  {showAICompleteResults && aiCompleteResults.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-lg text-xs shrink-0 text-muted-foreground"
                      onClick={handleUndoAIComplete}
                    >
                      <Undo2 className="h-3.5 w-3.5 mr-1" />
                      撤销补全
                    </Button>
                  )}

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
              保存搭配
            </Button>

            {/* AI Complete Results Notification */}
            {showAICompleteResults && aiCompleteResults.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-ai-50 border border-ai-100 rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <SparklesIcon className="h-3.5 w-3.5 text-ai-400" />
                      <span className="text-xs font-medium text-ai-600">AI 已添加 {aiCompleteResults.length} 件单品</span>
                    </div>
                    <button
                      onClick={() => setShowAICompleteResults(false)}
                      className="text-xs text-ai-600/60 hover:text-ai-600"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {aiCompleteResults.map((result, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-foreground font-medium shrink-0">{result.item.name}</span>
                        <span className="text-muted-foreground line-clamp-1">{result.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

        {/* Unsaved Changes Confirmation Dialog */}
        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <DialogContent className="sm:max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base">放弃修改？</DialogTitle>
              <DialogDescription>
                当前搭配有未保存的修改，确定要放弃吗？
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg"
                onClick={() => setShowUnsavedDialog(false)}
              >
                继续编辑
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 rounded-lg"
                onClick={handleDiscardChanges}
              >
                放弃修改
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Loading Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base">取消生成？</DialogTitle>
              <DialogDescription>
                确定要取消当前的 AI 搭配生成吗？
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg"
                onClick={() => setShowCancelDialog(false)}
              >
                继续生成
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 rounded-lg"
                onClick={confirmCancelLoading}
              >
                取消生成
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                {/* Show actual AI explanation */}
                {previewOutfit.explanation && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-foreground leading-relaxed">{previewOutfit.explanation}</p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">场合匹配</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {previewOutfit.explanation ? '根据你描述的需求进行匹配' : '根据日常场景进行搭配'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">温度适宜</p>
                    <p className="text-xs text-muted-foreground mt-0.5">根据当前天气选择合适的厚度</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-ai-50 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-ai-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">色彩协调</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI 分析了单品的色彩搭配关系</p>
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
                {state.records.length > 0 ? (
                  state.records.slice(0, 20).map((record) => (
                    <button
                      key={record.id}
                      onClick={() => handleLoadHistory(record)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 w-full text-left hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-md bg-card overflow-hidden flex-shrink-0">
                        {record.outfit.items[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={record.outfit.items[0].imageUrl} alt="" className="w-full h-full object-contain p-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{record.date}</p>
                        <p className="text-xs text-muted-foreground">{record.outfit.items.length} 件单品 · {record.outfit.name || '搭配方案'}</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <img src="/empty-calendar.jpeg" alt="" className="w-24 h-24 object-contain opacity-60 mb-4" />
                    <p className="text-sm text-muted-foreground">暂无历史方案</p>
                  </div>
                )}
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
              <Button variant="ghost" className="w-full justify-start h-11" onClick={handleSaveOutfit}>
                <Check className="h-4 w-4 mr-3" />
                保存搭配
              </Button>
              <Button variant="ghost" className="w-full justify-start h-11" onClick={handleShareImage}>
                <Share2 className="h-4 w-4 mr-3" />
                分享图片
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
