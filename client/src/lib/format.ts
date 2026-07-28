export const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};