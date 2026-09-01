import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Shared mobile-safe page header for all top-level app routes. */
export function PageHeader({
  title,
  description,
  leading,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-40 border-b border-border/60 bg-background/95', className)}>
      <div className="px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex min-h-14 items-center gap-3 py-2">
          {leading}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
