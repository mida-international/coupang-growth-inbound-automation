export type OptListEntry = {
  title: string;
  valueParts: string[];
};

export type FlatOptionArrays = {
  optBarcode: string[];
  optId: string[];
  optQty: number[];
  optVrtlQty: number[];
  optPrice: number[];
  optSupplyPrice: number[];
  optStatus: string[];
  optStoreMemo: string[];
};

export type ExpandedOptionRow = {
  optionTitle: string;
  optionValue: string;
  barcode: string;
  optId: string | null;
  availableStock: number;
  realStock: number;
  optVrtlQty: number;
  optPrice: number;
  optSupplyPrice: number;
  optStatus: string | null;
  location: string | null;
};

export function splitCsv(value: string | undefined | null): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value.split(",").map((part) => part.trim());
}

export function splitCsvInt(value: string | undefined | null): number[] {
  return splitCsv(value).map((part) => {
    const parsed = Number.parseInt(part, 10);

    return Number.isFinite(parsed) ? parsed : 0;
  });
}

export function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) {
    return [[]];
  }

  return arrays.reduce<string[][]>((acc, current) => {
    const next: string[][] = [];

    for (const prefix of acc) {
      for (const value of current) {
        next.push([...prefix, value]);
      }
    }

    return next;
  }, [[]]);
}

function getFlatCount(flat: FlatOptionArrays): number {
  return Math.max(flat.optBarcode.length, flat.optQty.length, 1);
}

function atIndex<T>(array: T[], index: number, fallback: T): T {
  return index < array.length ? array[index]! : fallback;
}

export function expandProductOptions(
  optLists: OptListEntry[],
  flat: FlatOptionArrays,
  hasOptionsBlock: boolean,
): ExpandedOptionRow[] {
  if (!hasOptionsBlock) {
    return [
      {
        optionTitle: "단품",
        optionValue: "단품",
        barcode: "",
        optId: null,
        availableStock: 0,
        realStock: 0,
        optVrtlQty: 0,
        optPrice: 0,
        optSupplyPrice: 0,
        optStatus: null,
        location: null,
      },
    ];
  }

  const flatCount = getFlatCount(flat);
  const titles = optLists.map((entry) => entry.title);
  const valueArrays = optLists.map((entry) => entry.valueParts);
  const combinations = cartesianProduct(valueArrays);
  const useCartesian = combinations.length === flatCount;
  const optionTitleJoined = titles.join(", ");

  const rows: ExpandedOptionRow[] = [];

  for (let i = 0; i < flatCount; i++) {
    let optionTitle: string;
    let optionValue: string;

    if (titles.length === 1 && titles[0] === "단품") {
      optionTitle = "단품";
      optionValue = "단품";
    } else if (useCartesian) {
      optionTitle = optionTitleJoined;
      optionValue = combinations[i]!.join(", ");
    } else if (titles.length === 1) {
      optionTitle = titles[0]!;
      optionValue = valueArrays[0]?.[i] ?? `옵션${i + 1}`;
    } else {
      optionTitle = optionTitleJoined;
      optionValue = `옵션${i + 1}`;
    }

    const stock = atIndex(flat.optQty, i, 0);

    rows.push({
      optionTitle,
      optionValue,
      barcode: atIndex(flat.optBarcode, i, ""),
      optId: atIndex(flat.optId, i, "") || null,
      availableStock: stock,
      realStock: stock,
      optVrtlQty: atIndex(flat.optVrtlQty, i, 0),
      optPrice: atIndex(flat.optPrice, i, 0),
      optSupplyPrice: atIndex(flat.optSupplyPrice, i, 0),
      optStatus: atIndex(flat.optStatus, i, "") || null,
      location: atIndex(flat.optStoreMemo, i, "") || null,
    });
  }

  return rows;
}
