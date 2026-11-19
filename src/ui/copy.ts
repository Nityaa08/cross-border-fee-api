/**
 * The demo page's "Copy" button for the curl example.
 *
 * Kept as a real function so it can be unit-tested; the page embeds its source
 * (copyWithFallback.toString()). It runs in the browser, so it uses only plain
 * ES2017 and touches nothing outside its arguments.
 *
 * The clipboard API is missing on plain-http pages and rejects when the
 * browser or an embedding frame blocks it. Before, the button then did
 * nothing and left an uncaught promise error. Now it selects the command
 * and asks the user to copy it themselves.
 */
export interface ClipboardLike {
  writeText?: (text: string) => Promise<void>;
}

export function copyWithFallback(
  text: string,
  clipboard: ClipboardLike | undefined,
  show: (label: string) => void,
  select: () => void
): Promise<"copied" | "selected"> {
  function fallback(): "selected" {
    try {
      select();
    } catch (_e) {
      // Nothing more to do: the label below still tells the user.
    }
    show("Selected");
    return "selected";
  }
  if (!clipboard || typeof clipboard.writeText !== "function") {
    return Promise.resolve(fallback());
  }
  let pending: Promise<void>;
  try {
    pending = clipboard.writeText(text);
  } catch (_e) {
    return Promise.resolve(fallback());
  }
  return Promise.resolve(pending).then(
    function () {
      show("Copied");
      return "copied" as const;
    },
    fallback
  );
}
