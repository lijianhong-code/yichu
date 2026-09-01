'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shirt, Palette, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomTabNavProps {
  wardrobeBadge?: number;
}

const tabs = [
  { href: '/wardrobe', label: '衣橱', icon: Shirt },
  { href: '/ai-styling', label: '搭配', icon: Palette },
  { href: '/calendar', label: '日历', icon: Calendar },
  { href: '/profile', label: '我的', icon: User },
];

export function BottomTabNav({ wardrobeBadge = 0 }: BottomTabNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-xl">
        <div className="flex h-14 items-center justify-around px-2">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            const showBadge = tab.href === '/wardrobe' && wardrobeBadge > 0;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 transition-all duration-200',
                  isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                    )}
                  />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ai-400 px-1 text-[10px] font-medium text-white">
                      {wardrobeBadge > 9 ? '9+' : wardrobeBadge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] transition-all duration-200',
                  isActive ? 'font-semibold' : 'font-medium'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
