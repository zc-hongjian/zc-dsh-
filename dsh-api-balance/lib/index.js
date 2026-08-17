/**
 * dsh-api-balance — host half.
 *
 * Resolves the DeepSeek API key through the harness credential seam
 * (ctx.credentials, falling back to the ambient environment) and exposes a
 * same-origin HTTP route /dsh-balance that proxies the DeepSeek
 * /user/balance endpoint. The browser half polls this route; the API key
 * never leaves the harness process and never crosses the wire to the page.
 *
 * The route is registered on the harness web server (an exact route, so it
 * wins over the /api carrier prefix and the SPA fallback) and answers JSON:
 *
 *   { ok: true, fetchedAt, isAvailable, currency, totalBalance,
 *     grantedBalance, toppedUpBalance, balanceInfos }   — balance snapshot
 *   { ok: false, code: 'no-key' | 'upstream', message, fetchedAt } — failure
 *
 * A short host-side cache absorbs bursts of page polls so the provider API
 * is not hammered; the widget itself polls at its own pace (30s default).
 */

import { credentialRef } from "@deepseek-ai/dsh-credentials";

/** Stable Cordis plugin name (matches the loader entry id in cordis.patch.yml). */
export const name = "api-balance";

/** Route path served to the browser half. */
export const ROUTE_PATH = "/dsh-balance";

/** Credential reference / environment variable holding the DeepSeek API key. */
export const DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";

/** Environment variable overriding the provider base URL (same seam as the shipped DeepSeek adapter). */
export const BASE_URL_ENV = "DEEPSEEK_BASE_URL";

/** Public DeepSeek API root. */
export const PUBLIC_BASE_URL = "https://api.deepseek.com";

/** Balance endpoint path under the base URL. */
export const BALANCE_PATH = "/user/balance";

/** Upstream fetch timeout in milliseconds. */
export const FETCH_TIMEOUT_MS = 8000;

/** Short host-side cache window so bursts of page polls do not hammer the provider. */
export const CACHE_MS = 4000;

/** Services required before this plugin applies (merged with the entry's own inject). */
export const inject = ["webServer"];

/** Coerce an unknown JSON number-or-string to a finite number, else null. */
export function toNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

/**
 * Normalize a DeepSeek /user/balance response into the widget payload.
 * The provider reports balances as decimal strings inside balance_infos.
 * @param data - parsed upstream JSON.
 * @param fetchedAt - epoch ms at fetch completion.
 * @returns the normalized success payload.
 */
export function normalizeBalance(data, fetchedAt) {
	const infos = Array.isArray(data && data.balance_infos) ? data.balance_infos : [];
	const primary = infos[0] || {};
	return {
		ok: true,
		fetchedAt,
		isAvailable: data && typeof data.is_available === "boolean" ? data.is_available : null,
		currency: typeof primary.currency === "string" && primary.currency ? primary.currency : "CNY",
		totalBalance: toNumber(primary.total_balance),
		grantedBalance: toNumber(primary.granted_balance),
		toppedUpBalance: toNumber(primary.topped_up_balance),
		balanceInfos: infos.map((info) => ({
			currency: typeof info.currency === "string" && info.currency ? info.currency : "CNY",
			totalBalance: toNumber(info.total_balance),
			grantedBalance: toNumber(info.granted_balance),
			toppedUpBalance: toNumber(info.topped_up_balance)
		}))
	};
}

/** Human-readable error message from an unknown thrown value. */
function messageOf(error) {
	return error && typeof error.message === "string" ? error.message : String(error);
}

/**
 * Resolve the DeepSeek API key: credential seam first, ambient environment
 * second. Resolution is per request, so a key changed in the Models settings
 * reaches the next poll without a restart (the seam's documented contract).
 * @param ctx - plugin context.
 * @returns the key, or null when unconfigured.
 */
export async function resolveApiKey(ctx) {
	const credentials = ctx && typeof ctx.get === "function" ? ctx.get("credentials") : void 0;
	if (credentials && typeof credentials.resolve === "function") {
		try {
			const hit = await credentials.resolve(credentialRef(DEFAULT_API_KEY_ENV));
			if (hit && typeof hit.value === "string" && hit.value.length > 0) return hit.value;
		} catch (error) {
			if (ctx.logger && typeof ctx.logger.warn === "function") ctx.logger.warn("api-balance: credential resolve failed (" + messageOf(error) + "); falling back to ambient");
		}
	}
	const ambient = typeof process !== "undefined" ? process.env[DEFAULT_API_KEY_ENV] : void 0;
	return ambient && ambient.length > 0 ? ambient : null;
}

/**
 * Fetch the balance snapshot from the provider (no caching here; callers own
 * caching). Never throws — every failure is returned as a structured payload.
 * @param ctx - plugin context.
 * @returns the success or failure payload.
 */
export async function fetchBalance(ctx) {
	const apiKey = await resolveApiKey(ctx);
	const fetchedAt = Date.now();
	if (!apiKey) {
		return {
			ok: false,
			code: "no-key",
			message: "未找到 DeepSeek API Key（凭证 " + DEFAULT_API_KEY_ENV + " 未配置）。请在环境变量或网页端「模型」设置中配置后重试。",
			fetchedAt
		};
	}
	const envBase = typeof process !== "undefined" ? process.env[BASE_URL_ENV] : void 0;
	const baseURL = (envBase || PUBLIC_BASE_URL).replace(/\/+$/, "");
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	let response;
	try {
		response = await fetch(baseURL + BALANCE_PATH, {
			method: "GET",
			headers: {
				Authorization: "Bearer " + apiKey,
				Accept: "application/json"
			},
			signal: controller.signal,
			cache: "no-store"
		});
	} catch (error) {
		return {
			ok: false,
			code: "upstream",
			message: "请求余额接口失败: " + messageOf(error),
			fetchedAt
		};
	} finally {
		clearTimeout(timer);
	}
	const text = await response.text();
	const completedAt = Date.now();
	let data = null;
	try {
		data = JSON.parse(text);
	} catch {
		/* non-JSON upstream body */
	}
	if (!response.ok) {
		const upstreamMessage = data && typeof data.error === "object" && data.error !== null ? data.error.message : void 0;
		return {
			ok: false,
			code: "upstream",
			status: response.status,
			message: upstreamMessage || text.slice(0, 240) || "HTTP " + response.status,
			fetchedAt: completedAt
		};
	}
	return normalizeBalance(data, completedAt);
}

/** Write one JSON response body with no-store semantics (same-origin route). */
function writeJson(res, status, payload) {
	const body = JSON.stringify(payload);
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff"
	});
	res.end(body);
}

/**
 * Mount the /dsh-balance route.
 * @param ctx - plugin context (must carry the webServer service).
 */
export function apply(ctx) {
	ctx.effect(() => {
		const server = ctx.get("webServer");
		if (!server || typeof server.register !== "function") {
			if (ctx.logger && typeof ctx.logger.warn === "function") ctx.logger.warn("api-balance: webServer service unavailable; balance route not mounted");
			return () => {};
		}
		const cache = { at: 0, payload: null };
		return server.register({
			kind: "exact",
			path: ROUTE_PATH,
			handler: async (_req, res) => {
				const now = Date.now();
				let payload = cache.payload;
				if (!payload || now - cache.at >= CACHE_MS) {
					payload = await fetchBalance(ctx);
					cache.at = now;
					cache.payload = payload;
				}
				writeJson(res, 200, payload);
			}
		});
	}, "api-balance: /dsh-balance route");
}
