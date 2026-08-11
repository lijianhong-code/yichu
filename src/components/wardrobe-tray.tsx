"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Search, X, Check, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { wardrobeItems } from "@/lib/mock-data"
import type { WardrobeItem } from "@/lib/mock-data"

// ─── Types ───────────────────────────────────────────────────────────────────

interface WardrobeTrayProps {
  expanded?: boolean
  onToggle?: () => void
  existingItemIds?: string[]
  selectedItems?: WardrobeItem[]
  onItemSelect?: (item: WardrobeItem) => void
  onItemDeselect?: (item: WardrobeItem) => void
  onConfirmAdd?: (items: WardrobeItem[]) => void
  className?: string
}

const CATEGORIES = ["全部", "上装", "下装", "连体", "外套", "鞋", "包", "配饰"]

// ─── Component ───────────────────────────────────────────────────────────────

export function WardrobeTray({
  expanded = false,
  onToggle,
  existingItemIds = [],
  selectedItems = [],
  onItemSelect,
  onItemDeselect,
  onConfirmAdd,
  className,
}: WardrobeTrayProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("全部")

  // Filter items
  const filteredItems = useMemo(() => {
    let items = wardrobeItems.filter(
      (item) => item.status === "available"
    )

    if (activeCategory !== "全部") {
      items = items.filter((item) => item.category === activeCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.primaryColor.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      )
    }

    return items
  }, [activeCategory, searchQuery])

  const isSelected = (item: WardrobeItem) =>
    selectedItems.some((s) => s.id === item.id)

  const isExisting = (itemId: string) => existingItemIds.includes(itemId)

  // Collapsed state - compact handle
  if (!expanded) {
    return (
      <div
        onClick={onToggle}
        className={cn(
          "w-full h-10 flex items-center justify-center gap-2 cursor-pointer",
          "bg-background border-t border-border/30",
          "hover:bg-muted/30 active:bg-muted/50 transition-colors duration-150",
          className
        )}
      >
        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        <span className="text-xs font-medium text-muted-foreground">
          衣橱 ({filteredItems.length})
        </span>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>
    )
  }

  // Expanded state - full tray
  return (
    <div
      className={cn(
        "bg-background border-t border-border/30 flex flex-col",
        "animate-in slide-in-from-bottom duration-200",
        className
      )}
      style={{ height: "45%", minHeight: "220px", maxHeight: "320px" }}
    >
      {/* Compact Header - Combined with collapse handle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 shrink-0">
        {/* Left: Title + Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            衣橱
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {filteredItems.length}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <Button
            variant={searchQuery ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setSearchQuery(searchQuery ? "" : " ")}
            className="w-8 h-8"
            aria-label="搜索"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Add button (when items selected) */}
          {selectedItems.length > 0 && (
            <Button
              size="sm"
              onClick={() => onConfirmAdd?.(selectedItems)}
              className="h-8 px-3 text-xs font-medium"
            >
              添加 ({selectedItems.length})
            </Button>
          )}

          {/* Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-8 h-8"
            aria-label="收起"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Input - Shows when active */}
      {searchQuery && (
        <div className="px-3 py-2 border-b border-border/20 shrink-0">
          <div className="relative">
            <Input
              autoFocus
              placeholder="搜索衣物..."
              value={searchQuery === " " ? "" : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm pl-3 pr-9"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1 w-7 h-7"
              aria-label="清除搜索"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Category Filter - Horizontal scroll */}
      <div className="px-3 py-2 border-b border-border/20 shrink-0">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
      </div>

      {/* Items Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-4 gap-2 p-2">
          {filteredItems.map((item) => {
            const selected = isSelected(item)
            const existing = isExisting(item.id)

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (existing) return
                  if (selected) {
                    onItemDeselect?.(item)
                  } else {
                    onItemSelect?.(item)
                  }
                }}
                disabled={existing}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden transition-all duration-150",
                  "min-h-[72px]", // Ensure minimum touch target
                  existing
                    ? "opacity-30 cursor-not-allowed"
                    : selected
                    ? "ring-2 ring-primary ring-offset-1 scale-95"
                    : "ring-1 ring-border hover:ring-muted-foreground/30 hover:scale-98 active:scale-95"
                )}
                style={{ backgroundColor: "var(--neutral-50)" }}
                aria-label={`${item.name}${existing ? "，已添加" : ""}${selected ? "，已选中" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain p-1.5"
                  draggable={false}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.placeholder-icon')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'placeholder-icon absolute inset-0 flex items-center justify-center text-muted-foreground/50'
                      placeholder.innerHTML = `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`
                      parent.appendChild(placeholder)
                    }
                  }}
                />

                {/* Selected Check */}
                {selected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Already in outfit indicator */}
                {existing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded-full font-medium">
                      已添加
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">没有找到匹配的衣物</p>
          </div>
        )}
      </div>
    </div>
  )
}
