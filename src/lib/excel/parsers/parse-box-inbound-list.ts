import * as XLSX from "xlsx";

export type BoxListItem = {
  barcode: string;
  quantity: number;
  productName?: string;
  optionName?: string;
  location?: string;
  box?: string;
  ocrConfidence?: number;
};

export type ParseBoxInboundListResult = {
  items: BoxListItem[];
  skippedRows: number;
};

function pickValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }

    for (const actualKey of Object.keys(row)) {
      if (actualKey.replace(/\s/g, "").includes(key.replace(/\s/g, ""))) {
        if (row[actualKey] !== undefined && row[actualKey] !== "") {
          return row[actualKey];
        }
      }
    }
  }

  return undefined;
}

function stringOrUndefined(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return String(value).trim();
}

export function parseBoxInboundList(
  buffer: ArrayBuffer | Buffer,
): ParseBoxInboundListResult {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const workbook = XLSX.read(data, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    return { items: [], skippedRows: 0 };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });

  const items: BoxListItem[] = [];
  let skippedRows = 0;

  for (const row of rows) {
    const barcode = pickValue(row, ["바코드", "barcode", "Barcode", "상품바코드"]);
    const qtyRaw = pickValue(row, ["수량", "quantity", "qty", "입고수량"]);

    if (!barcode) {
      const hasAnyValue = Object.values(row).some(
        (value) => value !== null && value !== undefined && value !== "",
      );

      if (hasAnyValue) {
        skippedRows += 1;
      }

      continue;
    }

    const quantity = parseInt(String(qtyRaw).replace(/,/g, ""), 10);

    if (Number.isNaN(quantity)) {
      skippedRows += 1;
      continue;
    }

    items.push({
      barcode: String(barcode).trim(),
      quantity,
      productName: stringOrUndefined(
        pickValue(row, ["등록상품명", "상품명", "product_name"]),
      ),
      optionName: stringOrUndefined(
        pickValue(row, ["옵션명", "option_name", "옵션"]),
      ),
      location: stringOrUndefined(
        pickValue(row, ["location", "로케이션", "위치"]),
      ),
      box: stringOrUndefined(pickValue(row, ["box", "박스", "박스번호"])),
    });
  }

  return { items, skippedRows };
}

export function buildBarcodeQtyMap(
  items: BoxListItem[],
  barcodeQtyOverride?: Map<string, number>,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of items) {
    if (item.quantity <= 0) {
      continue;
    }

    const key = item.barcode.trim();

    if (!key) {
      continue;
    }

    map.set(key, (map.get(key) ?? 0) + item.quantity);
  }

  if (barcodeQtyOverride) {
    for (const key of Array.from(map.keys())) {
      const override = barcodeQtyOverride.get(key);

      if (override != null && override > 0) {
        map.set(key, override);
      }
    }
  }

  return map;
}
