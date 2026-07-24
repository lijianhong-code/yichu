'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/wardrobe', label: '衣橱', icon: Shirt },
  { href: '/ai-styling', label: 'AI搭配', icon: Sparkles },
  { href: '/profile', label: '我的', icon: User },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/98 backdrop-blur-sm tab-safe-area">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 py-1 transition-wardrobe',
                isActive ? 'text-brand-600' : 'text-neutral-500'
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className={cn(
                    'transition-wardrobe',
                    isActive && 'fill-brand-100'
                  )}
                />
                {tab.href === '/ai-styling' && !isActive && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ai-400" />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] leading-tight',
                  isActive ? 'font-medium text-brand-700' : 'font-normal'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
