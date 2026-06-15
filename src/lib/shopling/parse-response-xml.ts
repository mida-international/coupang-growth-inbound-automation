import "server-only";

import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
});

const PRODUCT_NODE_KEYS = new Set([
  "product",
  "goods",
  "prod",
  "item",
  "api_prod",
]);

const ERROR_NODE_KEYS = [
  "err_msg",
  "errmsg",
  "error_msg",
  "error_message",
  "result_msg",
  "result_message",
  "msg",
  "message",
  "error",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeToArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function looksLikeXml(text: string): boolean {
  const trimmed = text.trim();

  return trimmed.startsWith("<") && trimmed.includes(">");
}

function collectProductNodes(node: unknown, products: unknown[]): void {
  if (!isRecord(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (PRODUCT_NODE_KEYS.has(key.toLowerCase())) {
      products.push(...normalizeToArray(value));
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        collectProductNodes(item, products);
      }
      continue;
    }

    if (isRecord(value)) {
      collectProductNodes(value, products);
    }
  }
}

function collectErrorMessages(node: unknown, messages: string[]): void {
  if (!isRecord(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    const lowerKey = key.toLowerCase();

    if (
      ERROR_NODE_KEYS.includes(lowerKey) &&
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      messages.push(value.trim());
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        collectErrorMessages(item, messages);
      }
      continue;
    }

    if (isRecord(value)) {
      collectErrorMessages(value, messages);
    }
  }
}

function hasFailureIndicator(node: unknown): boolean {
  if (!isRecord(node)) {
    return false;
  }

  for (const [key, value] of Object.entries(node)) {
    const lowerKey = key.toLowerCase();

    if (
      (lowerKey === "result" ||
        lowerKey === "result_cd" ||
        lowerKey === "result_code" ||
        lowerKey === "status") &&
      typeof value === "string"
    ) {
      const normalized = value.trim().toLowerCase();

      if (
        normalized === "fail" ||
        normalized === "error" ||
        normalized === "n" ||
        normalized === "false" ||
        normalized === "0"
      ) {
        return true;
      }
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasFailureIndicator(item)) {
          return true;
        }
      }
      continue;
    }

    if (isRecord(value) && hasFailureIndicator(value)) {
      return true;
    }
  }

  return false;
}

export function countProductsInResponseXml(xml: string): number {
  const trimmed = xml.trim();

  if (!looksLikeXml(trimmed)) {
    return 0;
  }

  try {
    const parsed = parser.parse(trimmed);
    const products: unknown[] = [];
    collectProductNodes(parsed, products);

    return products.length;
  } catch {
    return 0;
  }
}

export function extractShoplingApiError(xml: string): string | null {
  const trimmed = xml.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (!looksLikeXml(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = parser.parse(trimmed);
    const messages: string[] = [];
    collectErrorMessages(parsed, messages);

    const uniqueMessages = [...new Set(messages)];

    if (uniqueMessages.length > 0) {
      return uniqueMessages.join(" / ");
    }

    if (hasFailureIndicator(parsed)) {
      return "샵플링 API가 오류 응답을 반환했습니다.";
    }

    return null;
  } catch {
    return trimmed;
  }
}
