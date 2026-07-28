import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  className,
}: Props) {
  const [hover, setHover] = useState(0);
  const dims = { sm: 14, md: 18, lg: 24 }[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer'
            )}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              size={dims}
              className={cn(
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}