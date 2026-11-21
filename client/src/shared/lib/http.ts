import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * The single HTTP seam.
 *
 * Every screen talks to TanStack Query hooks, and every hook talks to this
 * instance — nothing else imports axios directly. That keeps token
 * handling, error shapes, and 401 handling in one place.
 */

export const TOKEN_KEY = 'ecom_token';

/**
 * A normalised API error.
 *
 * Axios errors are inconsistent across the codebase (some handlers return
 * `{ err }`, some `{ message }`, some plain strings). This flattens all of
 * them into one shape so the UI never has to guess.
 */
export class ApiError extends Error {
  status: number;
  /** Field-level validation errors, when the server provides them. */
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** True when the request failed because the user is not signed in. */
  get isUnauthorized() {
    return this.status === 401;
  }

  /** True when the user is signed in but lacks the required role. */
  get isForbidden() {
    return this.status === 403;
  }
}

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: false,
});

/**
 * Called when the server rejects our token. The auth store registers a
 * handler here so a 401 anywhere in the app logs the user out once.
 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: (() => void) | null): void => {
  onUnauthorized = fn;
};

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Pull a human-readable message out of whatever the server sent back.
 */
const extractMessage = (
  data: unknown,
  fallback: string,
): string => {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidate =
      record.err ?? record.error ?? record.message ?? record.detail;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return fallback;
};

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;

    // A 401 means the token is gone or expired — drop the session once,
    // centrally, rather than in every hook.
    if (status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const message = extractMessage(
      error.response?.data,
      status === 0
        ? 'Could not reach the server. Check your connection.'
        : 'Something went wrong. Please try again.',
    );

    const fieldErrors =
      error.response?.data &&
      typeof error.response.data === 'object' &&
      'errors' in (error.response.data as Record<string, unknown>)
        ? (error.response.data as { errors: Record<string, string> }).errors
        : undefined;

    return Promise.reject(new ApiError(message, status, fieldErrors));
  },
);

/**
 * Narrow an unknown rejection to an `ApiError` so callers can read
 * `.status` and `.message` without a cast.
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(error.message, 0);
  return new ApiError('Unexpected error', 0);
};
