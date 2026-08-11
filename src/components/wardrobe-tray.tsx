"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Search, X, Check } from "lucide-react"
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

  if (!expanded) {
    return (
      <div
        onClick={onToggle}
        className={cn(
          "w-full h-8 flex items-center justify-center gap-2 cursor-pointer",
          "bg-muted/30 border-t border-border/20",
          "hover:bg-muted/50 transition-colors duration-200",
          className
        )}
      >
        {/* Drag Handle */}
        <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        <span className="text-xs text-muted-foreground">展开衣橱</span>
        <svg
          className="w-3 h-3 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border-t border-neutral-200 flex flex-col",
        "animate-in slide-in-from-bottom duration-200",
        className
      )}
      style={{ height: "40%", minHeight: "200px", maxHeight: "300px" }}
    >
      {/* Drag Handle - Click to collapse */}
      <div
        onClick={onToggle}
        className="flex items-center justify-center py-1 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header - Compact */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 shrink-0">
        <span className="text-xs font-medium text-neutral-700">
          衣橱 ({filteredItems.length})
        </span>
        <div className="flex items-center gap-1.5">
          {selectedItems.length > 0 && (
            <Button
              size="sm"
              onClick={() => onConfirmAdd?.(selectedItems)}
              className="h-6 px-2 text-xs"
            >
              添加 ({selectedItems.length})
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-6 h-6"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </Button>
        </div>
      </div>

      {/* Category Filter with Search - Combined Row */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-100 shrink-0">
        {/* Compact Search Button */}
        <Button
          variant={searchQuery ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setSearchQuery(searchQuery ? "" : " ")}
          className="w-7 h-7 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
        
        {/* Search Input - Shows when active */}
        {searchQuery && (
          <div className="relative flex-1">
            <Input
              autoFocus
              placeholder="搜索..."
              value={searchQuery === " " ? "" : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-2 pr-7"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-0 top-0 w-7 h-7"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        {/* Category Tabs */}
        <ScrollArea className="flex-1 whitespace-nowrap">
          <div className="flex gap-1">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "h-6 px-2 rounded-full text-xs whitespace-nowrap",
                  activeCategory === cat && "bg-brand-100 text-brand-700 hover:bg-brand-100/80"
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
        <div className="grid grid-cols-4 gap-1.5 p-2">
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
                  "relative aspect-[4/5] rounded-md overflow-hidden transition-all",
                  existing
                    ? "opacity-30 cursor-not-allowed"
                    : selected
                    ? "ring-2 ring-brand-600 ring-offset-1"
                    : "ring-1 ring-neutral-200 hover:ring-neutral-300"
                )}
                style={{ backgroundColor: "var(--neutral-50)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain p-1"
                  draggable={false}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.placeholder-icon')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'placeholder-icon absolute inset-0 flex items-center justify-center text-neutral-400'
                      placeholder.innerHTML = `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`
                      parent.appendChild(placeholder)
                    }
                  }}
                />

                {/* Selected Check */}
                {selected && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Already in outfit indicator */}
                {existing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="text-[9px] text-white bg-black/50 px-1 py-0.5 rounded">
                      已添加
                    </span>
                  </div>
                )}

                {/* Name tooltip on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-white truncate block">
                    {item.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-neutral-500">
            <p className="text-xs">没有找到匹配的衣物</p>
          </div>
        )}
      </div>
    </div>
  )
}
