import { normalizeHeader } from "@/lib/excel/normalize-header";

export type HeaderMatcher = {
  headerIncludes: string;
  headerAlsoIncludes?: string;
  excludeIncludes?: string;
};

export function rowContainsKeywords(
  row: unknown[],
  keywords: readonly string[],
): boolean {
  const normalizedCells = row.map(normalizeHeader);

  return keywords.every((keyword) => {
    const normalizedKeyword = normalizeHeader(keyword);

    return normalizedCells.some((cell) => cell.includes(normalizedKeyword));
  });
}

export function rowMatchesAnyKeywordSet(
  row: unknown[],
  keywordSets: readonly (readonly string[])[],
): boolean {
  return keywordSets.some((keywords) => rowContainsKeywords(row, keywords));
}

export function rowMatchesTargetKeywords(
  row: unknown[],
  options: {
    requiredHeaderKeywords?: readonly string[];
    requiredHeaderKeywordSets?: readonly (readonly string[])[];
  },
): boolean {
  if (
    options.requiredHeaderKeywordSets &&
    options.requiredHeaderKeywordSets.length > 0
  ) {
    return rowMatchesAnyKeywordSet(row, options.requiredHeaderKeywordSets);
  }

  if (
    options.requiredHeaderKeywords &&
    options.requiredHeaderKeywords.length > 0
  ) {
    return rowContainsKeywords(row, options.requiredHeaderKeywords);
  }

  return false;
}

export function matchesHeaderMatcher(
  header: unknown,
  matcher: HeaderMatcher,
): boolean {
  const normalized = normalizeHeader(header);
  const primary = normalizeHeader(matcher.headerIncludes);

  if (!normalized.includes(primary)) {
    return false;
  }

  if (
    matcher.headerAlsoIncludes &&
    !normalized.includes(normalizeHeader(matcher.headerAlsoIncludes))
  ) {
    return false;
  }

  if (
    matcher.excludeIncludes &&
    normalized.includes(normalizeHeader(matcher.excludeIncludes))
  ) {
    return false;
  }

  return true;
}
