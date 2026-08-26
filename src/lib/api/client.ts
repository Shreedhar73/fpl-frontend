import type { ApiResponse } from './types';

/**
 * The only place in the frontend that calls `fetch`. Everything else goes through a feature's
 * api function, which goes through here — see the fpl-architecture-contract skill, §4.
 *
 * It exists to do three things nobody should repeat: resolve the base URL, unwrap the backend's
 * ApiResponse envelope, and turn a failure into one predictable error type.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errorCode: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Next.js caching. Server components should set one deliberately rather than inherit a default. */
  revalidate?: number | false;
  tags?: string[];
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, revalidate, tags, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    next: revalidate === undefined && tags === undefined ? undefined : { revalidate, tags },
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(`Non-JSON response from ${path}`, res.status, 'BAD_RESPONSE');
  }

  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message ?? res.statusText, payload.statusCode ?? res.status, payload.errorCode);
  }

  return payload.data;
}

/**
 * Health is outside the `/api` prefix but **inside** the envelope like everything else — the
 * interceptor is global. Verified against the running backend 2026-08-26. Only the status code is
 * read here, so the body shape does not matter.
 */
export async function apiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
