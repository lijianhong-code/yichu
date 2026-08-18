'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Shirt, Sparkles, Settings, Shield, HelpCircle, LogOut, Heart, Calendar, Ruler, Moon, Bell, BellOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useWardrobe } from '@/lib/store';
import { toast } from '@/lib/toast';

export default function ProfilePage() {
  const { state, getStats, updateUser } = useWardrobe();
  const user = state.user;
  const stats = getStats();

  // 计算颜色分布
  const colorDistribution = (() => {
    const colorCount: Record<string, number> = {};
    state.items.forEach((item) => {
      const color = item.primaryColor || '未分类';
      colorCount[color] = (colorCount[color] || 0) + 1;
    });
    const total = state.items.length;
    return Object.entries(colorCount)
      .map(([color, count]) => ({ color, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // 只显示前 6 种颜色
  })();

  // 计算分类分布
  const categoryDistribution = (() => {
    const categoryCount: Record<string, number> = {};
    state.items.forEach((item) => {
      const category = item.category || '未分类';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const total = state.items.length;
    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  })();

  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);
  const [isPreferenceSheetOpen, setIsPreferenceSheetOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isPrivacySheetOpen, setIsPrivacySheetOpen] = useState(false);
  const [isHelpSheetOpen, setIsHelpSheetOpen] = useState(false);
  const [isBodySheetOpen, setIsBodySheetOpen] = useState(false);

  // Toggleable preferences
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['休闲', '通勤']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['黑白灰', '大地色']);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(['办公室', '周末']);

  // Settings state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Sync preferences to store for AI use
  useEffect(() => {
    updateUser({
      preferences: {
        styles: selectedStyles,
        colors: selectedColors,
        occasions: selectedOccasions,
      },
    });
  }, [selectedStyles, selectedColors, selectedOccasions, updateUser]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion) ? prev.filter(o => o !== occasion) : [...prev, occasion]
    );
  };

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'records':
        setIsRecordSheetOpen(true);
        break;
      case 'preferences':
        setIsPreferenceSheetOpen(true);
        break;
      case 'body':
        setIsBodySheetOpen(true);
        break;
      case 'settings':
        setIsSettingsSheetOpen(true);
        break;
      case 'privacy':
        setIsPrivacySheetOpen(true);
        break;
      case 'help':
        setIsHelpSheetOpen(true);
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

  const handleClearData = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    setIsPrivacySheetOpen(false);
    toast.success('已清除所有数据');
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
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="text-center p-3">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">衣物</p>
          </Card>
          <Card className="text-center p-3">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.totalOutfits}</p>
            <p className="text-xs text-muted-foreground mt-1">搭配</p>
          </Card>
        </div>
      </div>

      {/* Category Distribution Pie Chart */}
      <div className="px-4 mt-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">衣橱分类分布</h3>
            </div>
          </div>
          <CardContent className="pt-4">
            {categoryDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {categoryDistribution.reduce<{ elements: React.ReactElement[]; offset: number }>(
                      (acc, item, index) => {
                        const colors = ['#2F6B57', '#D9684D', '#C5912F', '#4B7698', '#7B708C', '#8B9D83'];
                        const color = colors[index % colors.length];
                        const circumference = 2 * Math.PI * 40;
                        const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -(acc.offset / 100) * circumference;
                        acc.elements.push(
                          <circle
                            key={item.category}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                          />
                        );
                        acc.offset += item.percentage;
                        return acc;
                      },
                      { elements: [], offset: 0 }
                    ).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-foreground tabular-nums">{stats.totalItems}</p>
                      <p className="text-xs text-muted-foreground">总衣物</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryDistribution.slice(0, 5).map((item, index) => {
                    const colors = ['#2F6B57', '#D9684D', '#C5912F', '#4B7698', '#7B708C', '#8B9D83'];
                    const color = colors[index % colors.length];
                    return (
                      <div key={item.category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-foreground flex-1">{item.category}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{item.count} 件</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">暂无衣物数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Color Distribution Pie Chart */}
      <div className="px-4 mt-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-accent/50 to-accent-muted/50 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
              <h3 className="text-sm font-medium text-foreground">颜色分布</h3>
            </div>
          </div>
          <CardContent className="pt-4">
            {colorDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {colorDistribution.reduce<{ elements: React.ReactElement[]; offset: number }>(
                      (acc, item, index) => {
                        const colors = ['#2F6B57', '#D9684D', '#C5912F', '#4B7698', '#7B708C', '#8B9D83'];
                        const color = colors[index % colors.length];
                        const circumference = 2 * Math.PI * 40;
                        const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -(acc.offset / 100) * circumference;
                        acc.elements.push(
                          <circle
                            key={item.color}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                          />
                        );
                        acc.offset += item.percentage;
                        return acc;
                      },
                      { elements: [], offset: 0 }
                    ).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-foreground tabular-nums">{colorDistribution.length}</p>
                      <p className="text-xs text-muted-foreground">颜色数</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {colorDistribution.map((item, index) => {
                    const colors = ['#2F6B57', '#D9684D', '#C5912F', '#4B7698', '#7B708C', '#8B9D83'];
                    const color = colors[index % colors.length];
                    return (
                      <div key={item.color} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-foreground flex-1">{item.color}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{item.count} 件 ({item.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">暂无衣物数据</p>
              </div>
            )}
          </CardContent>
        </Card>
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
              <Button
                key={item.action}
                variant="ghost"
                onClick={() => handleMenuClick(item.action)}
                className={`flex items-center gap-3 w-full h-auto px-4 py-3.5 text-left justify-start ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-sm text-foreground block">{item.label}</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">{item.desc}</span>
                </div>
                {item.showChevron && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </Button>
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
                <Card key={record.id} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-md bg-card overflow-hidden flex-shrink-0">
                    {record.outfit.items[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.outfit.items[0].imageUrl} alt={record.outfit.items[0].name || '穿搭记录'} className="w-full h-full object-contain p-1" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{record.date}</p>
                    <p className="text-xs text-muted-foreground">{record.outfit.items.length} 件单品</p>
                  </div>
                </Card>
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
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>风格偏好</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-5 overflow-y-auto">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">偏好风格</h4>
              <div className="flex flex-wrap gap-2">
                {['休闲', '通勤', '运动', '约会', '正式', '街头', '文艺'].map((style) => (
                  <Badge
                    key={style}
                    variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1 rounded-full text-sm transition-all"
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">偏好颜色</h4>
              <div className="flex flex-wrap gap-2">
                {['黑白灰', '大地色', '蓝色系', '绿色系', '红色系', '粉色系', '紫色系'].map((color) => (
                  <Badge
                    key={color}
                    variant={selectedColors.includes(color) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1 rounded-full text-sm transition-all"
                    onClick={() => toggleColor(color)}
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">常穿场合</h4>
              <div className="flex flex-wrap gap-2">
                {['办公室', '周末', '聚会', '运动', '约会', '旅行'].map((occasion) => (
                  <Badge
                    key={occasion}
                    variant={selectedOccasions.includes(occasion) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1 rounded-full text-sm transition-all"
                    onClick={() => toggleOccasion(occasion)}
                  >
                    {occasion}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <Button className="w-full bg-primary hover:bg-primary-hover" onClick={() => { setIsPreferenceSheetOpen(false); toast.success('偏好已保存'); }}>
                保存偏好
              </Button>
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

      {/* Settings Sheet */}
      <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>设置</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">深色模式</p>
                  <p className="text-xs text-muted-foreground">跟随系统或手动切换</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {notifications ? <Bell className="w-5 h-5 text-muted-foreground" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">推送通知</p>
                  <p className="text-xs text-muted-foreground">穿搭提醒与 AI 建议</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={() => { setIsSettingsSheetOpen(false); toast.success('设置已保存'); }}>
                保存设置
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy Sheet */}
      <Sheet open={isPrivacySheetOpen} onOpenChange={setIsPrivacySheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>隐私与数据</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">本地存储数据</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {state.items.length} 件衣物 · {state.outfits.length} 套搭配
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">穿着记录</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{state.records.length} 条</span>
              </div>
            </Card>
            <Card className="p-4 border-destructive/20 bg-destructive/5">
              <p className="text-sm font-medium text-foreground mb-1">清除所有数据</p>
              <p className="text-xs text-muted-foreground mb-3">删除所有衣物、搭配和记录，此操作不可撤销</p>
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                <Trash2 className="w-4 h-4 mr-2" />
                清除数据
              </Button>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Help Sheet */}
      <Sheet open={isHelpSheetOpen} onOpenChange={setIsHelpSheetOpen}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>帮助与反馈</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3 overflow-y-auto">
            {[
              { q: '如何添加衣物？', a: '在衣橱页面点击右下角的 + 按钮，可以拍摄单件或从相册批量导入。' },
              { q: 'AI 搭配是怎么工作的？', a: '描述你的场合和需求，AI 会分析你的衣橱，推荐最合适的搭配方案。' },
              { q: '如何编辑搭配？', a: '在搭配页面点击「编辑搭配」，可以拖拽调整位置、添加或移除单品。' },
              { q: '数据存在哪里？', a: '所有数据存储在浏览器本地，不会上传到服务器。清除浏览器数据会丢失所有内容。' },
            ].map((faq, i) => (
              <Card key={i} className="p-3">
                <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </Card>
            ))}
            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={() => { setIsHelpSheetOpen(false); toast.info('反馈功能即将上线'); }}>
                提交反馈
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Body Sheet */}
      <Sheet open={isBodySheetOpen} onOpenChange={setIsBodySheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>身形尺码</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">身高</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{user.height || '--'} cm</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">体重</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{user.weight || '--'} kg</p>
              </Card>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">上衣</p>
                <p className="text-sm font-medium text-foreground">{user.topSize || '--'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">下装</p>
                <p className="text-sm font-medium text-foreground">{user.bottomSize || '--'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">鞋码</p>
                <p className="text-sm font-medium text-foreground">{user.shoeSize || '--'}</p>
              </Card>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setIsBodySheetOpen(false); toast.info('身形编辑功能即将上线'); }}>
              编辑身形数据
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
