/**
 * Source text for a function the demo page defines inline.
 *
 * The page embeds tested functions with Function.prototype.toString(), so it
 * gets whatever the compiler produced. `npm run dev` runs through tsx, whose
 * esbuild keeps function names by wrapping them in a `__name(fn, "name")`
 * helper that exists only in Node. In the browser that was a ReferenceError
 * the moment the function ran (clicking "Copy" locally threw
 * "__name is not defined"). The production build (tsc) adds no helper.
 *
 * The function is wrapped in its own scope with a no-op `__name`, so the same
 * source runs however it was compiled, without touching the page's globals.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function browserSource(fn: Function): string {
  return "(function () { var __name = function (f) { return f; }; return " + fn.toString() + "; })()";
}
