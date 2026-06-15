import {
  cartesianProduct,
  splitCsv,
  splitCsvInt,
  type FlatOptionArrays,
  type OptListEntry,
} from "@/lib/shopling/expand-product-options";

export type ParsedShoplingPackageMappingRow = {
  packageGoodsKey: string;
  packagePtnGoodsCd: string | null;
  packageOptId: string;
  packageOptValue: string | null;
  packageBarcode: string | null;
  singleOptId: string;
  singleOptValue: string | null;
  mapCnt: number;
};

function extractTag(block: string, tag: string): string {
  const cdataMatch = block.match(
    new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"),
  );

  if (cdataMatch?.[1] !== undefined) {
    return cdataMatch[1].trim();
  }

  const plainMatch = block.match(
    new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"),
  );

  return plainMatch?.[1]?.trim() ?? "";
}

function extractOptionsBlock(goodsBlock: string): string | null {
  const match = goodsBlock.match(/<options>([\s\S]*?)<\/options>/i);

  return match?.[1] ?? null;
}

function parseOptLists(goodsBlock: string): OptListEntry[] {
  const optListBlocks = [
    ...goodsBlock.matchAll(/<optList>([\s\S]*?)<\/optList>/gi),
  ];

  return optListBlocks.map((match) => {
    const block = match[1] ?? "";

    return {
      title: extractTag(block, "title"),
      valueParts: splitCsv(extractTag(block, "value")),
    };
  });
}

function parseFlatOptionArrays(optionsBlock: string | null): FlatOptionArrays {
  if (!optionsBlock) {
    return {
      optBarcode: [],
      optId: [],
      optQty: [],
      optVrtlQty: [],
      optPrice: [],
      optSupplyPrice: [],
      optStatus: [],
      optStoreMemo: [],
    };
  }

  return {
    optBarcode: splitCsv(extractTag(optionsBlock, "optBarcode")),
    optId: splitCsv(extractTag(optionsBlock, "optId")),
    optQty: splitCsvInt(extractTag(optionsBlock, "optQty")),
    optVrtlQty: splitCsvInt(extractTag(optionsBlock, "optVrtlQty")),
    optPrice: splitCsvInt(extractTag(optionsBlock, "optPrice")),
    optSupplyPrice: splitCsvInt(extractTag(optionsBlock, "optSupplyPrice")),
    optStatus: splitCsv(extractTag(optionsBlock, "optStatus")),
    optStoreMemo: splitCsv(extractTag(optionsBlock, "optStoreMemo")),
  };
}

function buildOptIdToBarcode(flat: FlatOptionArrays): Map<string, string> {
  const map = new Map<string, string>();

  for (let i = 0; i < flat.optId.length; i++) {
    const optId = flat.optId[i];

    if (optId) {
      map.set(optId, flat.optBarcode[i] ?? "");
    }
  }

  return map;
}

function resolvePackageOptValue(
  goodsBlock: string,
  packageOptId: string,
): string | null {
  const optionsBlock = extractOptionsBlock(goodsBlock);

  if (!optionsBlock) {
    return null;
  }

  const optLists = parseOptLists(goodsBlock);
  const flat = parseFlatOptionArrays(optionsBlock);
  const idx = flat.optId.indexOf(packageOptId);

  if (idx < 0) {
    return null;
  }

  const titles = optLists.map((entry) => entry.title);
  const valueArrays = optLists.map((entry) => entry.valueParts);
  const combinations = cartesianProduct(valueArrays);
  const flatCount = Math.max(flat.optBarcode.length, flat.optQty.length, 1);
  const useCartesian = combinations.length === flatCount;

  if (titles.length === 1 && titles[0] === "단품") {
    return "단품";
  }

  if (useCartesian) {
    return combinations[idx]?.join(", ") ?? null;
  }

  if (titles.length === 1) {
    return valueArrays[0]?.[idx] ?? `옵션${idx + 1}`;
  }

  return `옵션${idx + 1}`;
}

function parseMapCnt(itemBlock: string): number {
  const raw = extractTag(itemBlock, "mapCnt");
  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseGoodsInfoPackageMappings(
  goodsBlock: string,
): ParsedShoplingPackageMappingRow[] {
  const packageGoodsKey = extractTag(goodsBlock, "goods_key");

  if (!packageGoodsKey) {
    return [];
  }

  const pkgRoot = goodsBlock.match(/<pkgOptMappings>[\s\S]*?<\/pkgOptMappings>/i);

  if (!pkgRoot) {
    return [];
  }

  const packagePtnGoodsCd = extractTag(goodsBlock, "ptn_goods_cd") || null;
  const optionsBlock = extractOptionsBlock(goodsBlock);
  const flat = parseFlatOptionArrays(optionsBlock);
  const optIdToBarcode = buildOptIdToBarcode(flat);

  const result: ParsedShoplingPackageMappingRow[] = [];
  const pkgMaps = pkgRoot[0].match(/<pkgOptMap>[\s\S]*?<\/pkgOptMap>/gi) ?? [];

  for (const pkgMap of pkgMaps) {
    const headerMatch = pkgMap.match(/^<pkgOptMap>([\s\S]*?)<pkgItems>/i);
    const headerBlock = headerMatch ? headerMatch[1]! : pkgMap;
    const packageOptId = extractTag(headerBlock, "optId");

    if (!packageOptId) {
      continue;
    }

    const packageOptValue = resolvePackageOptValue(goodsBlock, packageOptId);
    const barcode = optIdToBarcode.get(packageOptId);
    const packageBarcode = barcode && barcode.length > 0 ? barcode : null;

    const pkgItems = pkgMap.match(/<pkgItem>[\s\S]*?<\/pkgItem>/gi) ?? [];

    for (const item of pkgItems) {
      const singleOptId = extractTag(item, "optId");

      if (!singleOptId) {
        continue;
      }

      const singleOptValue = extractTag(item, "optValue") || null;

      result.push({
        packageGoodsKey,
        packagePtnGoodsCd,
        packageOptId,
        packageOptValue,
        packageBarcode,
        singleOptId,
        singleOptValue,
        mapCnt: parseMapCnt(item),
      });
    }
  }

  return result;
}

export function parseShoplingPackageMappingsFromXml(
  xml: string,
): ParsedShoplingPackageMappingRow[] {
  const goodsBlocks = xml.match(/<goodsInfo>[\s\S]*?<\/goodsInfo>/gi) ?? [];

  return goodsBlocks.flatMap((block) => parseGoodsInfoPackageMappings(block));
}
