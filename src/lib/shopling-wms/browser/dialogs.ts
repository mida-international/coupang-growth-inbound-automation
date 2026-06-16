import type { BrowserContext } from "playwright";

export function attachDialogAutoAccept(context: BrowserContext): void {
  context.on("dialog", (dialog) => {
    void dialog.accept();
  });
}
