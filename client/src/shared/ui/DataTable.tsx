import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/primitives/table';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. */
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * A responsive data table.
 *
 * Below `md` the table scrolls horizontally rather than collapsing into
 * cards — admin data is dense and horizontal scrolling preserves the
 * column relationships that a card layout breaks.
 */
export function DataTable<T extends { _id?: string }>({
  columns,
  rows,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'Nothing to show yet.',
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
        <div className="border-b p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-11 w-11 animate-pulse rounded-md bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn('whitespace-nowrap', column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row._id ?? index}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
