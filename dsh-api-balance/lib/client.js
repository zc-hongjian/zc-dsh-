// dsh-api-balance — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-api-balance/client.js and executed
// through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load) — the same shape the shipped ui-* packages'
// bundles emit. Only platform seed words and registered client bundles may be
// required, so this bundle stays dependency-free (no require() calls).
//
// What it does: mounts a compact, fixed bottom-left widget showing the
// DeepSeek API key balance (polled from the host half's same-origin
// /dsh-balance route — the key never leaves the harness) plus the current
// session's cumulative token usage (the host-computed "tokenUsage"
// projection). Hovering the pill expands a detail panel; a live dot, glow,
// and slide-in animations give it the requested dynamic feel.

window.__ModuleLoader__.load({
	id: "dsh-api-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		//#region constants
		/** Required client services (the client-runtime bundle must load first). */
		const inject = ["sessions"];
		/** Same-origin route served by the host half (lib/index.js). */
		const ROUTE = "/dsh-balance";
		/** Balance poll cadence in milliseconds. */
		const POLL_MS = 30000;
		/** Display symbols for the currencies the provider may report. */
		const CURRENCY_SYMBOLS = { CNY: "¥", USD: "$", EUR: "€", JPY: "¥", HKD: "HK$", GBP: "£", RUB: "₽", KRW: "₩", SGD: "S$", TWD: "NT$" };
		//#endregion

		//#region formatting helpers
		function formatMoney(value, currency) {
			const symbol = CURRENCY_SYMBOLS[currency] || (currency ? currency + " " : "");
			if (value == null || !Number.isFinite(value)) return symbol + "--";
			return symbol + value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		}
		function formatTokens(n) {
			if (n == null || !Number.isFinite(n) || n <= 0) return "0";
			if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
			if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
			if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
			return String(n);
		}
		function formatTime(ts) {
			if (!ts) return "--";
			try { return new Date(ts).toLocaleTimeString("zh-CN", { hour12: false }); } catch { return "--"; }
		}
		function messageOf(error) {
			return error && typeof error.message === "string" ? error.message : String(error);
		}
		/** Fold the host tokenUsage projection into the widget's usage shape. */
		function normalizeUsage(value) {
			if (!value || typeof value !== "object") return null;
			const num = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
			const input = num(value.uncachedInputTokens) + num(value.cacheReadTokens) + num(value.cacheWriteTokens);
			const output = num(value.outputTokens);
			return {
				input,
				output,
				cacheRead: num(value.cacheReadTokens),
				cacheWrite: num(value.cacheWriteTokens),
				total: input + output
			};
		}
		//#endregion

		//#region styles (shadow-DOM scoped; theme variables inherit from the host page)
		const CSS = [
			":host { all: initial; }",
			"* { box-sizing: border-box; }",
			".ab-root {",
					"position: fixed; left: 14px; bottom: 96px; z-index: 2147483000; /* anchored above the sidebar settings button by JS */",
					"font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif;",
					"color: var(--dsw-alias-label-primary, #e8eaed);",
					"user-select: none; -webkit-user-select: none;",
				"}",
			".ab-pill {",
					"display: flex; align-items: center; gap: 8px;",
					"padding: 7px 13px; border-radius: 999px; cursor: pointer;",
					"background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #232833) 86%, transparent);",
					"border: 1px solid var(--dsw-alias-border-l2, #333a47);",
					"box-shadow: 0 2px 10px rgba(0, 0, 0, .25);",
					"backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);",
					"font-variant-numeric: tabular-nums; white-space: nowrap;",
					"transition: transform .18s var(--ds-ease-in-out, ease), box-shadow .18s ease, border-color .18s ease;",
				"}",
			".ab-pill:hover {",
					"transform: translateY(-2px) scale(1.04);",
					"border-color: var(--dsw-alias-state-business-primary, #4f8cff);",
					"box-shadow: 0 6px 18px rgba(0, 0, 0, .35), 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f8cff) 55%, transparent), 0 0 20px color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f8cff) 38%, transparent);",
				"}",
			".ab-pill-balance { font-weight: 600; font-size: 13px; line-height: 1; }",
			".ab-pill-usage { font-size: 11px; line-height: 1; color: var(--dsw-alias-label-secondary, #9aa1ab); }",
			".ab-dot {",
					"width: 8px; height: 8px; border-radius: 50%; flex: none;",
					"background: var(--dot-color, var(--dsw-alias-label-caption, #6b7280));",
					"transition: background .2s ease, box-shadow .2s ease;",
				"}",
			".ab-root.refreshing .ab-dot { animation: ab-pulse 1s ease-in-out infinite; }",
				"@keyframes ab-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--dot-color, #6b7280) 45%, transparent); } 50% { opacity: .4; box-shadow: 0 0 0 5px transparent; } }",
			".ab-panel {",
					"position: absolute; left: 0; bottom: calc(100% + 10px); width: 292px;",
					"max-height: min(70vh, 560px); overflow: auto;",
					"border-radius: 12px; padding: 12px 14px 14px;",
					"background: var(--dsw-alias-bg-layer-2, #20242e);",
					"border: 1px solid var(--dsw-alias-border-l2, #333a47);",
					"box-shadow: 0 10px 34px rgba(0, 0, 0, .4);",
					"opacity: 0; transform: translateY(8px) scale(.98); pointer-events: none;",
					"transform-origin: bottom left;",
					"transition: opacity .18s ease, transform .18s var(--ds-ease-in-out, ease);",
				"}",
			".ab-root:hover .ab-panel, .ab-root:focus-within .ab-panel {",
					"opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;",
				"}",
			".ab-head { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }",
			".ab-title { font-size: 13px; font-weight: 650; }",
			".ab-status { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-secondary, #9aa1ab); }",
			".ab-refresh {",
					"width: 24px; height: 24px; border-radius: 6px; border: 0; cursor: pointer;",
					"background: transparent; color: var(--dsw-alias-label-secondary, #9aa1ab);",
					"font-size: 15px; line-height: 1; display: inline-flex; align-items: center; justify-content: center;",
					"transition: color .12s ease, background .12s ease, transform .12s ease;",
				"}",
			".ab-refresh:hover { color: var(--dsw-alias-label-primary, #e8eaed); background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.08)); }",
			".ab-refresh.spinning { animation: ab-spin .8s linear infinite; }",
				"@keyframes ab-spin { to { transform: rotate(360deg); } }",
			".ab-rows { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 12px; line-height: 18px; }",
			".ab-row { display: contents; }",
			".ab-row > span { color: var(--dsw-alias-label-secondary, #9aa1ab); }",
			".ab-row > b { font-weight: 550; font-variant-numeric: tabular-nums; text-align: right; }",
			".ab-ok { color: var(--dsw-alias-state-success-primary, #34d399); }",
			".ab-bad { color: var(--dsw-alias-state-error-primary, #f87171); }",
			".ab-usage-head {",
					"margin: 11px 0 7px; padding-top: 9px; font-size: 11px;",
					"color: var(--dsw-alias-label-caption, #6b7280);",
					"border-top: 1px solid var(--dsw-alias-border-l1, #2c313c);",
				"}",
			".ab-error { margin-top: 9px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-state-error-primary, #f87171); word-break: break-all; }",
			".ab-hint { margin-top: 8px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-state-warn-label, #f5b544); }",
			"@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }",
		].join("\n");
		//#endregion

		//#region widget
		/**
		 * Build the bottom-left widget. Returns a disposer; never throws (a mount
		 * failure degrades to a console note instead of breaking plugin activation).
		 */
		function mountWidget(ctx) {
			const doc = window.document;
			if (!doc) return () => {};

			let built = false;
			let dispose = () => {};

			const build = () => {
				if (built) return;
				if (!doc.body) return;
				if (doc.getElementById("dsh-api-balance-widget")) { built = true; return; }
				built = true;

				const host = doc.createElement("div");
				host.id = "dsh-api-balance-widget";
				const shadow = host.attachShadow({ mode: "open" });
				shadow.innerHTML = [
					"<style>" + CSS + "</style>",
					"<div class=\"ab-root\" part=\"root\">",
						"<div class=\"ab-panel\" part=\"panel\" role=\"region\" aria-label=\"DeepSeek API 余额与用量\">",
							"<div class=\"ab-head\"><span class=\"ab-title\">DeepSeek 余额</span><span class=\"ab-status\"></span><button type=\"button\" class=\"ab-refresh\" title=\"立即刷新\" aria-label=\"立即刷新\">⟳</button></div>",
							"<div class=\"ab-rows\">",
								"<div class=\"ab-row\"><span>总余额</span><b class=\"ab-total\"></b></div>",
								"<div class=\"ab-row\"><span>赠送余额</span><b class=\"ab-granted\"></b></div>",
								"<div class=\"ab-row\"><span>充值余额</span><b class=\"ab-topped\"></b></div>",
								"<div class=\"ab-row\"><span>API 可用</span><b class=\"ab-avail\"></b></div>",
								"<div class=\"ab-row\"><span>更新时间</span><b class=\"ab-time\"></b></div>",
							"</div>",
							"<div class=\"ab-usage-head\">本会话用量（Token）</div>",
							"<div class=\"ab-rows\">",
								"<div class=\"ab-row\"><span>输入</span><b class=\"ab-u-in\"></b></div>",
								"<div class=\"ab-row\"><span>输出</span><b class=\"ab-u-out\"></b></div>",
								"<div class=\"ab-row\"><span>缓存命中</span><b class=\"ab-u-cache\"></b></div>",
								"<div class=\"ab-row\"><span>缓存写入</span><b class=\"ab-u-cw\"></b></div>",
								"<div class=\"ab-row\"><span>总计</span><b class=\"ab-u-total\"></b></div>",
							"</div>",
							"<div class=\"ab-error\" style=\"display:none\"></div>",
							"<div class=\"ab-hint\" style=\"display:none\"></div>",
						"</div>",
					"<div class=\"ab-pill\" part=\"pill\" role=\"status\" aria-live=\"polite\">",
						"<span class=\"ab-dot\"></span>",
						"<span class=\"ab-pill-balance\"></span>",
						"<span class=\"ab-pill-usage\"></span>",
					"</div>",
					"</div>",
				].join("\n");

				const $ = (sel) => shadow.querySelector(sel);
				const els = {
					root: $(".ab-root"),
					pill: $(".ab-pill"),
					pillBalance: $(".ab-pill-balance"),
					pillUsage: $(".ab-pill-usage"),
					dot: $(".ab-dot"),
					status: $(".ab-status"),
					refresh: $(".ab-refresh"),
					total: $(".ab-total"),
					granted: $(".ab-granted"),
					topped: $(".ab-topped"),
					avail: $(".ab-avail"),
					time: $(".ab-time"),
					uIn: $(".ab-u-in"),
					uOut: $(".ab-u-out"),
					uCache: $(".ab-u-cache"),
					uCw: $(".ab-u-cw"),
					uTotal: $(".ab-u-total"),
					error: $(".ab-error"),
					hint: $(".ab-hint")
				};
				doc.body.append(host);

				/** Widget state: balance snapshot (or failure) and session usage. */
				const state = { balance: null, usage: null };

				function render() {
					const bal = state.balance;
					if (bal === null) {
						els.pillBalance.textContent = "查询中…";
						els.dot.style.setProperty("--dot-color", "var(--dsw-alias-label-caption, #6b7280)");
					} else if (bal.ok === true) {
						els.pillBalance.textContent = formatMoney(bal.totalBalance, bal.currency);
						els.dot.style.setProperty("--dot-color", bal.isAvailable === false ? "var(--dsw-alias-state-warn-label, #f5b544)" : "var(--dsw-alias-state-success-primary, #34d399)");
					} else if (bal.code === "no-key") {
						els.pillBalance.textContent = "未配置 Key";
						els.dot.style.setProperty("--dot-color", "var(--dsw-alias-state-warn-label, #f5b544)");
					} else {
						els.pillBalance.textContent = "余额获取失败";
						els.dot.style.setProperty("--dot-color", "var(--dsw-alias-state-error-primary, #f87171)");
					}

					if (bal && bal.ok === true) {
						els.total.textContent = formatMoney(bal.totalBalance, bal.currency);
						els.granted.textContent = formatMoney(bal.grantedBalance, bal.currency);
						els.topped.textContent = formatMoney(bal.toppedUpBalance, bal.currency);
						els.avail.textContent = bal.isAvailable === false ? "不可用" : "可用";
						els.avail.className = "ab-ok" + (bal.isAvailable === false ? " ab-bad" : "");
						els.time.textContent = formatTime(bal.fetchedAt);
						els.status.textContent = "实时";
						els.error.style.display = "none";
						els.hint.style.display = "none";
					} else {
						els.total.textContent = els.granted.textContent = els.topped.textContent = "--";
						els.avail.textContent = "--";
						els.avail.className = "";
						els.time.textContent = bal ? formatTime(bal.fetchedAt) : "--";
						if (bal) {
							els.status.textContent = bal.code === "no-key" ? "未配置" : "异常";
							els.error.textContent = bal.message || ("错误代码: " + bal.code);
							els.error.style.display = "";
							els.hint.style.display = bal.code === "no-key" ? "" : "none";
							if (bal.code === "no-key") els.hint.textContent = "请配置 DEEPSEEK_API_KEY（环境变量或网页端「模型」设置），然后点击刷新。";
						} else {
							els.status.textContent = "";
							els.error.style.display = "none";
							els.hint.style.display = "none";
						}
					}

					const usage = state.usage;
					if (usage) {
						els.pillUsage.textContent = "· " + formatTokens(usage.total) + " tok";
						els.uIn.textContent = formatTokens(usage.input);
						els.uOut.textContent = formatTokens(usage.output);
						els.uCache.textContent = formatTokens(usage.cacheRead);
						els.uCw.textContent = formatTokens(usage.cacheWrite);
						els.uTotal.textContent = formatTokens(usage.total);
					} else {
						els.pillUsage.textContent = "";
						els.uIn.textContent = els.uOut.textContent = els.uCache.textContent = els.uCw.textContent = els.uTotal.textContent = "--";
					}
				}

				let fetching = false;
				async function refreshBalance() {
					if (fetching) return;
					fetching = true;
					els.root.classList.add("refreshing");
					els.refresh.classList.add("spinning");
					try {
						let data = null;
						try {
							const res = await fetch(ROUTE, { cache: "no-store", headers: { Accept: "application/json" } });
							if (res.ok) { try { data = await res.json(); } catch { data = null; } }
							if (!res.ok) {
								try { data = await res.json(); } catch { data = null; }
								state.balance = { ok: false, code: (data && data.code) || "upstream", message: (data && data.message) || ("HTTP " + res.status), fetchedAt: Date.now() };
							} else if (!data || data.ok !== true) {
								state.balance = { ok: false, code: "upstream", message: "余额接口返回异常", fetchedAt: Date.now() };
							} else {
								state.balance = data;
							}
						} catch (error) {
							state.balance = { ok: false, code: "network", message: "无法连接本机服务: " + messageOf(error), fetchedAt: Date.now() };
						}
					} finally {
						fetching = false;
						els.root.classList.remove("refreshing");
						els.refresh.classList.remove("spinning");
						render();
					}
				}

				/** Session usage: track the current session's tokenUsage projection. */
				let currentSessionId = null;
				let usageUnsub = null;
				let bindTimer = null;

				function syncUsage() {
					if (currentSessionId == null) { state.usage = null; render(); return; }
					const binding = ctx.sessions.binding(currentSessionId);
					const face = binding && binding.session && binding.session.projections ? binding.session.projections.faceOf("tokenUsage") : null;
					state.usage = face ? normalizeUsage(face.getSnapshot()) : null;
					render();
				}

				function handleListChange() {
					let id = null;
					try {
						const list = ctx.sessions.list.getSnapshot();
						id = list && list.current ? list.current : null;
					} catch { id = null; }
					if (id === currentSessionId) { syncUsage(); return; }
					currentSessionId = id;
					if (usageUnsub) { usageUnsub(); usageUnsub = null; }
					if (bindTimer) { clearTimeout(bindTimer); bindTimer = null; }
					if (id == null) { state.usage = null; render(); return; }
					const tryBind = () => {
						if (currentSessionId !== id) return;
						const binding = ctx.sessions.binding(id);
						if (!binding || !binding.session || !binding.session.projections) {
							bindTimer = setTimeout(tryBind, 300);
							return;
						}
						const face = binding.session.projections.faceOf("tokenUsage");
						usageUnsub = face.subscribe(syncUsage);
						syncUsage();
					};
					tryBind();
				}

				/** Anchor the widget just above the sidebar's settings button. */
				let anchorTimer = null;
				let lastAnchor = "";
				const findSettingsButton = () => {
					const vw = window.innerWidth || 0;
					const vh = window.innerHeight || 0;
					let best = null;
					const buttons = doc.querySelectorAll("button[aria-haspopup=\"dialog\"]");
					for (const btn of buttons) {
						let rect = null;
						try { rect = btn.getBoundingClientRect(); } catch { continue; }
						if (!rect || (rect.width === 0 && rect.height === 0)) continue;
						if (rect.left > vw * 0.4) continue;
						if (rect.top < vh * 0.4) continue;
						if (!best || rect.top > best.rect.top) best = { el: btn, rect };
					}
					return best;
				};
				const anchorToSettings = () => {
					const vh = window.innerHeight || 0;
					const hit = findSettingsButton();
					let bottom = 96;
					let left = 14;
					if (hit) {
						bottom = vh - hit.rect.top + 10;
						left = Math.max(10, hit.rect.left);
					}
					const key = bottom + "x" + left;
					if (key !== lastAnchor) {
						lastAnchor = key;
						els.root.style.bottom = bottom + "px";
						els.root.style.left = left + "px";
					}
				};
				anchorToSettings();
				anchorTimer = setInterval(anchorToSettings, 2000);
				window.addEventListener("resize", anchorToSettings);

				const pollTimer = setInterval(refreshBalance, POLL_MS);
				const onVisible = () => { if (!doc.hidden) refreshBalance(); };
				doc.addEventListener("visibilitychange", onVisible);
				els.pill.addEventListener("click", (event) => { event.stopPropagation(); refreshBalance(); });
				els.refresh.addEventListener("click", (event) => { event.stopPropagation(); refreshBalance(); });

				let listUnsub = () => {};
				if (ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.subscribe === "function") {
					listUnsub = ctx.sessions.list.subscribe(handleListChange);
				}

				refreshBalance();
				handleListChange();

				dispose = () => {
					clearInterval(pollTimer);
					if (anchorTimer) clearInterval(anchorTimer);
					window.removeEventListener("resize", anchorToSettings);
					if (bindTimer) clearTimeout(bindTimer);
					doc.removeEventListener("visibilitychange", onVisible);
					if (usageUnsub) usageUnsub();
					listUnsub();
					host.remove();
				};
			};

			try {
				if (doc.body) build();
				else if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", build, { once: true });
				else setTimeout(build, 0);
			} catch (error) {
				console.error("dsh-api-balance: widget mount failed", error);
			}

			return () => dispose();
		}
		//#endregion

		/**
		 * Client plugin body: mount the bottom-left balance & usage widget.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			ctx.effect(() => {
				const dispose = mountWidget(ctx);
				return dispose;
			}, "dsh-api-balance: bottom-left balance & usage widget");
		}

		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map