import { Toaster as Sonner } from 'sonner';

/**
 * Toast notifications.
 *
 * `sonner` is the single toast system — the old `react-hot-toast` usage is
 * gone, so every message has the same look and position.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border bg-popover text-popover-foreground shadow-lg',
        },
      }}
    />
  );
}
