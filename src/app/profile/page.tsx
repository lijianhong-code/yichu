'use client';

import { useState } from 'react';
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shirt,
  Calendar,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Heart,
  Palette,
  Ban,
  Ruler,
  Bell,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { userProfile, wearLogs } from '@/lib/mock-data';

export default function ProfilePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-neutral-25">
      {/* Header / Profile card */}
      <header className="bg-white px-4 pb-4 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <span className="text-[20px] font-semibold text-brand-700">
              {userProfile.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-neutral-900">{userProfile.name}</h1>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {userProfile.city} · 衣橱助手已陪伴 {userProfile.wardrobeDays} 天
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="mt-4 flex items-center gap-0 rounded-lg bg-neutral-50">
          <div className="flex-1 border-r border-neutral-200 py-2.5 text-center">
            <p className="text-[18px] font-semibold text-brand-600">{userProfile.totalItems}</p>
            <p className="text-[11px] text-neutral-500">件单品</p>
          </div>
          <div className="flex-1 border-r border-neutral-200 py-2.5 text-center">
            <p className="text-[18px] font-semibold text-brand-600">{userProfile.totalOutfits}</p>
            <p className="text-[11px] text-neutral-500">套穿搭</p>
          </div>
          <div className="flex-1 py-2.5 text-center">
            <p className="text-[18px] font-semibold text-brand-600">68%</p>
            <p className="text-[11px] text-neutral-500">利用率</p>
          </div>
        </div>
      </header>

      {/* AI眼中的我 */}
      <section className="px-4 py-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-ai-400" />
            <h2 className="text-[14px] font-semibold text-neutral-900">AI 眼中的我</h2>
          </div>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                你偏好<span className="font-medium text-neutral-900">简约、干练</span>的风格，常穿黑色、白色和深蓝色单品
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-400" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                <span className="font-medium text-neutral-900">推断偏好</span>：你倾向于在通勤日选择正式度适中的搭配，周末更偏好宽松舒适
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <p className="text-[13px] leading-relaxed text-neutral-600">
                你明确不喜欢<span className="font-medium text-neutral-900">荧光色和大规模印花</span>
              </p>
            </div>
          </div>
          <button className="mt-3 text-[12px] text-brand-600">
            查看和管理所有偏好
          </button>
        </div>
      </section>

      {/* Monthly insight */}
      <section className="px-4 pb-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-600" />
            <h2 className="text-[14px] font-semibold text-neutral-900">本月洞察</h2>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-semibold text-brand-600">18</span>
              <span className="text-[13px] text-neutral-600">件衣物被穿过</span>
            </div>
            <p className="mt-1 text-[12px] text-neutral-500">
              衣橱利用率 64%，比上月提升 5%。最常穿的是白色纯棉T恤（5次）
            </p>
            <div className="mt-3 flex items-center gap-1">
              {/* Mini bar chart */}
              {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                <div
                  key={i}
                  className="w-3 rounded-sm bg-brand-100"
                  style={{ height: `${h * 0.4}px` }}
                >
                  <div
                    className="w-full rounded-sm bg-brand-600"
                    style={{ height: `${h * 0.4 * (i < 5 ? 0.7 : 1)}px`, marginTop: `${h * 0.4 * (1 - (i < 5 ? 0.7 : 1))}px` }}
                  />
                </div>
              ))}
              <span className="ml-1 text-[10px] text-neutral-500">近7天</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu items */}
      <section className="px-4">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
      <section className="px-4 py-4">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-error-bg bg-white py-3 text-[14px] text-error-fg transition-wardrobe hover:bg-error-bg">
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
    <button className="flex w-full items-center gap-3 px-4 py-3 transition-wardrobe hover:bg-neutral-50">
      <Icon size={18} className="shrink-0 text-neutral-600" />
      <div className="flex-1 text-left">
        <p className="text-[14px] text-neutral-900">{label}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-neutral-500">{subtitle}</p>}
      </div>
      {badge && (
        <span className="rounded-full bg-ai-50 px-2 py-0.5 text-[10px] text-ai-600">{badge}</span>
      )}
      <ChevronRight size={14} className="shrink-0 text-neutral-300" />
    </button>
  );
}

function MenuDivider() {
  return <div className="mx-4 border-t border-neutral-100" />;
}
