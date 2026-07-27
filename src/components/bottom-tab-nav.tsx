'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, Sparkles, User } from 'lucide-react';

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/wardrobe', label: '衣橱', icon: Shirt },
  { href: '/ai-styling', label: '搭配', icon: Sparkles },
  { href: '/profile', label: '我的', icon: User },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-surface-strong border-t border-border/30 tab-safe-area">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 h-0.5 w-5 rounded-full bg-primary/60" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
