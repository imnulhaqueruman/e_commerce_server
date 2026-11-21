import { Badge } from '@/shared/ui/primitives/badge';
import { cn } from '@/lib/utils';
import { ORDER_STATUSES, type OrderStatus } from '@/shared/types';

/**
 * A colour-coded badge for an order status.
 *
 * The vocabulary is fixed by the API — see `ORDER_STATUSES`. Anything
 * outside that set is rendered neutrally rather than guessed at, because
 * sending an unknown status to the server returns
 * `400 Invalid orderStatus`.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  'Not Processed': 'bg-muted text-muted-foreground',
  processing: 'bg-info/15 text-info',
  Dispatched: 'bg-primary/15 text-primary',
  Cancelled: 'bg-destructive/15 text-destructive',
  Completed: 'bg-success/15 text-success',
  Refunded: 'bg-warning/15 text-warning',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | undefined;
  className?: string;
}) {
  const known = ORDER_STATUSES.includes(status as OrderStatus);
  const key = (status ?? 'Not Processed') as OrderStatus;

  return (
    <Badge
      className={cn(
        'font-medium',
        known ? STATUS_STYLES[key] : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {status ?? 'Not Processed'}
    </Badge>
  );
}
