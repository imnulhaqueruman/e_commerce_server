import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, letting later classes win.
 *
 * `cn('p-2', 'p-4')` -> `'p-4'`. Used everywhere a component accepts a
 * `className` override.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
