"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Lock,
  Unlock,
  RotateCcw,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { WardrobeItem } from "@/lib/mock-data"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CanvasItem {
  id: string
  itemId: string
  item: WardrobeItem
  x: number // percentage 0-100
  y: number // percentage 0-100
  scale: number // 0.7 - 1.3
  locked: boolean
  zIndex: number
  isAISuggested?: boolean
}

interface AlignmentGuide {
  type: "center-v" | "center-h" | "edge-left" | "edge-right" | "edge-top" | "edge-bottom"
  position: number // percentage
}

interface CanvasHistoryEntry {
  items: CanvasItem[]
}

export interface OutfitCanvasProps {
  initialItems: CanvasItem[]
  onSave?: (items: CanvasItem[]) => void
  onAIComplete?: (lockedIds: string[]) => void
  onAddFromWardrobe?: () => void
  onReplaceItem?: (itemId: string) => void
  onSelectionChange?: (itemId: string | null) => void
  editable?: boolean
  className?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_SCALE = 0.7
const MAX_SCALE = 1.3
const MAX_OBJECTS = 12
const MAX_HISTORY = 20
const SNAP_THRESHOLD = 6 // px equivalent in percentage (~1.5%)
const ITEM_DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  "上装": { w: 35, h: 30 },
  "下装": { w: 30, h: 35 },
  "连体": { w: 35, h: 50 },
  "外套": { w: 38, h: 35 },
  "鞋": { w: 25, h: 20 },
  "包": { w: 20, h: 22 },
  "配饰": { w: 15, h: 15 },
}

// ─── Auto Layout ─────────────────────────────────────────────────────────────

function computeAutoLayout(items: Omit<CanvasItem, "x" | "y" | "zIndex" | "scale">[]): CanvasItem[] {
  const slots = items.map((item, index) => {
    const category = item.item.category
    const size = ITEM_DEFAULT_SIZES[category] || { w: 25, h: 25 }
    return { ...item, size }
  })

  // Layout: top to bottom by category order
  const layoutOrder = ["外套", "上装", "连体", "下装", "鞋", "包", "配饰"]
  slots.sort((a, b) => {
    const aIdx = layoutOrder.indexOf(a.item.category)
    const bIdx = layoutOrder.indexOf(b.item.category)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  const centerX = 50
  let currentY = 8

  return slots.map((slot, index) => {
    const x = centerX - slot.size.w / 2
    const y = currentY
    currentY += slot.size.h + 3

    return {
      ...slot,
      x,
      y,
      scale: 1,
      zIndex: index + 1,
    }
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OutfitCanvas({
  initialItems,
  onSave,
  onAIComplete,
  onAddFromWardrobe,
  onReplaceItem,
  onSelectionChange,
  editable = false,
  className,
}: OutfitCanvasProps) {
  const [items, setItems] = useState<CanvasItem[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guides, setGuides] = useState<AlignmentGuide[]>([])
  const [history, setHistory] = useState<CanvasHistoryEntry[]>([{ items: initialItems }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isScaling, setIsScaling] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; itemX: number; itemY: number } | null>(null)
  const scaleStartRef = useRef<{ x: number; scale: number } | null>(null)
  const guidesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null)

  // Sync selection state with parent
  useEffect(() => {
    onSelectionChange?.(selectedId)
  }, [selectedId, onSelectionChange])

  const selectedItem = items.find((i) => i.id === selectedId)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  const hasCompleteOutfit = items.some(
    (i) => ["上装", "下装", "连体", "外套"].includes(i.item.category)
  )

  // ─── History Management ──────────────────────────────────────────────────

  const pushHistory = useCallback(
    (newItems: CanvasItem[]) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1)
        const next = [...truncated, { items: newItems }].slice(-MAX_HISTORY)
        return next
      })
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
    },
    [historyIndex]
  )

  const undo = useCallback(() => {
    if (!canUndo) return
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    setItems(history[newIndex].items)
    setSelectedId(null)
  }, [canUndo, historyIndex, history])

  const redo = useCallback(() => {
    if (!canRedo) return
    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)
    setItems(history[newIndex].items)
    setSelectedId(null)
  }, [canRedo, historyIndex, history])

  // ─── Item Operations ─────────────────────────────────────────────────────

  const updateItem = useCallback(
    (id: string, updates: Partial<CanvasItem>, recordHistory = true) => {
      setItems((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        if (recordHistory) pushHistory(next)
        return next
      })
    },
    [pushHistory]
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id)
        pushHistory(next)
        return next
      })
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId, pushHistory]
  )

  const toggleLock = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id)
      if (item) updateItem(id, { locked: !item.locked })
    },
    [items, updateItem]
  )

  const restoreSize = useCallback(
    (id: string) => {
      updateItem(id, { scale: 1 })
    },
    [updateItem]
  )

  const restoreLayout = useCallback(() => {
    const laid = computeAutoLayout(
      items.map(({ id, itemId, item, locked, isAISuggested }) => ({
        id,
        itemId,
        item,
        locked,
        isAISuggested,
      }))
    )
    // Preserve lock state
    const withLocks = laid.map((newItem) => {
      const existing = items.find((i) => i.itemId === newItem.itemId)
      return { ...newItem, locked: existing?.locked ?? false }
    })
    setItems(withLocks)
    pushHistory(withLocks)
    setSelectedId(null)
  }, [items, pushHistory])

  // ─── Alignment Detection ─────────────────────────────────────────────────

  const detectAlignment = useCallback(
    (draggedId: string, newX: number, newY: number) => {
      const dragged = items.find((i) => i.id === draggedId)
      if (!dragged) return []

      const draggedSize = ITEM_DEFAULT_SIZES[dragged.item.category] || { w: 25, h: 25 }
      const draggedCenterX = newX + (draggedSize.w * dragged.scale) / 2
      const draggedCenterY = newY + (draggedSize.h * dragged.scale) / 2
      const canvasCenterX = 50
      const canvasCenterY = 50

      const newGuides: AlignmentGuide[] = []
      const threshold = 2 // percentage

      // Vertical center alignment
      if (Math.abs(draggedCenterX - canvasCenterX) < threshold) {
        newGuides.push({ type: "center-v", position: canvasCenterX })
      }

      // Horizontal center alignment
      if (Math.abs(draggedCenterY - canvasCenterY) < threshold) {
        newGuides.push({ type: "center-h", position: canvasCenterY })
      }

      // Edge alignment with other items
      items.forEach((other) => {
        if (other.id === draggedId) return
        const otherSize = ITEM_DEFAULT_SIZES[other.item.category] || { w: 25, h: 25 }
        const otherLeft = other.x
        const otherRight = other.x + otherSize.w * other.scale
        const otherTop = other.y
        const otherBottom = other.y + otherSize.h * other.scale

        const draggedLeft = newX
        const draggedRight = newX + draggedSize.w * dragged.scale
        const draggedTop = newY
        const draggedBottom = newY + draggedSize.h * dragged.scale

        if (Math.abs(draggedLeft - otherLeft) < threshold) {
          newGuides.push({ type: "edge-left", position: otherLeft })
        }
        if (Math.abs(draggedRight - otherRight) < threshold) {
          newGuides.push({ type: "edge-right", position: otherRight })
        }
        if (Math.abs(draggedTop - otherTop) < threshold) {
          newGuides.push({ type: "edge-top", position: otherTop })
        }
        if (Math.abs(draggedBottom - otherBottom) < threshold) {
          newGuides.push({ type: "edge-bottom", position: otherBottom })
        }
      })

      return newGuides
    },
    [items]
  )

  // ─── Drag Handling ───────────────────────────────────────────────────────

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg) {
        setSelectedId(null)
        setGuides([])
      }
    },
    []
  )

  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (!editable) return
      e.stopPropagation()
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      setSelectedId(itemId)
      setIsDragging(true)

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        itemX: item.x,
        itemY: item.y,
      }
    },
    [editable, items]
  )

  const handleScaleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editable || !selectedItem) return
      e.stopPropagation()
      setIsScaling(true)
      scaleStartRef.current = {
        x: e.clientX,
        scale: selectedItem.scale,
      }
    },
    [editable, selectedItem]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isScaling) return

      // Store latest position for RAF processing
      lastMoveRef.current = { x: e.clientX, y: e.clientY }

      // Schedule RAF if not already scheduled
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          const pos = lastMoveRef.current
          if (!pos) return

          if (isDragging && dragStartRef.current && selectedId) {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return

            const dx = ((pos.x - dragStartRef.current.x) / rect.width) * 100
            const dy = ((pos.y - dragStartRef.current.y) / rect.height) * 100

            let newX = dragStartRef.current.itemX + dx
            let newY = dragStartRef.current.itemY + dy

            // Clamp to canvas bounds
            const item = items.find((i) => i.id === selectedId)
            if (item) {
              const size = ITEM_DEFAULT_SIZES[item.item.category] || { w: 25, h: 25 }
              newX = Math.max(0, Math.min(100 - size.w * item.scale, newX))
              newY = Math.max(0, Math.min(100 - size.h * item.scale, newY))
            }

            setItems((prev) =>
              prev.map((i) => (i.id === selectedId ? { ...i, x: newX, y: newY } : i))
            )

            // Detect alignment
            const newGuides = detectAlignment(selectedId, newX, newY)
            setGuides(newGuides)
          }

          if (isScaling && scaleStartRef.current && selectedId) {
            const dx = pos.x - scaleStartRef.current.x
            const scaleDelta = dx / 200 // sensitivity
            const newScale = Math.max(
              MIN_SCALE,
              Math.min(MAX_SCALE, scaleStartRef.current.scale + scaleDelta)
            )
            setItems((prev) =>
              prev.map((i) => (i.id === selectedId ? { ...i, scale: newScale } : i))
            )
          }
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging && selectedId) {
        const currentItem = items.find((i) => i.id === selectedId)
        if (currentItem) {
          pushHistory(items)
        }
        // Hide guides after 300ms
        if (guidesTimeoutRef.current) clearTimeout(guidesTimeoutRef.current)
        guidesTimeoutRef.current = setTimeout(() => setGuides([]), 300)
      }
      if (isScaling && selectedId) {
        pushHistory(items)
      }
      setIsDragging(false)
      setIsScaling(false)
      dragStartRef.current = null
      scaleStartRef.current = null
    }

    if (isDragging || isScaling) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isDragging, isScaling, selectedId, items, detectAlignment, pushHistory])

  // ─── Touch Handling (WeChat Mobile Support) ──────────────────────────────

  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg) {
        setSelectedId(null)
        setGuides([])
      }
    },
    []
  )

  const handleItemTouchStart = useCallback(
    (e: React.TouchEvent, itemId: string) => {
      if (!editable) return
      e.stopPropagation()
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      setSelectedId(itemId)
      setIsDragging(true)

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const touch = e.touches[0]
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        itemX: item.x,
        itemY: item.y,
      }
    },
    [editable, items]
  )

  const handleScaleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!editable || !selectedItem) return
      e.stopPropagation()
      setIsScaling(true)
      const touch = e.touches[0]
      scaleStartRef.current = {
        x: touch.clientX,
        scale: selectedItem.scale,
      }
    },
    [editable, selectedItem]
  )

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !isScaling) return
      
      const touch = e.touches[0]
      if (!touch) return

      if (isDragging && dragStartRef.current && selectedId) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const dx = ((touch.clientX - dragStartRef.current.x) / rect.width) * 100
        const dy = ((touch.clientY - dragStartRef.current.y) / rect.height) * 100

        let newX = dragStartRef.current.itemX + dx
        let newY = dragStartRef.current.itemY + dy

        // Clamp to canvas bounds
        const item = items.find((i) => i.id === selectedId)
        if (item) {
          const size = ITEM_DEFAULT_SIZES[item.item.category] || { w: 25, h: 25 }
          newX = Math.max(0, Math.min(100 - size.w * item.scale, newX))
          newY = Math.max(0, Math.min(100 - size.h * item.scale, newY))
        }

        setItems((prev) =>
          prev.map((i) => (i.id === selectedId ? { ...i, x: newX, y: newY } : i))
        )

        // Detect alignment
        const newGuides = detectAlignment(selectedId, newX, newY)
        setGuides(newGuides)
      }

      if (isScaling && scaleStartRef.current && selectedId) {
        const dx = touch.clientX - scaleStartRef.current.x
        const scaleDelta = dx / 200
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scaleStartRef.current.scale + scaleDelta)
        )
        setItems((prev) =>
          prev.map((i) => (i.id === selectedId ? { ...i, scale: newScale } : i))
        )
      }
    }

    const handleTouchEnd = () => {
      if (isDragging && selectedId) {
        pushHistory(items)
        if (guidesTimeoutRef.current) clearTimeout(guidesTimeoutRef.current)
        guidesTimeoutRef.current = setTimeout(() => setGuides([]), 300)
      }
      if (isScaling && selectedId) {
        pushHistory(items)
      }
      setIsDragging(false)
      setIsScaling(false)
      dragStartRef.current = null
      scaleStartRef.current = null
    }

    if (isDragging || isScaling) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, isScaling, selectedId, items, detectAlignment, pushHistory])

  // ─── Sync initial items (only when truly new data, not during editing) ────

  const prevInitialRef = useRef(initialItems)
  useEffect(() => {
    // Only reset if initialItems reference actually changed (new outfit generated, etc.)
    if (prevInitialRef.current !== initialItems) {
      prevInitialRef.current = initialItems
      setItems(initialItems)
      setHistory([{ items: initialItems }])
      setHistoryIndex(0)
      setSelectedId(null)
    }
  }, [initialItems])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-2 min-h-0", className)}>
      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden rounded-lg select-none flex-1 min-h-0"
        style={{
          backgroundColor: "var(--color-neutral-75, #ECEFEB)",
        }}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        data-canvas-bg="true"
      >
        {/* Alignment Guides */}
        {guides.map((guide, idx) => {
          if (guide.type === "center-v") {
            return (
              <div
                key={`guide-${idx}`}
                className="absolute top-0 bottom-0 w-px bg-brand-500/40 z-50 pointer-events-none"
                style={{ left: `${guide.position}%` }}
              />
            )
          }
          if (guide.type === "center-h") {
            return (
              <div
                key={`guide-${idx}`}
                className="absolute left-0 right-0 h-px bg-brand-500/40 z-50 pointer-events-none"
                style={{ top: `${guide.position}%` }}
              />
            )
          }
          if (guide.type === "edge-left" || guide.type === "edge-right") {
            return (
              <div
                key={`guide-${idx}`}
                className="absolute top-0 bottom-0 w-px bg-ai-400/40 z-50 pointer-events-none"
                style={{ left: `${guide.position}%` }}
              />
            )
          }
          if (guide.type === "edge-top" || guide.type === "edge-bottom") {
            return (
              <div
                key={`guide-${idx}`}
                className="absolute left-0 right-0 h-px bg-ai-400/40 z-50 pointer-events-none"
                style={{ top: `${guide.position}%` }}
              />
            )
          }
          return null
        })}

        {/* Canvas Items */}
        {items.map((item) => {
          const size = ITEM_DEFAULT_SIZES[item.item.category] || { w: 25, h: 25 }
          const isSelected = item.id === selectedId
          const w = size.w * item.scale
          const h = size.h * item.scale

          return (
            <div
              key={item.id}
              className={cn(
                "absolute cursor-pointer transition-shadow duration-150",
                editable && "cursor-grab",
                isDragging && item.id === selectedId && "cursor-grabbing"
              )}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${w}%`,
                height: `${h}%`,
                zIndex: item.zIndex + (isSelected ? 100 : 0),
              }}
              onMouseDown={(e) => handleItemMouseDown(e, item.id)}
              onTouchStart={(e) => handleItemTouchStart(e, item.id)}
            >
              {/* Item Image */}
              <div
                className={cn(
                  "w-full h-full rounded-md overflow-hidden transition-all duration-150",
                  isSelected && editable
                    ? "ring-2 ring-brand-600"
                    : "",
                  item.isAISuggested && !isSelected
                    ? "ring-1 ring-ai-400/50"
                    : "",
                  item.locked && "ring-1 ring-brand-600/30"
                )}
                style={{ backgroundColor: "var(--neutral-50)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.item.imageUrl}
                  alt={item.item.name}
                  className="w-full h-full object-contain p-1.5"
                  draggable={false}
                />
              </div>

              {/* Lock Icon */}
              {item.locked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shadow-sm">
                  <Lock className="w-3 h-3 text-white" />
                </div>
              )}

              {/* AI Suggested Badge */}
              {item.isAISuggested && !item.locked && (
                <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-ai-50 text-ai-600">
                  AI
                </div>
              )}

              {/* Scale Handle (only in edit mode when selected) */}
              {isSelected && editable && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-600 border-2 border-white cursor-se-resize shadow-sm z-10"
                  onMouseDown={handleScaleMouseDown}
                  onTouchStart={handleScaleTouchStart}
                />
              )}
            </div>
          )
        })}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-neutral-500">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center shadow-sm">
                <img src="/ai-hanger.jpeg?v=1" alt="AI" className="w-12 h-12 opacity-60 rounded-lg object-cover" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ai-400/80 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground/70">开始你的搭配</p>
              <p className="text-xs text-muted-foreground">
                {editable ? '从下方衣橱添加单品' : '点击 AI 帮我搭 或 手动搭一套'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar (only in edit mode) */}
      {editable && (
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          {/* Left: Main tools */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onAddFromWardrobe}
                  disabled={items.length >= MAX_OBJECTS}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>添加单品</TooltipContent>
            </Tooltip>

            {selectedItem && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => onReplaceItem?.(selectedItem.itemId)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>替换</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => toggleLock(selectedItem.id)}
                    >
                      {selectedItem.locked ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedItem.locked ? "解锁" : "锁定"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => restoreSize(selectedItem.id)}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>恢复大小</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-error"
                      onClick={() => removeItem(selectedItem.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>从搭配移除</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Center: Undo/Redo */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>撤销</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重做</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: AI Complete */}
          <div className="flex items-center gap-1">
            {hasCompleteOutfit && onAIComplete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 text-ai-600"
                    onClick={() => {
                      const lockedIds = items
                        .filter((i) => i.locked)
                        .map((i) => i.itemId)
                      onAIComplete(lockedIds)
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">AI 补全</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI 补全缺失槽位</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { computeAutoLayout, ITEM_DEFAULT_SIZES, MIN_SCALE, MAX_SCALE, MAX_OBJECTS }
