/** App-wide constants. */

/** Where the API lives in dev. The Vite proxy forwards `/api` here. */
export const DEV_API_ORIGIN = 'http://localhost:5000';

/** Default page size for product grids. */
export const DEFAULT_PER_PAGE = 24;

/** How many products the home page shows in its "new arrivals" rail. */
export const HOME_PRODUCT_COUNT = 12;

/** How many related products the API returns for a product page. */
export const RELATED_PRODUCT_COUNT = 3;

/** The Stripe publishable key, or undefined when Stripe is not configured. */
export const stripePublishableKey = import.meta.env
  .VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const isStripeConfigured = Boolean(
  stripePublishableKey && stripePublishableKey.length > 0,
);
