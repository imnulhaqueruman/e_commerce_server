/**
 * Display formatters.
 *
 * The API stores `Product.price` as a Number, but `formatCurrency` accepts
 * a string too so a record written before the price migration still
 * renders instead of showing `$NaN`.
 */

export const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === '') return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

/**
 * Format an amount given in cents (Stripe's unit).
 */
export const formatCents = (cents: number | undefined | null) => {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '$0.00';
  return formatCurrency(cents / 100);
};

export const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | undefined | null) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** A short order reference derived from the ObjectId. */
export const orderReference = (id: string | undefined) =>
  id ? `#${id.slice(-6).toUpperCase()}` : '#------';

/** The first image URL on a product, or undefined. */
export const primaryImage = (images: string[] | undefined) =>
  images && images.length > 0 ? images[0] : undefined;

/** Average star rating across a product's ratings. */
export const averageRating = (
  ratings: { star: number }[] | undefined,
): number => {
  if (!ratings || ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + (r.star ?? 0), 0);
  return total / ratings.length;
};

/** Resolve a product's category name from its populated-or-id form. */
export const categoryName = (
  category: { name?: string } | string | undefined,
): string => {
  if (!category) return '';
  if (typeof category === 'string') return '';
  return category.name ?? '';
};
