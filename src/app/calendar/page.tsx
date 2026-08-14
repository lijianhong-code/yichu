'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain, Sparkles, Shirt, Plus, RotateCcw, Pencil, Calendar as CalendarIcon, Check, Edit, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useWardrobe } from '@/lib/store';
import { Outfit } from '@/lib/mock-data';
import { toast } from '@/lib/toast';

// Weather icons
const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

// Generate calendar days for a month
function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: Array<{ date: number; isCurrentMonth: boolean; isToday: boolean; dateStr: string } | null> = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(year, month, day);
    days.push({
      date: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dateStr,
    });
  }

  return days;
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const { state, getRecordsByDate, addRecord } = useWardrobe();
  const records = state.records;
  const outfits = state.outfits;

  // Use real current date
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()));
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const calendarDays = useMemo(() => generateCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    const selected = new Date(selectedDate);
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - selected.getDay());

    const days: Array<{ date: number; isToday: boolean; dateStr: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const today = new Date();
      const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      days.push({
        date: d.getDate(),
        isToday: dateStr === formatDateStr(today.getFullYear(), today.getMonth(), today.getDate()),
        dateStr,
      });
    }
    return days;
  }, [selectedDate]);

  const selectedDateRecords = useMemo(() => getRecordsByDate(selectedDate), [selectedDate, getRecordsByDate]);

  // Mock weather data
  const getWeatherForDate = (dateStr: string) => {
    const day = new Date(dateStr).getDate();
    const weathers: Array<'sunny' | 'cloudy' | 'rainy'> = ['sunny', 'cloudy', 'rainy', 'sunny', 'cloudy'];
    return weathers[day % weathers.length];
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleWearToday = () => {
    if (selectedDateRecords.length > 0) {
      toast.info('今天已经记录过穿着了');
      return;
    }
    router.push('/ai-styling');
  };

  const handleRewear = () => {
    if (outfits.length === 0) {
      toast.warning('暂无可重穿的搭配');
      return;
    }
    router.push('/ai-styling');
  };

  const handleRecord = () => {
    setIsRecordSheetOpen(true);
  };

  const handleRecordOutfit = (outfit: Outfit) => {
    addRecord({
      id: `record-${Date.now()}`,
      date: selectedDate,
      outfitId: outfit.id,
      outfit: outfit,
      weather: '晴',
      note: '',
    });
    toast.success('已记录到日历');
  };

  const handleGoToStyling = () => {
    router.push('/ai-styling');
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next month
        handleNextMonth();
      } else {
        // Swipe right - prev month
        handlePrevMonth();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Determine button state based on date
  const isToday = selectedDate === formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const isPast = new Date(selectedDate) < new Date(formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()));
  const isFuture = new Date(selectedDate) > new Date(formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()));
  const hasRecord = selectedDateRecords.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-surface border-b border-border">
        <div className="px-4 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between h-12">
            <div>
              <h1 className="text-lg font-semibold text-foreground">穿着日历</h1>
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(val) => val && setViewMode(val as 'week' | 'month')}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="week">周</ToggleGroupItem>
              <ToggleGroupItem value="month">月</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </header>

      {/* Calendar Section with Swipe */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="px-4"
      >
        {/* Month Navigation */}
        <div className="py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-base font-medium text-foreground">
            {currentYear}年{currentMonth + 1}月
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {viewMode === 'week' ? (
          /* Week View */
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const weather = getWeatherForDate(day.dateStr);
              const WeatherIcon = weatherIcons[weather];
              const dayRecords = getRecordsByDate(day.dateStr);
              const hasWorn = dayRecords.length > 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => {
                    setSelectedDate(day.dateStr);
                  }}
                  className={`flex flex-col items-center py-3 px-1 rounded-lg transition-all relative ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : day.isToday
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-sm font-medium">{day.date}</span>
                  <WeatherIcon className={`w-3 h-3 mt-1 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                  {hasWorn && (
                    <div className="flex gap-0.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    </div>
                  )}
                  {day.isToday && !isSelected && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Month View */
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} />;
              }

              const isSelected = day.dateStr === selectedDate;
              const dayRecords = getRecordsByDate(day.dateStr);
              const hasWorn = dayRecords.length > 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`flex flex-col items-center py-2 rounded-lg transition-all relative ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : day.isToday
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-sm font-medium">{day.date}</span>
                  {hasWorn && (
                    <div className="flex gap-0.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    </div>
                  )}
                  {day.isToday && !isSelected && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Swipe hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">左右滑动切换月份</p>
      </div>

      {/* Date Detail Section */}
      <div className="px-4 mt-6">
        <Card>
          <CardContent className="p-4">
            {/* Date Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-foreground">
                  {formatDateDisplay(selectedDate)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(() => {
                    const weather = getWeatherForDate(selectedDate);
                    const weatherLabels = { sunny: '晴', cloudy: '多云', rainy: '雨' };
                    return `${weatherLabels[weather]} · ${isToday ? '今天' : isPast ? '过去' : '未来'}`;
                  })()}
                </p>
              </div>
              <Badge variant={hasRecord ? 'default' : 'secondary'} className="text-xs">
                {hasRecord ? '已记录' : '未记录'}
              </Badge>
            </div>

            {/* Outfit Display */}
            {hasRecord ? (
              <div className="space-y-3">
                {selectedDateRecords.map((record) => (
                  <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {/* Outfit Preview */}
                    <div className="relative w-16 h-16 rounded-md bg-card overflow-hidden flex-shrink-0">
                      {record.outfit.items.slice(0, 2).map((item, index) => (
                        <div
                          key={item.id}
                          className="absolute inset-0"
                          style={{
                            transform: `translateY(${index * 4}px) scale(${1 - index * 0.1})`,
                            zIndex: 2 - index,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                        </div>
                      ))}
                    </div>

                    {/* Outfit Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {record.outfit.name || '搭配方案'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {record.outfit.items.length} 件单品
                        {record.outfit.occasion && ` · ${record.outfit.occasion}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/empty-calendar.jpeg" alt="暂无记录" className="w-24 h-24 mx-auto mb-3 object-contain opacity-60" />
                <p className="text-sm text-muted-foreground">
                  {isFuture ? '还未到来，敬请期待' : isToday ? '今天还没有记录，快去搭配吧' : '这天没有记录'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              {isFuture ? (
                hasRecord ? (
                  <Button variant="outline" className="flex-1" onClick={handleGoToStyling}>
                    <Pencil className="w-4 h-4 mr-2" />
                    修改搭配
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" onClick={handleGoToStyling}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    为这天搭配
                  </Button>
                )
              ) : isToday ? (
                hasRecord ? (
                  <Button variant="outline" className="flex-1" onClick={handleRewear}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    再穿一次
                  </Button>
                ) : (
                  <Button className="flex-1 bg-primary hover:bg-primary-hover" onClick={handleWearToday}>
                    <Shirt className="w-4 h-4 mr-2" />
                    今天穿什么
                  </Button>
                )
              ) : (
                hasRecord ? (
                  <Button variant="outline" className="flex-1" onClick={handleRewear}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    再穿一次
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" onClick={handleRecord}>
                    <Pencil className="w-4 h-4 mr-2" />
                    补记
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Sheet */}
      <Sheet open={isRecordSheetOpen} onOpenChange={setIsRecordSheetOpen}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>记录穿着 - {formatDateDisplay(selectedDate)}</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">选择今天穿的搭配</p>
            {outfits.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {outfits.slice(0, 6).map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => {
                      addRecord({
                        id: `record-${Date.now()}`,
                        date: selectedDate,
                        outfitId: outfit.id,
                        outfit,
                      });
                      setIsRecordSheetOpen(false);
                      toast.success('已记录穿着');
                    }}
                    className="aspect-[4/5] rounded-lg overflow-hidden bg-muted shadow-card hover:shadow-card-hover transition-all text-left relative"
                  >
                    <div className="relative w-full h-full p-2">
                      {outfit.items.slice(0, 2).map((item, index) => (
                        <div
                          key={item.id}
                          className="absolute inset-2 rounded-md bg-card"
                          style={{
                            transform: `translateY(${index * 4}px) scale(${1 - index * 0.05})`,
                            zIndex: 2 - index,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">{outfit.name || '搭配方案'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/empty-styling.jpeg" alt="暂无搭配" className="w-24 h-24 mx-auto mb-3 object-contain opacity-60" />
                <p className="text-sm text-muted-foreground">暂无搭配方案</p>
                <Button variant="outline" className="mt-3" onClick={() => { setIsRecordSheetOpen(false); handleGoToStyling(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建搭配
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
