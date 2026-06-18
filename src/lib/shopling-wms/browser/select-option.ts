import type { Frame, Locator, Page } from "playwright";

export async function selectOptionByLabel(
  root: Page | Frame,
  selector: string,
  label: string,
): Promise<boolean> {
  const select = root.locator(selector);
  const count = await select.count();

  if (count === 0) {
    return false;
  }

  const options = select.locator("option");
  const optionCount = await options.count();

  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);
    const text = (await option.textContent())?.trim() ?? "";

    if (!text.includes(label)) {
      continue;
    }

    const value = await option.getAttribute("value");

    if (value) {
      await select.selectOption(value);
      return true;
    }
  }

  return false;
}

export async function selectFirstMatchingOption(
  root: Page | Frame,
  selector: string,
  values: string[],
): Promise<boolean> {
  const select = root.locator(selector);

  if ((await select.count()) === 0) {
    return false;
  }

  for (const value of values) {
    try {
      await select.selectOption(value);
      return true;
    } catch {
      // try next value
    }
  }

  return false;
}

export async function firstVisibleLocator(
  root: Page | Frame,
  selectors: string[],
): Promise<Locator | null> {
  for (const selector of selectors) {
    const locator = root.locator(selector).first();

    if ((await locator.count()) === 0) {
      continue;
    }

    if (await locator.isVisible().catch(() => false)) {
      return locator;
    }
  }

  return null;
}

export async function firstVisibleRoleLocator(
  root: Page | Frame,
  role: "button" | "textbox",
  name: string | RegExp,
): Promise<Locator | null> {
  const locator = root.getByRole(role, { name }).first();

  if ((await locator.count()) === 0) {
    return null;
  }

  if (await locator.isVisible().catch(() => false)) {
    return locator;
  }

  return null;
}
