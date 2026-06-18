import * as XLSX from "xlsx";

import { CENTER_SEPARATION_EXCEL_HEADERS } from "@/lib/excel/targets/center-separation";

function getDisplayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    width += character.charCodeAt(0) > 0x7f ? 2 : 1;
  }

  return width;
}

export const CENTER_SEPARATION_TEMPLATE_FILENAME = "센터분리_관리_템플릿.xlsx";

export function generateCenterSeparationTemplateBuffer(): Buffer {
  const outputRow = { 바코드: "" };
  const worksheet = XLSX.utils.json_to_sheet([outputRow], {
    header: [...CENTER_SEPARATION_EXCEL_HEADERS],
  });

  worksheet["!cols"] = [
    { wch: Math.min(getDisplayWidth("바코드") + 4, 80) },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "센터분리");

  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
