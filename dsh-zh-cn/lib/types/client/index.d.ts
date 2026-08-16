/** Simplified Chinese dictionary keys the shipped packages leave untranslated. */
export declare const DICT_PATCHES: Record<string, Record<string, string>>;

/** Exact-match replacement table for hard-coded English UI strings. */
export declare const DOM_MAP: Record<string, string>;

/** Pattern-based rewrites for strings embedding dynamic values (tool feedback etc.). */
export declare const PREFIX_PATTERNS: { re: RegExp; to: string }[];

export declare const inject: string[];

export declare function apply(ctx: any): void;
