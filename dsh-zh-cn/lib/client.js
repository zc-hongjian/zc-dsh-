// dsh-zh-cn — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-zh-cn/client.js and executed
// through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load) — the same shape the shipped ui-* packages'
// bundles emit. Only platform seed words and registered client bundles may be
// required, so this bundle stays dependency-free (no require() calls).
//
// What it does, in two layers:
//   1. Dictionary patch — the shipped zh dictionaries leave some keys in
//      English (trajectory toolbar: Duration/Turns/Calls..., cordis panel,
//      model-selection effort). `ctx.locale.register` throws when a namespace
//      already owns a locale, so we merge directly into the locale runtime's
//      internal zh dictionaries and bump the revision (publish) so already
//      rendered outlets re-render with the Chinese copy.
//   2. DOM text patch — the trajectory view renders many labels as hard-coded
//      English strings (Model, Tokens, Purpose, Throughput, ...) that never go
//      through t(). A MutationObserver rewrites exact-matching text nodes and
//      title/aria-label/placeholder attributes to Chinese as they appear.
//
// The plugin also ensures the active locale is zh once at startup (the
// in-settings switch stays fully usable afterwards).

window.__ModuleLoader__.load({
	id: "dsh-zh-cn",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		//#region dsh-zh-cn: dictionary patches
		/** zh dictionary keys the shipped packages leave untranslated. */
		const DICT_PATCHES = {
			// dsh-client-ui-trajectory (trajectory toolbar)
			trajectory: {
				"toolbar.duration": "时长",
				"toolbar.useActualDuration": "使用实际时长",
				"toolbar.useEqualWidth": "使用等宽操作",
				"toolbar.turns": "轮次",
				"toolbar.expandTurns": "展开轮次",
				"toolbar.collapseTurns": "收起轮次",
				"toolbar.calls": "调用",
				"toolbar.expandCalls": "展开调用",
				"toolbar.collapseCalls": "收起调用"
			},
			// dsh-client-ui-cordis
			cordis: {
				"panel.trigger": "Cordis 插件",
				"panel.runningCount": "{count} 个运行中",
				"body.hostCode": "宿主",
				"body.clientCode": "客户端"
			},
			// dsh-client-ui-model-selection
			model: {
				"effort.providerDefault": "默认"
			}
		};
		//#endregion

		//#region dsh-zh-cn: hard-coded English text map
		/**
		 * Exact-match replacement table for UI strings that are hard-coded in the
		 * client bundles (mostly the trajectory view's detail labels) and never
		 * pass through the locale system.
		 */
		const DOM_MAP = {
			// — trajectory: assistant / message records —
			"Assistant Message": "助手消息",
			"Message": "消息",
			"System Prompt": "系统提示",
			"SYSTEM": "系统",
			"Content": "内容",
			"Reasoning": "推理",
			"Tool Call": "工具调用",
			"Tool calls": "工具调用",
			"Tools": "工具",
			"Subtool calls": "子工具调用",
			"Result": "结果",
			"Retry": "重试",
			"Retry delay": "重试延迟",
			// — trajectory: request overview —
			"Status": "状态",
			"Error": "错误",
			"Failed": "失败",
			"Pending": "等待中",
			"Completed": "已完成",
			"Purpose": "用途",
			"Compaction": "上下文压缩",
			"Started": "开始",
			"Duration": "时长",
			"Total duration": "总时长",
			"Source": "来源",
			"Provider": "提供方",
			"Model": "模型",
			"Input": "输入",
			"Output": "输出",
			"Parameters": "参数",
			"Schema unavailable": "参数架构不可用",
			"Options not recorded": "未记录选项",
			"Source not recorded": "未记录来源",
			"Not available": "不可用",
			// — trajectory: timing / tokens —
			"Generation": "生成",
			"Throughput": "吞吐量",
			"Timing source": "计时来源",
			"Tokens": "令牌",
			"Session cumulative": "会话累计",
			"This request": "本次请求",
			"Cache created": "缓存已创建",
			"Cached": "已缓存",
			"Usage not reported": "未报告用量",
			"Loading plugins…": "正在加载插件…",
			"Failed to load plugins": "插件加载失败",
			"ASSISTANT": "助手",
			"Actual time": "实际时间",
			"Between turns": "轮次之间",
			"COMPACTED": "已压缩",
			"CONTEXT": "上下文",
			"Calls": "调用",
			"Click to load earlier history": "点击加载更早的历史",
			"Compacted": "已压缩",
			"Compacting context…": "正在压缩上下文…",
			"Compaction failed": "压缩失败",
			"Compaction was interrupted before completion.": "压缩在完成前被中断。",
			"Context compacted": "上下文已压缩",
			"Diff": "差异",
			"Duration too short": "时长过短",
			"Expand calls": "展开调用",
			"Turns": "轮次",
			"Expand turns": "展开轮次",
			"First token unavailable": "首令牌不可用",
			"Goal": "目标",
			"Hierarchy": "层级",
			"Initial System Prompt": "初始系统提示",
			"Interrupted": "已中断",
			"Load earlier history": "加载更早的历史",
			"Loading earlier history": "正在加载更早的历史",
			"Loading earlier history…": "正在加载更早的历史…",
			"Loading trajectory…": "正在加载轨迹…",
			"Message source JSON": "消息来源 JSON",
			"Module": "模块",
			"No content": "无内容",
			"No output": "无输出",
			"No payload captured": "未捕获负载",
			"No result captured": "未捕获结果",
			"Not recorded": "未记录",
			"Options": "选项",
			"Output tokens unavailable": "输出令牌不可用",
			"Payload": "负载",
			"Plugin": "插件",
			"Preview": "预览",
			"Raw": "原始",
			"Raw Output": "原始输出",
			"Request Timing": "请求计时",
			"Request options JSON": "请求选项 JSON",
			"Result JSON": "结果 JSON",
			"Schema": "架构",
			"Search": "搜索",
			"Search trajectory": "搜索轨迹",
			"Session timestamps": "会话时间戳",
			"Show Unix timestamp": "显示 Unix 时间戳",
			"Show local time": "显示本地时间",
			"Step start unavailable": "步骤开始不可用",
			"SUBTOOL": "子工具",
			"System Prompt Updated": "系统提示已更新",
			"System Prompt and Tools Updated": "系统提示与工具已更新",
			"Thinking": "思考",
			"Timing": "计时",
			"Tools Updated": "工具已更新",
			"Tool call only": "仅工具调用",
			"USER": "用户",
			"Unknown": "未知",
			"Usage": "用量",
			"Usage unavailable": "用量不可用",
			"User": "用户",
			"Summary": "摘要",
			"TOOL": "工具",
			"Other": "其他",
			"No system prompt in this request": "该请求没有系统提示",
			"No tools in this request": "该请求没有工具",
			"No timing data": "无计时数据",
			// — trajectory: event details chrome —
			"Trajectory timeline": "轨迹时间线",
			"Event details": "事件详情",
			"Close details": "关闭详情",
			"Resize event details": "调整事件详情大小",
			"Drag to resize. Double-click to reset.": "拖动调整大小，双击重置。",
			"Open image": "打开图片",
			"Open tool call summary": "打开工具调用摘要",
			// — other packages —
			"Think": "思考",
			"compact": "压缩",
			"Inspect": "检查",
			"Agent preset": "智能体预设",
			"failed to exit plan mode": "退出计划模式失败",
			"Internal Testing Notice": "内部测试通知",
			"Models": "模型",
			"Plugins": "插件",
			"Skill": "技能",
			"OUT": "输出"
		};
		/** Maximum text length eligible for pattern-based rewriting (keeps user
		 * messages and long payloads untouched; only short fixed-format labels
		 * like tool feedback summaries are rewritten). */
		const MAX_PATTERN_LEN = 500;
		/**
		 * Pattern-based rewrites for strings that embed dynamic values, applied
		 * after the exact-match table misses. Prefix/suffix matches only — the
		 * dynamic remainder is preserved verbatim.
		 */
		const PREFIX_PATTERNS = [
			{ re: /^Defined\s+/, to: "已定义 " },
			{ re: /^Removed\s+/, to: "已移除 " },
			{ re: /^Initialized\s+/, to: "已初始化 " },
			{ re: /^Cordis run\b/, to: "Cordis 运行" },
			{ re: / completed successfully$/, to: " 成功完成" },
			{ re: /^Total\s+/, to: "总计 " },
			{ re: /^Started\s+/, to: "开始于 " },
			{ re: /^TTFT\s+/, to: "首令牌 " },
			{ re: /\bDecoding\s+/, to: "解码 " }
		];
		/** Apply exact match first, then prefix/suffix patterns (length-capped). */
		function mapText(value) {
			const trimmed = value.trim();
			if (trimmed === "" || trimmed !== value) return value;
			const exact = DOM_MAP[trimmed];
			if (exact !== void 0) return exact;
			if (value.length > MAX_PATTERN_LEN) return value;
			let out = value;
			for (const pattern of PREFIX_PATTERNS) {
				out = out.replace(pattern.re, pattern.to);
			}
			return out;
		}
		//#endregion

		//#region dsh-zh-cn: dictionary patcher
		/** Merge the zh patches into the locale runtime's internal dictionaries. */
		function patchDictionaries(locale) {
			const dicts = locale.dicts;
			if (!dicts || typeof dicts.get !== "function") return 0;
			let patched = 0;
			for (const [ns, patch] of Object.entries(DICT_PATCHES)) {
				const zh = dicts.get(ns)?.get("zh");
				if (!zh) continue;
				let changed = false;
				for (const [key, value] of Object.entries(patch)) {
					if (zh[key] === value) continue;
					zh[key] = value;
					changed = true;
				}
				if (changed) patched++;
			}
			return patched;
		}
		//#endregion

		//#region dsh-zh-cn: DOM text patcher
		/** Tag marking the active observer installation (HMR-safe teardown). */
		const INSTALLED_ATTR = "data-dsh-zh-cn-installed";
		/** Attributes whose values may carry UI copy. */
		const ATTRS = ["title", "aria-label", "placeholder"];
		/** Elements whose text content is user content and must never be rewritten. */
		const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "INPUT", "SELECT", "OPTION"]);

		/**
		 * Rewrite a single text node when it exactly matches a mapped phrase.
		 * @param node - a character-data node.
		 */
		function patchTextNode(node) {
			if (node.nodeType !== 3) return;
			const parent = node.parentElement;
			if (!parent || SKIP_TAGS.has(parent.tagName)) return;
			const value = node.nodeValue;
			if (!value) return;
			const replacement = mapText(value);
			if (replacement !== value) node.nodeValue = replacement;
		}

		/** Rewrite a text-bearing attribute when it exactly matches a mapped phrase. */
		function patchAttributes(el) {
			for (const attr of ATTRS) {
				const value = el.getAttribute(attr);
				if (!value) continue;
				const replacement = mapText(value);
				if (replacement !== value) el.setAttribute(attr, replacement);
			}
		}

		/**
		 * Recursively scan a (sub)tree: patch attributes and rewrite exact/pattern
		 * matching text nodes at every depth (React mounts whole record subtrees
		 * at once, so a shallow scan would leave deep labels untouched).
		 */
		function scan(node) {
			if (node.nodeType === 3) {
				patchTextNode(node);
				return;
			}
			if (node.nodeType !== 1) return;
			patchAttributes(node);
			for (const child of node.childNodes) scan(child);
		}

		/** Install the observer; returns a dispose function. */
		function installDomPatcher() {
			if (typeof document === "undefined") return () => {};
			const root = document.documentElement;
			if (root.hasAttribute(INSTALLED_ATTR)) return () => {};
			root.setAttribute(INSTALLED_ATTR, "1");
			const observer = new MutationObserver((records) => {
				for (const record of records) {
					if (record.type === "characterData") {
						patchTextNode(record.target);
						if (record.target.parentElement) patchAttributes(record.target.parentElement);
					} else {
						for (const node of record.addedNodes) scan(node);
					}
				}
			});
			observer.observe(root, { childList: true, subtree: true, characterData: true });
			// Initial pass over whatever already exists (the boot page and any
			// early shell content mounted before this plugin activated).
			scan(root);
			return () => {
				observer.disconnect();
				root.removeAttribute(INSTALLED_ATTR);
			};
		}
		//#endregion

		/** Locale service dependency. */
		const inject = ["locale"];

		/**
		 * Client plugin body: force zh once at boot, patch the shipped zh
		 * dictionaries, and keep hard-coded English labels rewritten to Chinese.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			ctx.effect(() => {
				// 1. Ensure Simplified Chinese is active (a one-time boot default;
				//    the in-settings switch still works afterwards).
				const locale = ctx.locale;
				if (locale && locale.getLocale().active !== "zh") {
					try {
						locale.setLocale("zh");
					} catch {}
				}
				// 2. Patch untranslated zh dictionary keys and refresh subscribers.
				let patched = 0;
				if (locale) {
					patched = patchDictionaries(locale);
					if (patched > 0 && typeof locale.publish === "function") {
						locale.publish(locale.getLocale().active, false);
					}
				}
				// 3. Rewrite hard-coded English labels in the DOM.
				const disposeDom = installDomPatcher();
				return () => {
					disposeDom();
				};
			}, "dsh-zh-cn: patch zh dictionaries & install DOM text patcher");
		}

		exports.DICT_PATCHES = DICT_PATCHES;
		exports.DOM_MAP = DOM_MAP;
		exports.PREFIX_PATTERNS = PREFIX_PATTERNS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
