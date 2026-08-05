'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shirt, Sparkles, Calendar, User } from 'lucide-react';

const tabs = [
  { href: '/wardrobe', label: '衣橱', icon: Shirt },
  { href: '/ai-styling', label: '搭配', icon: Sparkles },
  { href: '/calendar', label: '日历', icon: Calendar },
  { href: '/profile', label: '我的', icon: User },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-surface-strong border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center min-w-[72px] min-h-[56px] py-1.5 px-2 rounded-lg transition-colors duration-150 active:bg-muted/50"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-150 ${
                    isActive
                      ? 'text-primary stroke-[2.5px] scale-110'
                      : 'text-muted-foreground stroke-[2px]'
                  }`}
                />
              </div>
              <span
                className={`mt-1 text-[11px] leading-tight transition-colors duration-150 ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
