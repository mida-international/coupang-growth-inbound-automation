import * as XLSX from "xlsx";

import { parseShoplingInboundList } from "@/lib/excel/parsers/parse-shopling-inbound-list";

export function validateShoplingInboundListFile(
  buffer: ArrayBuffer | Buffer,
): string | null {
  let workbook: XLSX.WorkBook;

  try {
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    workbook = XLSX.read(data, { type: "buffer" });
  } catch {
    return "입고 리스트 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.";
  }

  if (workbook.SheetNames.length === 0) {
    return "입고 리스트에 시트가 없습니다.";
  }

  const { items } = parseShoplingInboundList(buffer);

  if (items.length === 0) {
    return "입고 리스트에서 유효한 D열(자사상품명)·I열(수량) 데이터를 찾을 수 없습니다.";
  }

  return null;
}
