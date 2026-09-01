import type { ReactNode } from 'react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  imageSrc?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Domain-friendly wrapper around the public shadcn Empty primitives. */
export function EmptyState({
  title,
  description,
  imageSrc,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn('border-0 py-14', className)}>
      <EmptyHeader>
        {(imageSrc || icon) && (
          <EmptyMedia variant="default" className="mb-1">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="" className="size-28 object-contain opacity-75" />
            ) : icon}
          </EmptyMedia>
        )}
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent className="max-w-none">{action}</EmptyContent>}
    </Empty>
  );
}
