/**
 * dsh-zh-cn — host half.
 *
 * The host side is intentionally a no-op loader entry: the whole feature
 * lives in the browser half (`./client`), which DSH's dsh-client-modules
 * picks up through the package's `dsh.client` declaration — the same shape
 * as the shipped ui-* packages (and dsh-dream-skin).
 */

/** Host loader entry for the browser implementation exported from `./client`. */
export function apply() {}
