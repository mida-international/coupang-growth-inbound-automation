import * as XLSX from "xlsx";

import { SHOPLING_OUTBOUND_LAYOUT } from "@/lib/excel/targets/shopling-gross-outbound-template";

function getMainWorksheet(workbook: XLSX.WorkBook): {
  sheetName: string;
  worksheet: XLSX.WorkSheet;
} | null {
  const sheetName =
    workbook.SheetNames.find((name) => name === SHOPLING_OUTBOUND_LAYOUT.sheetName) ??
    workbook.SheetNames[0];

  if (!sheetName) {
    return null;
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return null;
  }

  return { sheetName, worksheet };
}

export function validateShoplingOutboundTemplateFile(
  buffer: ArrayBuffer | Buffer,
): string | null {
  let workbook: XLSX.WorkBook;

  try {
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    workbook = XLSX.read(data, { type: "buffer" });
  } catch {
    return "샵플링 출고 템플릿 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.";
  }

  const main = getMainWorksheet(workbook);

  if (!main) {
    return "샵플링 출고 템플릿 형식이 아닙니다. (데이터 시트 없음)";
  }

  const { worksheet } = main;

  if (!worksheet["!ref"]) {
    return "샵플링 출고 템플릿 형식이 아닙니다. (빈 시트)";
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  if (range.e.r + 1 < SHOPLING_OUTBOUND_LAYOUT.headerRowCount) {
    return "샵플링 출고 템플릿 형식이 아닙니다. (헤더 행 부족)";
  }

  const headerTexts: string[] = [];

  for (let rowIndex = 0; rowIndex < SHOPLING_OUTBOUND_LAYOUT.headerRowCount; rowIndex++) {
    for (let colIndex = 0; colIndex <= range.e.c; colIndex++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];

      if (cell?.v != null && String(cell.v).trim()) {
        headerTexts.push(String(cell.v).trim());
      }
    }
  }

  const headerJoined = headerTexts.join(" ");

  if (!/바코드|barcode/i.test(headerJoined)) {
    return "샵플링 출고 템플릿 A열(바코드) 헤더가 확인되지 않습니다.";
  }

  if (!/수량|차감|qty|quantity/i.test(headerJoined)) {
    return "샵플링 출고 템플릿 D열(차감 수량) 헤더가 확인되지 않습니다.";
  }

  return null;
}
