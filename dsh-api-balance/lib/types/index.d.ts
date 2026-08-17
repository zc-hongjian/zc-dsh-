/**
 * dsh-api-balance — host half type declarations.
 */

/** Stable Cordis plugin name (matches the loader entry id). */
export declare const name: string;
/** Route path served to the browser half. */
export declare const ROUTE_PATH: string;
/** Credential reference / environment variable holding the DeepSeek API key. */
export declare const DEFAULT_API_KEY_ENV: string;
/** Environment variable overriding the provider base URL. */
export declare const BASE_URL_ENV: string;
/** Public DeepSeek API root. */
export declare const PUBLIC_BASE_URL: string;
/** Balance endpoint path under the base URL. */
export declare const BALANCE_PATH: string;
/** Upstream fetch timeout in milliseconds. */
export declare const FETCH_TIMEOUT_MS: number;
/** Short host-side cache window in milliseconds. */
export declare const CACHE_MS: number;
/** Services required before this plugin applies. */
export declare const inject: string[];

/** Coerce an unknown JSON number-or-string to a finite number, else null. */
export declare function toNumber(value: unknown): number | null;

/** One balance line as the provider reports it (decimal strings). */
export interface BalanceInfo {
    currency: string;
    totalBalance: number | null;
    grantedBalance: number | null;
    toppedUpBalance: number | null;
}

/** Success payload served at ROUTE_PATH. */
export interface BalancePayload {
    ok: true;
    fetchedAt: number;
    isAvailable: boolean | null;
    currency: string;
    totalBalance: number | null;
    grantedBalance: number | null;
    toppedUpBalance: number | null;
    balanceInfos: BalanceInfo[];
}

/** Failure payload served at ROUTE_PATH. */
export interface BalanceFailure {
    ok: false;
    code: 'no-key' | 'upstream';
    status?: number;
    message: string;
    fetchedAt: number;
}

/** Normalize a DeepSeek /user/balance response into the widget payload. */
export declare function normalizeBalance(data: unknown, fetchedAt: number): BalancePayload;

/** Resolve the DeepSeek API key through the credential seam, then ambient env. */
export declare function resolveApiKey(ctx: any): Promise<string | null>;

/** Fetch the balance snapshot from the provider; never throws. */
export declare function fetchBalance(ctx: any): Promise<BalancePayload | BalanceFailure>;

/** Mount the /dsh-balance route on the webServer service. */
export declare function apply(ctx: any): void;
