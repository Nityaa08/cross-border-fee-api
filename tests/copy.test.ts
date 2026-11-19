import { copyWithFallback } from "../src/ui/copy";
import { DEMO_PAGE } from "../src/ui/page";

function harness() {
  const labels: string[] = [];
  let selected = 0;
  return {
    labels,
    get selected() {
      return selected;
    },
    show: (l: string) => labels.push(l),
    select: () => {
      selected += 1;
    },
  };
}

describe("demo page Copy button", () => {
  test("copies and says so when the clipboard works", async () => {
    const h = harness();
    const written: string[] = [];
    const out = await copyWithFallback("curl x", { writeText: async (t) => void written.push(t) }, h.show, h.select);
    expect(out).toBe("copied");
    expect(written).toEqual(["curl x"]);
    expect(h.labels).toEqual(["Copied"]);
    expect(h.selected).toBe(0);
  });

  test("a blocked clipboard selects the text instead of failing silently", async () => {
    const h = harness();
    const denied = { writeText: () => Promise.reject(new Error("Write permission denied.")) };
    const out = await copyWithFallback("curl x", denied, h.show, h.select);
    expect(out).toBe("selected");
    expect(h.selected).toBe(1);
    expect(h.labels).toEqual(["Selected"]);
  });

  test("no clipboard API (plain http) falls back the same way", async () => {
    for (const clip of [undefined, {}]) {
      const h = harness();
      expect(await copyWithFallback("curl x", clip, h.show, h.select)).toBe("selected");
      expect(h.selected).toBe(1);
    }
  });

  test("a writeText that throws synchronously also falls back", async () => {
    const h = harness();
    const throws = {
      writeText: () => {
        throw new Error("not allowed");
      },
    };
    expect(await copyWithFallback("curl x", throws, h.show, h.select)).toBe("selected");
  });

  test("the page embeds the function as valid browser JavaScript", () => {
    const script = DEMO_PAGE.slice(DEMO_PAGE.lastIndexOf("<script>") + 8, DEMO_PAGE.lastIndexOf("</script>"));
    expect(script).toContain("var copyWithFallback = function copyWithFallback(");
    // Parses (does not run): a broken embed would be a syntax error for the whole page.
    expect(() => new Function(script)).not.toThrow();
  });
});
