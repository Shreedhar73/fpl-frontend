/**
 * Hand-written types are limited to the envelope itself, which is a frontend concern.
 * Every endpoint's request and response shape belongs in `types.gen.ts`, generated from the
 * backend's OpenAPI document by `pnpm generate:api`. Hand-editing generated types is exactly
 * how the two repos drift, and the drift surfaces as a runtime `undefined`, not a type error.
 */
export interface ApiResponseMeta {
  requestId: string;
  durationMs: number;
  generatedAt: string;
  /** Which gameweek's data produced this. Present on anything carrying model output. */
  dataAsOfGw?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode: string | null;
  data: T;
  meta: ApiResponseMeta | null;
}
