import * as React from 'react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export function Sheet({ open, onOpenChange, children, side = 'left' }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'relative z-10 h-full w-72 bg-background p-6 shadow-lg',
          side === 'left' ? 'mr-auto' : 'ml-auto'
        )}
      >
        {children}
      </div>
    </div>
  );
}