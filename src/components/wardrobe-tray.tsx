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
      <button
        onClick={onToggle}
        className={cn(
          "w-full py-3 px-4 flex items-center justify-center gap-2",
          "bg-white border-t border-neutral-200",
          "text-sm text-neutral-600 hover:text-neutral-900 transition-colors",
          className
        )}
      >
        <span>展开衣橱托盘</span>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border-t border-neutral-200 flex flex-col",
        "animate-in slide-in-from-bottom duration-200",
        className
      )}
      style={{ maxHeight: "40vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100">
        <span className="text-sm font-medium text-neutral-900">
          从衣橱添加
        </span>
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <Button
              size="sm"
              onClick={() => onConfirmAdd?.(selectedItems)}
              className="h-7 px-3 text-xs"
            >
              添加所选 ({selectedItems.length})
            </Button>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="搜索衣物..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-neutral-50 border-neutral-200 text-sm"
          />
        </div>
      </div>

      {/* Category Filter */}
      <ScrollArea className="w-full whitespace-nowrap border-b border-neutral-100">
        <div className="flex gap-1.5 px-4 py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-brand-100 text-brand-700"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>

      {/* Items Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-4 gap-2 p-4">
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
                  className="w-full h-full object-contain p-1.5"
                  draggable={false}
                />

                {/* Selected Check */}
                {selected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Already in outfit indicator */}
                {existing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-500 bg-white/80 px-1.5 py-0.5 rounded">
                      已添加
                    </span>
                  </div>
                )}

                {/* Name tooltip on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-1.5 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white truncate block">
                    {item.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
            <p className="text-sm">没有找到匹配的衣物</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
