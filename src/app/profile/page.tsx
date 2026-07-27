'use client';

import { useState } from 'react';
import {
  ChevronRight,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Sparkles,
  Shirt,
  Calendar,
  TrendingUp,
  Heart,
  Palette,
  X as XIcon,
  User,
  MapPin,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import { userProfile, wearLogs, wardrobeItems } from '@/lib/mock-data';

export default function ProfilePage() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showWearLog, setShowWearLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utilizationRate = 64;
  const adoptionRate = 72;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border/50">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {userProfile.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{userProfile.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{userProfile.city}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">衣橱建立 {userProfile.wardrobeDays} 天</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 text-center p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xl font-semibold text-foreground">{userProfile.totalItems}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">衣物</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xl font-semibold text-foreground">{userProfile.totalOutfits}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">穿搭</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xl font-semibold text-primary">{utilizationRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">利用率</p>
          </div>
        </div>
      </header>

      <Separator />

      {/* AI Insight about me */}
      <section className="px-4 py-5">
        <Card className="border-border/50 bg-gradient-to-br from-ai-50/30 to-background overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-ai-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-ai-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ai-600 mb-1">AI 眼中的我</p>
                <p className="text-sm text-foreground leading-relaxed">
                  你偏好简约、干练的风格，喜欢黑白色系。最近开始尝试更多蓝色单品，商务休闲是你的主要穿搭方向。
                </p>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                >
                  查看详情
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly insight */}
      <section className="px-4 pb-5">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">本月洞察</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">7月</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">衣橱利用率</span>
                  <span className="text-xs font-medium text-foreground">{utilizationRate}%</span>
                </div>
                <Progress value={utilizationRate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">AI 搭配采用率</span>
                  <span className="text-xs font-medium text-foreground">{adoptionRate}%</span>
                </div>
                <Progress value={adoptionRate} className="h-2" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              本月穿了 18 件衣物，有 5 件超过两周未穿。建议尝试给它们新的搭配机会。
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Menu items */}
      <section className="px-4 py-4 space-y-1">
        {/* Wear log */}
        <button
          onClick={() => setShowWearLog(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">穿着记录</p>
            <p className="text-xs text-muted-foreground">查看每日穿搭历史</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Style preferences */}
        <button
          onClick={() => setShowPreferences(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <Palette className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">风格与穿着偏好</p>
            <p className="text-xs text-muted-foreground">管理你的穿搭偏好设置</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Body & size */}
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <User className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">身形与尺码</p>
            <p className="text-xs text-muted-foreground">选填，帮助更精准推荐</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <Separator className="my-2" />

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <Settings className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">设置</p>
            <p className="text-xs text-muted-foreground">通知、隐私与数据管理</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Privacy */}
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <Shield className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">隐私设置</p>
            <p className="text-xs text-muted-foreground">权限管理与数据控制</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Help */}
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">帮助与反馈</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </section>

      {/* Danger zone */}
      <section className="px-4 pt-2 pb-8">
        <Separator className="mb-4" />
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/5 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-destructive">注销账号</p>
            <p className="text-xs text-muted-foreground">删除所有数据，不可恢复</p>
          </div>
        </button>
      </section>

      {/* Preferences Sheet */}
      <Sheet open={showPreferences} onOpenChange={setShowPreferences}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>风格与穿着偏好</SheetTitle>
            <SheetDescription>管理你的穿搭偏好，AI 会据此推荐</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="py-4 space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">常用场合</p>
                <div className="flex flex-wrap gap-2">
                  {['通勤', '商务', '休闲', '约会', '运动'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">喜欢的风格</p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.stylePreferences.map((style) => (
                    <Badge key={style} variant="secondary" className="text-xs">{style}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">颜色偏好</p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.colorPreferences.map((color) => (
                    <Badge key={color} variant="outline" className="text-xs">{color}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">不喜欢</p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.avoidItems.map((item) => (
                    <Badge key={item} variant="destructive" className="text-xs bg-destructive/10 text-destructive border-destructive/20">{item}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-3">AI 推断的偏好</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-medium text-foreground">不喜欢高跟鞋通勤</p>
                      <p className="text-[10px] text-muted-foreground">基于 3 次行为推断</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-medium text-foreground">偏好宽松版型</p>
                      <p className="text-[10px] text-muted-foreground">基于 5 次行为推断</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Wear Log Sheet */}
      <Sheet open={showWearLog} onOpenChange={setShowWearLog}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>穿着记录</SheetTitle>
            <SheetDescription>你的每日穿搭历史</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="py-4 space-y-2">
              {wearLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs font-medium text-foreground">{log.date.slice(-2)}</p>
                    <p className="text-[10px] text-muted-foreground">日</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{log.occasion}</p>
                    <p className="text-[10px] text-muted-foreground">{log.weather} · {log.items.length} 件</p>
                  </div>
                  {log.feedback && (
                    <Badge variant={log.feedback === '刚好' ? 'default' : 'secondary'} className="text-[10px]">
                      {log.feedback}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>设置</SheetTitle>
            <SheetDescription>管理应用设置</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">推送通知</p>
                <p className="text-xs text-muted-foreground">接收穿搭提醒和洞察</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">天气自动获取</p>
                <p className="text-xs text-muted-foreground">自动获取当前位置天气</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">高清图片</p>
                <p className="text-xs text-muted-foreground">使用高清图片（消耗更多流量）</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">数据管理</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-10 text-sm" size="sm">
                  导出衣橱数据
                </Button>
                <Button variant="outline" className="w-full justify-start h-10 text-sm" size="sm">
                  清除 AI 偏好
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认注销账号
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除你的所有数据，包括衣物图片、穿搭记录、偏好设置等。操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-10" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" className="flex-1 h-10">
              确认注销
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Need to import ScrollArea for the sheets
import { ScrollArea } from '@/components/ui/scroll-area';
