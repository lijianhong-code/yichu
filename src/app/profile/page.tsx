'use client';

import { useState } from 'react';
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shirt,
  Calendar,
  Shield,
  HelpCircle,
  LogOut,
  Heart,
  Palette,
  Bell,
  Download,
  Trash2,
  Clock,
  Sun,
  Moon,
  CloudRain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { userProfile, wearLogs } from '@/lib/mock-data';

export default function ProfilePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Wear data for mini chart
  const weeklyData = [
    { day: '一', count: 3 },
    { day: '二', count: 5 },
    { day: '三', count: 2 },
    { day: '四', count: 6 },
    { day: '五', count: 4 },
    { day: '六', count: 5 },
    { day: '日', count: 3 },
  ];
  const maxCount = Math.max(...weeklyData.map(d => d.count));

  return (
    <div className="min-h-screen bg-neutral-25 pb-4">
      {/* Header / Profile card */}
      <header className="bg-white px-4 pb-5 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 ring-2 ring-brand-600/10">
            <span className="text-[20px] font-semibold text-brand-700">
              {userProfile.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-[18px] font-semibold tracking-tight text-neutral-900">{userProfile.name}</h1>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {userProfile.city} · 已陪伴 <span className="tabular-nums text-neutral-600">{userProfile.wardrobeDays}</span> 天
            </p>
          </div>
          <button className="rounded-full p-2 hover:bg-neutral-100 transition-wardrobe">
            <ChevronRight size={16} className="text-neutral-400 rotate-0" />
          </button>
        </div>

        {/* Stats - clean divider style */}
        <div className="mt-5 flex items-center">
          <div className="flex-1 text-center">
            <p className="text-[22px] font-semibold text-neutral-900 tabular-nums">{userProfile.totalItems}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">件单品</p>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div className="flex-1 text-center">
            <p className="text-[22px] font-semibold text-neutral-900 tabular-nums">{userProfile.totalOutfits}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">套穿搭</p>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div className="flex-1 text-center">
            <p className="text-[22px] font-semibold text-brand-600 tabular-nums">68%</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">利用率</p>
          </div>
        </div>
      </header>

      {/* AI眼中的我 */}
      <section className="px-4 pt-4 pb-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200/50">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai-50">
              <Sparkles size={12} className="text-ai-400" />
            </div>
            <h2 className="text-[14px] font-semibold text-neutral-900">AI 眼中的我</h2>
          </div>
          <div className="mt-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                你偏好<span className="font-medium text-neutral-900">简约、干练</span>的风格，常穿黑色、白色和深蓝色单品
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-400" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                <span className="font-medium text-neutral-900">推断</span>：通勤日偏好正式度适中的搭配，周末更倾向宽松舒适
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                你明确不喜欢<span className="font-medium text-neutral-900">荧光色和大规模印花</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('preferences')}
            className="mt-3.5 flex w-full items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 transition-wardrobe hover:bg-neutral-100"
          >
            <span className="text-[12px] font-medium text-brand-600">查看和管理所有偏好</span>
            <ChevronRight size={14} className="text-neutral-400" />
          </button>
        </div>
      </section>

      {/* Monthly insight */}
      <section className="px-4 pb-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200/50">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50">
              <TrendingUp size={12} className="text-brand-600" />
            </div>
            <h2 className="text-[14px] font-semibold text-neutral-900">本月洞察</h2>
            <span className="ml-auto text-[11px] text-neutral-500">7月</span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold text-brand-600 tabular-nums leading-none">18</span>
              <span className="text-[13px] text-neutral-600">件衣物被穿过</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">
              衣橱利用率 <span className="font-medium text-neutral-700">64%</span>，比上月提升 5%。最常穿的是白色纯棉T恤（5次）
            </p>

            {/* Mini bar chart */}
            <div className="mt-4 flex items-end gap-1.5">
              {weeklyData.map((d, i) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm transition-all duration-300"
                    style={{
                      height: `${(d.count / maxCount) * 40}px`,
                      backgroundColor: i === 3 ? '#2F6B57' : '#E7F0EB',
                    }}
                  />
                  <span className="text-[10px] text-neutral-500">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-neutral-500">近7天穿着趋势</span>
              <button className="text-[11px] font-medium text-brand-600">详情</button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu items - Main */}
      <section className="px-4 pb-3">
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/50">
          <MenuItem icon={Shirt} label="穿着记录" subtitle="查看每日穿搭历史" />
          <MenuDivider />
          <MenuItem icon={Heart} label="风格与穿着偏好" subtitle="管理你的风格、颜色和场合偏好" />
          <MenuDivider />
          <MenuItem icon={Palette} label="身形与尺码" subtitle="身高、尺码和版型偏好" />
          <MenuDivider />
          <MenuItem icon={Calendar} label="衣橱报告" subtitle="品类分布、颜色结构分析" badge="即将上线" />
        </div>
      </section>

      {/* Settings */}
      <section className="px-4 pb-3">
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/50">
          <MenuItem icon={Bell} label="通知与提醒" />
          <MenuDivider />
          <MenuItem icon={Shield} label="隐私与权限" />
          <MenuDivider />
          <MenuItem icon={Download} label="导出衣橱数据" />
          <MenuDivider />
          <MenuItem icon={Trash2} label="清除 AI 偏好" subtitle="重置 AI 学习到的偏好" />
          <MenuDivider />
          <MenuItem icon={HelpCircle} label="帮助与反馈" />
        </div>
      </section>

      {/* Danger zone */}
      <section className="px-4 pb-8">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[14px] text-error-fg ring-1 ring-error-bg/60 transition-wardrobe hover:bg-error-bg active:scale-[0.98]">
          <LogOut size={16} />
          注销账号
        </button>
      </section>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  subtitle,
  badge,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 transition-wardrobe hover:bg-neutral-50 active:bg-neutral-100">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50">
        <Icon size={16} className="text-neutral-600" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-[14px] text-neutral-900">{label}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-neutral-500">{subtitle}</p>}
      </div>
      {badge && (
        <span className="rounded-full bg-ai-50 px-2 py-0.5 text-[10px] font-medium text-ai-600">{badge}</span>
      )}
      <ChevronRight size={14} className="shrink-0 text-neutral-300" />
    </button>
  );
}

function MenuDivider() {
  return <div className="mx-4 border-t border-neutral-100" />;
}
