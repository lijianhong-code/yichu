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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/96 backdrop-blur-md tab-safe-area">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg px-4 py-1 transition-wardrobe',
                isActive ? 'text-brand-600' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className={cn(
                    'transition-wardrobe',
                    isActive && 'fill-brand-100/60'
                  )}
                />
                {tab.href === '/ai-styling' && !isActive && (
                  <span className="absolute -right-0.5 -top-0.5 h-[5px] w-[5px] rounded-full bg-ai-400" />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] leading-tight transition-wardrobe',
                  isActive ? 'font-semibold text-brand-700' : 'font-normal'
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
