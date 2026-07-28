'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Sparkles,
  Library,
  Check,
  X,
  Edit3,
  Copy,
  Trash2,
  Clock,
  Thermometer,
  Cloud,
  Sun,
  CloudRain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  calendarEvents,
  outfits,
  type CalendarEvent,
  type Outfit,
} from '@/lib/mock-data';

type ViewMode = 'week' | 'month';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function getWeatherIcon(condition?: string) {
  if (!condition) return <Thermometer className="h-3.5 w-3.5 text-neutral-500" />;
  if (condition.includes('晴')) return <Sun className="h-3.5 w-3.5 text-amber-500" />;
  if (condition.includes('雨')) return <CloudRain className="h-3.5 w-3.5 text-blue-500" />;
  if (condition.includes('阴')) return <Cloud className="h-3.5 w-3.5 text-neutral-400" />;
  return <Cloud className="h-3.5 w-3.5 text-neutral-400" />;
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert to Monday-based
}

export default function CalendarPage() {
  const today = new Date(2026, 6, 28); // July 28, 2026
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    calendarEvents.forEach((event) => {
      map.set(event.date, event);
    });
    return map;
  }, []);

  const selectedEvent = eventsByDate.get(
    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
  );

  // Week view data
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    startOfWeek.setDate(currentDate.getDate() + diff);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Month view data
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const goToToday = () => {
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventForDate = (date: Date) => {
    return eventsByDate.get(getDateKey(date));
  };

  const isToday = (date: Date) => isSameDay(date, today);

  const isSelected = (date: Date) => isSameDay(date, selectedDate);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'month') {
      setCurrentDate(date);
      setViewMode('week');
    }
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((day) => (
        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
          {day}
        </div>
      ))}
      {weekDays.map((date) => {
        const event = getEventForDate(date);
        const today_flag = isToday(date);
        const selected = isSelected(date);

        return (
          <button
            key={date.toISOString()}
            onClick={() => handleDateClick(date)}
            className={`
              relative flex flex-col items-center py-3 px-1 rounded-lg transition-all duration-150
              ${selected ? 'bg-brand-100' : 'hover:bg-neutral-50'}
              ${today_flag ? 'ring-1 ring-brand-600/30' : ''}
            `}
          >
            <span className={`text-sm font-medium ${today_flag ? 'text-brand-700' : 'text-neutral-900'}`}>
              {date.getDate()}
            </span>
            <div className="mt-1 h-4 w-4">
              {event && getWeatherIcon(event.weather)}
            </div>
            {event && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <div className={`h-1.5 w-1.5 rounded-full ${event.type === 'worn' ? 'bg-brand-600' : 'bg-neutral-400'}`} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((day) => (
        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
          {day}
        </div>
      ))}
      {monthDays.map((date, idx) => {
        if (!date) {
          return <div key={`empty-${idx}`} className="aspect-square" />;
        }

        const event = getEventForDate(date);
        const today_flag = isToday(date);
        const selected = isSelected(date);

        return (
          <button
            key={date.toISOString()}
            onClick={() => handleDateClick(date)}
            className={`
              relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-150
              ${selected ? 'bg-brand-100' : 'hover:bg-neutral-50'}
              ${today_flag ? 'ring-1 ring-brand-600/30' : ''}
            `}
          >
            <span className={`text-xs font-medium ${today_flag ? 'text-brand-700' : 'text-neutral-900'}`}>
              {date.getDate()}
            </span>
            {event && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <div className={`h-1 w-1 rounded-full ${event.type === 'worn' ? 'bg-brand-600' : 'bg-neutral-400'}`} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderDateDetail = () => {
    const dateStr = formatDate(selectedDate);
    const isFuture = selectedDate > today;
    const isPast = selectedDate < today;
    const event = selectedEvent;

    return (
      <div className="space-y-4">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{dateStr}</h3>
            <p className="text-sm text-neutral-500">
              {event?.weather || '22-28°C 多云'}
            </p>
          </div>
          {event && (
            <Badge variant={event.type === 'worn' ? 'default' : 'outline'} className={event.type === 'worn' ? 'bg-brand-100 text-brand-700 border-brand-200' : ''}>
              {event.type === 'worn' ? '已穿' : '计划'}
            </Badge>
          )}
        </div>

        {/* Outfit display */}
        {event?.outfit ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {event.outfit.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="h-12 w-12 rounded-lg border-2 border-white bg-neutral-100 overflow-hidden"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">{event.outfit.name}</p>
                <p className="text-sm text-neutral-500">{event.outfit.occasion} · {event.outfit.style}</p>
              </div>
            </div>
            {event.feedback && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">反馈：</span>{event.feedback}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <CalendarIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">暂无安排</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {isFuture && !event && (
            <>
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                为这天搭配
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => setShowOutfitPicker(true)}
              >
                <Library className="h-4 w-4 mr-2" />
                从搭配库选择
              </Button>
            </>
          )}
          {isFuture && event && (
            <>
              <Button variant="outline" className="w-full" size="lg">
                <Edit3 className="h-4 w-4 mr-2" />
                修改计划
              </Button>
              <Button variant="ghost" className="w-full text-destructive" size="lg">
                <Trash2 className="h-4 w-4 mr-2" />
                移除计划
              </Button>
            </>
          )}
          {!isFuture && !isPast && !event && (
            <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white" size="lg">
              <Check className="h-4 w-4 mr-2" />
              今天穿
            </Button>
          )}
          {!isFuture && !isPast && event && event.type === 'planned' && (
            <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white" size="lg">
              <Check className="h-4 w-4 mr-2" />
              按计划穿了
            </Button>
          )}
          {!isFuture && !isPast && event && event.type === 'worn' && (
            <Button variant="outline" className="w-full" size="lg">
              <Edit3 className="h-4 w-4 mr-2" />
              补充反馈
            </Button>
          )}
          {isPast && event && event.type === 'worn' && (
            <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white" size="lg">
              <Copy className="h-4 w-4 mr-2" />
              再穿一次
            </Button>
          )}
          {isPast && !event && (
            <Button variant="ghost" className="w-full text-neutral-600" size="lg">
              补记
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-25">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-neutral-900">穿搭日历</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToToday}
              className={!isSameDay(currentDate, today) ? 'text-brand-600' : ''}
            >
              <CalendarDays className="h-5 w-5" />
            </Button>
          </div>

          {/* Month/Year selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-600" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <span className="text-base font-medium text-neutral-900">
                {currentDate.getFullYear()}年 {MONTHS[currentDate.getMonth()]}
              </span>
              {viewMode === 'week' ? (
                <CalendarRange className="h-4 w-4 text-neutral-500" />
              ) : (
                <CalendarDays className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            <button
              onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-neutral-600" />
            </button>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600'
              }`}
            >
              周视图
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600'
              }`}
            >
              月视图
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="px-4 py-4">
        {viewMode === 'week' ? renderWeekView() : renderMonthView()}
      </div>

      {/* Date detail section */}
      <div className="px-4 pb-24">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          {renderDateDetail()}
        </div>
      </div>

      {/* Outfit picker sheet */}
      <Sheet open={showOutfitPicker} onOpenChange={setShowOutfitPicker}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>从搭配库选择</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 overflow-y-auto">
            {outfits.map((outfit) => (
              <button
                key={outfit.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-left"
              >
                <div className="flex -space-x-2">
                  {outfit.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="h-10 w-10 rounded-lg border-2 border-white bg-neutral-100 overflow-hidden"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{outfit.name}</p>
                  <p className="text-sm text-neutral-500">{outfit.occasion} · {outfit.style}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
