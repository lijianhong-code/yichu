"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import { Search, X, Check, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const handleImageError = useCallback((itemId: string) => {
    setFailedImages((prev) => {
      const next = new Set(prev)
      next.add(itemId)
      return next
    })
  }, [])

  // Filter items
  const filteredItems = useMemo(() => {
    let items = wardrobeItems.filter(
      (item) => item.status === "available"
    )

    if (activeCategory !== "全部") {
      items = items.filter((item) => activeCategory === "连体"
        ? item.category === "连体" || item.category === "连衣裙"
        : item.category === activeCategory)
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
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className={cn(
          "w-full h-10 rounded-none flex items-center justify-center gap-2",
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
      </Button>
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
    >
      {/* Combined Filter Bar - Search + Categories in single row */}
      <div className="px-3 py-2 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-2">
          {/* Search toggle - fixed on left */}
          <Button
            variant={searchQuery ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setSearchQuery(searchQuery ? "" : " ")}
            className="w-10 h-10 shrink-0"
            aria-label="搜索"
          >
            {searchQuery ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>

          {/* Search Input - replaces categories when active */}
          {searchQuery ? (
            <Input
              autoFocus
              placeholder="搜索衣物..."
              value={searchQuery === " " ? "" : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-sm flex-1"
            />
          ) : (
            /* Category Filter - Horizontal scroll */
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5 w-max">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "h-10 px-3 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all",
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {cat}
                    <span className="ml-1 text-[10px] opacity-70">
                      {wardrobeItems.filter((i: WardrobeItem) => cat === "全部" || (cat === "连体" ? i.category === "连体" || i.category === "连衣裙" : i.category === cat)).length}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Collapse button - fixed on right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-10 h-10 shrink-0"
            aria-label="收起"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Items Grid - Auto height based on content */}
      <div className="overflow-y-auto overflow-x-hidden max-h-[40vh]">
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
                {failedImages.has(item.id) ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-1.5"
                    draggable={false}
                    onError={() => handleImageError(item.id)}
                  />
                )}

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
