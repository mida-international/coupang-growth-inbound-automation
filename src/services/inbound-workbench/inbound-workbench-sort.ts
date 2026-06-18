export const INBOUND_WORKBENCH_SORT_COLUMNS = [
  "registeredProductName",
  "optionName",
  "productBarcode",
  "shoplingAvailableStock",
  "ptnGoodsCd",
  "orderableQuantity",
  "salesQty60days",
  "recentSalesQty7days",
  "recentSalesQty30days",
  "recommendedInboundQty",
  "pendingInbounds",
  "safetyStock",
  "growthInboundRecommend",
  "remainingAfterInbound",
  "actualPackedQty",
  "rotation1Qty",
  "rotation2Qty",
  "rotation3Qty",
  "offerCondition",
  "daysOfCover",
  "location",
] as const;

export type InboundWorkbenchSortColumn =
  (typeof INBOUND_WORKBENCH_SORT_COLUMNS)[number];

export type InboundWorkbenchSortDirection = "asc" | "desc";

export type ParsedInboundWorkbenchSort = {
  sort: InboundWorkbenchSortColumn | null;
  dir: InboundWorkbenchSortDirection | null;
};

function isSortColumn(value: string): value is InboundWorkbenchSortColumn {
  return INBOUND_WORKBENCH_SORT_COLUMNS.includes(
    value as InboundWorkbenchSortColumn,
  );
}

export function parseInboundWorkbenchSort(
  sort?: string,
  dir?: string,
): ParsedInboundWorkbenchSort {
  if (!sort || !isSortColumn(sort)) {
    return { sort: null, dir: null };
  }

  if (dir !== "asc" && dir !== "desc") {
    return { sort: null, dir: null };
  }

  return { sort, dir };
}

export function cycleInboundWorkbenchSort(
  currentSort: InboundWorkbenchSortColumn | null,
  currentDir: InboundWorkbenchSortDirection | null,
  clicked: InboundWorkbenchSortColumn,
): ParsedInboundWorkbenchSort {
  if (currentSort !== clicked) {
    return { sort: clicked, dir: "desc" };
  }

  if (currentDir === "desc") {
    return { sort: clicked, dir: "asc" };
  }

  if (currentDir === "asc") {
    return { sort: null, dir: null };
  }

  return { sort: clicked, dir: "desc" };
}
