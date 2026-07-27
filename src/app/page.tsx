'use client';

import { useState } from 'react';
import {
  Cloud,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Shirt,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Info,
  ThermometerSun,
  Lock,
  ArrowRightLeft,
  X,
  Briefcase,
  Wine,
  Sun,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { todayOutfit, todayAlternatives, weatherContext, quickScenarios } from '@/lib/mock-data';
import type { WardrobeItem, Outfit } from '@/lib/mock-data';

const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="h-4 w-4" />,
  Wine: <Wine className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
};

export default function HomePage() {
  const [currentAltIndex, setCurrentAltIndex] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [showReplacement, setShowReplacement] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentOutfit = todayAlternatives[currentAltIndex];

  const handlePrevAlt = () => {
    setCurrentAltIndex((prev) => (prev > 0 ? prev - 1 : todayAlternatives.length - 1));
  };

  const handleNextAlt = () => {
    setCurrentAltIndex((prev) => (prev < todayAlternatives.length - 1 ? prev + 1 : 0));
  };

  const handleItemSelect = (item: WardrobeItem) => {
    setSelectedItem(item);
    setShowReplacement(true);
  };

  const handleScenarioClick = (label: string) => {
    setInputValue(label);
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-24">
        {/* Header with weather context */}
        <header className="sticky top-0 z-10 glass-surface border-b border-border/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                下午好，小明
              </p>
              <p className="text-lg font-semibold text-foreground tracking-tight">
                今天穿什么？
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted/80 border border-border/30 transition-all">
                  <ThermometerSun className="h-3.5 w-3.5 text-accent-foreground" />
                  <span className="text-xs font-medium text-foreground">{weatherContext.tempRange}</span>
                  <span className="text-xs text-muted-foreground">{weatherContext.condition}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{weatherContext.city} · 湿度 {weatherContext.humidity}% · UV {weatherContext.uvIndex}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Quick need input */}
        <section className="px-4 pt-4 pb-2">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="今天有什么安排？"
              className="pr-12 h-11 bg-muted/30 border-border/40 rounded-lg text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-background transition-all"
            />
            <Button
              size="icon"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-primary hover:bg-primary/90 shadow-sm"
              onClick={() => inputValue && handleScenarioClick(inputValue)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {/* Quick scenario chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {quickScenarios.map((scenario) => (
              <Button
                key={scenario.label}
                variant="outline"
                size="sm"
                onClick={() => handleScenarioClick(scenario.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 hover:bg-muted border-border/40 text-xs font-medium text-foreground transition-all hover:border-primary/20 whitespace-nowrap"
              >
                {iconMap[scenario.icon]}
                {scenario.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Today's main outfit - the hero section */}
        <section className="px-4 pt-4">
          {/* Outfit stage area */}
          <div className="relative rounded-xl outfit-stage overflow-hidden noise-texture">
            {/* Outfit items display */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {currentOutfit.items.slice(0, 4).map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className="group relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg bg-background border border-border/20 overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:border-primary/20 active:scale-[0.98] card-interactive"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Item label */}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1.5 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
                      <p className="text-[10px] text-white/90 truncate font-medium">{item.subCategory}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit info */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{currentOutfit.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {currentOutfit.explanation}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] font-normal bg-background/60 border-border/30">
                  {currentOutfit.occasion}
                </Badge>
              </div>

              {/* Why button */}
              <button
                onClick={() => setShowWhy(true)}
                className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Info className="h-3 w-3" />
                为什么推荐这套？
              </button>
            </div>

            {/* Navigation arrows */}
            {todayAlternatives.length > 1 && (
              <>
                <button
                  onClick={handlePrevAlt}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full glass-surface border border-border/30 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <button
                  onClick={handleNextAlt}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full glass-surface border border-border/30 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </>
            )}
          </div>

          {/* Alternative indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {todayAlternatives.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAltIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentAltIndex
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>
        </section>

        {/* Decision actions */}
        <section className="px-4 pt-5 flex gap-3">
          <Button
            className="flex-1 h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm btn-primary-glow transition-all"
          >
            <Check className="h-4 w-4 mr-2" />
            今天穿这套
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-lg border-border/60 text-foreground font-medium text-sm hover:bg-muted/60 transition-all"
            onClick={handleNextAlt}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            换一套
          </Button>
        </section>

        {/* Secondary entries */}
        <section className="px-4 pt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-lg bg-muted/20 hover:bg-muted/50 border-border/30 text-foreground transition-all"
          >
            <Shirt className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-xs font-medium">添加衣物</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-lg bg-muted/20 hover:bg-muted/50 border-border/30 text-foreground transition-all"
          >
            <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-xs font-medium">参考图搭配</span>
          </Button>
        </section>

        {/* AI Insight */}
        <section className="px-4 pt-6">
          <Card className="border-border/40 insight-gradient overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-ai-100/80 flex items-center justify-center flex-shrink-0 ai-glow">
                  <Sparkles className="h-4 w-4 text-ai-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ai-600">AI 洞察</p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    你本周穿了 12 件不同的单品，衣橱利用率达到 64%。有 5 件单品超过 2 周没穿，要不要给它们一个亮相的机会？
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Sheet */}
        <Sheet open={showWhy} onOpenChange={setShowWhy}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>为什么推荐这套？</SheetTitle>
              <SheetDescription>基于你的衣橱、天气和偏好生成</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3 stagger-children">
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm font-medium">天气适配</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  22-28°C 多云，这套穿搭透气舒适，适合今天的温度
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">场合适配</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  商务休闲风格，适合日常通勤和办公环境
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">色彩协调</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  白色 + 深蓝 + 棕色，经典配色方案，简洁大方
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ai-600" />
                  <span className="text-sm font-medium">新鲜度</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  有 2 件单品超过一周没穿，帮你唤醒沉睡衣物
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Replacement Drawer */}
        <Sheet open={showReplacement} onOpenChange={setShowReplacement}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>替换单品</SheetTitle>
              <SheetDescription>
                为 {selectedItem?.subCategory} 选择一个替代单品
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {/* Quick directions */}
              <div className="flex flex-wrap gap-2">
                {['更正式', '更休闲', '换个颜色', '更保暖'].map((dir) => (
                  <Button key={dir} variant="outline" size="sm" className="rounded-full text-xs">
                    {dir}
                  </Button>
                ))}
              </div>
              {/* Candidate items */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <button
                    key={i}
                    className="aspect-[3/4] rounded-lg bg-muted/30 border border-border/30 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 glass-surface-strong border-t border-border/30">
              <Button className="w-full h-11 bg-primary hover:bg-primary/90 btn-primary-glow">
                确认替换
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Loading overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse ai-glow">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">正在为你搭配...</p>
              <p className="text-xs text-muted-foreground">从 86 件衣物中筛选</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
