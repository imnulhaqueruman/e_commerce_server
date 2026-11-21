import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/primitives/button';
import { Skeleton } from '@/shared/ui/primitives/skeleton';

/**
 * UI primitives.
 *
 * A thin layer over the shadcn-style components in
 * `src/shared/ui/primitives`. These are the building blocks every screen
 * composes from.
 */

export { Button, buttonVariants } from '@/shared/ui/primitives/button';
export { Input } from '@/shared/ui/primitives/input';
export { Label } from '@/shared/ui/primitives/label';
export { Textarea } from '@/shared/ui/primitives/textarea';
export { Select } from '@/shared/ui/primitives/select';
export { Skeleton } from '@/shared/ui/primitives/skeleton';
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/primitives/tabs';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/primitives/table';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui/primitives/card';
export { Badge } from '@/shared/ui/primitives/badge';
export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/shared/ui/primitives/dialog';
export { Sheet } from '@/shared/ui/primitives/sheet';

export { StatusBadge } from '@/shared/ui/StatusBadge';
export { DataTable, type Column } from '@/shared/ui/DataTable';
export { ConfirmDialog, ConfirmAction } from '@/shared/ui/ConfirmDialog';
export { ImageUploader, type UploadedImage } from '@/shared/ui/ImageUploader';

/**
 * A section heading used at the top of every page.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * The empty state for a list with no items.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * The error state for a failed request.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-medium text-destructive">{title}</p>
      {message ? (
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A loading placeholder that matches the shape of a content block.
 */
export function LoadingState({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/**
 * A metric tile for the admin dashboard.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * A price, with an optional struck-through original.
 */
export function PriceTag({
  value,
  original,
  className,
}: {
  value: number | string;
  original?: number | string;
  className?: string;
}) {
  const format = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className="font-semibold">{format(value)}</span>
      {original !== undefined ? (
        <span className="text-xs text-muted-foreground line-through">
          {format(original)}
        </span>
      ) : null}
    </span>
  );
}
