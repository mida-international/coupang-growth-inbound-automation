import {
  expandProductOptions,
  splitCsv,
  splitCsvInt,
  type FlatOptionArrays,
  type OptListEntry,
} from "@/lib/shopling/expand-product-options";

export type ParsedShoplingInventoryRow = {
  goodsKey: string;
  ptnGoodsCd: string | null;
  productName: string | null;
  saleStatus: string | null;
  goodsTp: string | null;
  barcode: string;
  optId: string | null;
  optionTitle: string | null;
  optionValue: string | null;
  availableStock: number;
  realStock: number;
  optVrtlQty: number;
  optPrice: number;
  optSupplyPrice: number;
  optStatus: string | null;
  location: string | null;
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

function parseGoodsInfoBlock(goodsBlock: string): ParsedShoplingInventoryRow[] {
  const goodsKey = extractTag(goodsBlock, "goods_key");

  if (!goodsKey) {
    return [];
  }

  const optionsBlock = extractOptionsBlock(goodsBlock);
  const optLists = parseOptLists(goodsBlock);
  const flat = parseFlatOptionArrays(optionsBlock);
  const expanded = expandProductOptions(
    optLists,
    flat,
    optionsBlock !== null,
  );

  return expanded.map((optionRow) => ({
    goodsKey,
    ptnGoodsCd: extractTag(goodsBlock, "ptn_goods_cd") || null,
    productName: extractTag(goodsBlock, "prod_nm") || null,
    saleStatus: extractTag(goodsBlock, "sale_status") || null,
    goodsTp: extractTag(goodsBlock, "goods_tp") || "G",
    barcode: optionRow.barcode,
    optId: optionRow.optId,
    optionTitle: optionRow.optionTitle,
    optionValue: optionRow.optionValue,
    availableStock: optionRow.availableStock,
    realStock: optionRow.realStock,
    optVrtlQty: optionRow.optVrtlQty,
    optPrice: optionRow.optPrice,
    optSupplyPrice: optionRow.optSupplyPrice,
    optStatus: optionRow.optStatus,
    location: optionRow.location,
  }));
}

export function parseShoplingProductsFromXml(
  xml: string,
): ParsedShoplingInventoryRow[] {
  const goodsBlocks = xml.match(/<goodsInfo>[\s\S]*?<\/goodsInfo>/gi) ?? [];

  return goodsBlocks.flatMap((block) => parseGoodsInfoBlock(block));
}

export function countGoodsInfoBlocks(xml: string): number {
  return (xml.match(/<goodsInfo>[\s\S]*?<\/goodsInfo>/gi) ?? []).length;
}
