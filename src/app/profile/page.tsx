'use client';

import { useState } from 'react';
import { ChevronRight, Shirt, Sparkles, TrendingUp, Settings, Shield, HelpCircle, LogOut, Heart, Calendar, Palette, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWardrobe } from '@/lib/store';
import { toast } from '@/lib/toast';

export default function ProfilePage() {
  const { state, getStats } = useWardrobe();
  const user = state.user;
  const stats = getStats();

  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);
  const [isPreferenceSheetOpen, setIsPreferenceSheetOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'records':
        setIsRecordSheetOpen(true);
        break;
      case 'preferences':
        setIsPreferenceSheetOpen(true);
        break;
      case 'body':
        toast.info('身形尺码功能开发中');
        break;
      case 'settings':
        toast.info('设置功能开发中');
        break;
      case 'privacy':
        toast.info('隐私设置功能开发中');
        break;
      case 'help':
        toast.info('帮助中心功能开发中');
        break;
      case 'logout':
        setIsLogoutDialogOpen(true);
        break;
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    setIsLogoutDialogOpen(false);
    toast.success('已退出登录');
  };

  const menuItems = [
    { icon: Calendar, label: '穿着记录', desc: '查看历史穿搭记录', action: 'records', showChevron: true },
    { icon: Heart, label: '风格偏好', desc: '管理你的穿搭风格', action: 'preferences', showChevron: true },
    { icon: Ruler, label: '身形尺码', desc: '记录身材数据', action: 'body', showChevron: true },
    { icon: Settings, label: '设置', desc: '通知、主题等', action: 'settings', showChevron: true },
    { icon: Shield, label: '隐私', desc: '数据与权限管理', action: 'privacy', showChevron: true },
    { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题与反馈', action: 'help', showChevron: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header with User Info */}
      <div className="bg-card border-b border-border px-4 pt-[env(safe-area-inset-top)] pb-6">
        <div className="flex items-center gap-4 py-4">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.city} · 衣橱助手已使用 {user.wardrobeDays} 天</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">衣物</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.totalOutfits}</p>
            <p className="text-xs text-muted-foreground mt-1">搭配</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-2xl font-semibold text-primary tabular-nums">{stats.utilizationRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">利用率</p>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="px-4 mt-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-accent/50 to-accent-muted/50 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
              <h3 className="text-sm font-medium text-foreground">AI 眼中的我</h3>
            </div>
          </div>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">本月穿搭利用率</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{stats.utilizationRate}%</span>
                </div>
                <Progress value={stats.utilizationRate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">AI 建议采用率</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{stats.adoptionRate}%</span>
                </div>
                <Progress value={stats.adoptionRate} className="h-2" />
              </div>
              <Button variant="outline" className="w-full" onClick={() => setIsPreferenceSheetOpen(true)}>
                查看我的风格报告
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu List */}
      <div className="px-4 mt-6">
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={item.action}
                onClick={() => handleMenuClick(item.action)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-muted/50 active:bg-muted transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block">{item.label}</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">{item.desc}</span>
                </div>
                {item.showChevron && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-6">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => handleMenuClick('logout')}
        >
          <LogOut className="w-4 h-4 mr-2" />
          注销账号
        </Button>
      </div>

      {/* Version */}
      <div className="px-4 mt-6 text-center">
        <p className="text-xs text-muted-foreground">衣橱助手 v1.0.0</p>
      </div>

      {/* Records Sheet */}
      <Sheet open={isRecordSheetOpen} onOpenChange={setIsRecordSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>穿着记录</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3 overflow-y-auto">
            {state.records.length > 0 ? (
              state.records.map((record) => (
                <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-md bg-card overflow-hidden flex-shrink-0">
                    {record.outfit.items[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.outfit.items[0].imageUrl} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{record.date}</p>
                    <p className="text-xs text-muted-foreground">{record.outfit.items.length} 件单品</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/empty-calendar.jpeg" alt="暂无记录" className="w-28 h-28 mx-auto mb-3 object-contain opacity-70" />
                <p className="text-sm text-muted-foreground">暂无穿着记录</p>
                <p className="text-xs text-muted-foreground mt-1">开始记录你的每日穿搭吧</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Preferences Sheet */}
      <Sheet open={isPreferenceSheetOpen} onOpenChange={setIsPreferenceSheetOpen}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>风格偏好</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">偏好风格</h4>
              <div className="flex flex-wrap gap-2">
                {['休闲', '通勤', '运动', '约会', '正式'].map((style) => (
                  <Badge key={style} variant="secondary" className="text-sm">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">偏好颜色</h4>
              <div className="flex flex-wrap gap-2">
                {['黑白灰', '大地色', '蓝色系', '绿色系'].map((color) => (
                  <Badge key={color} variant="secondary" className="text-sm">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">常穿场合</h4>
              <div className="flex flex-wrap gap-2">
                {['办公室', '周末', '聚会', '运动'].map((occasion) => (
                  <Badge key={occasion} variant="secondary" className="text-sm">
                    {occasion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认注销</AlertDialogTitle>
            <AlertDialogDescription>
              注销后将清除所有本地数据，包括衣物信息、搭配方案和穿着记录。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              确认注销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
