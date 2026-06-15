import * as XLSX from "xlsx";

export function validateBoxListFile(buffer: ArrayBuffer | Buffer): string | null {
  let workbook: XLSX.WorkBook;

  try {
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    workbook = XLSX.read(data, { type: "buffer" });
  } catch {
    return "박스 입고 리스트 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.";
  }

  if (workbook.SheetNames.length === 0) {
    return "박스 입고 리스트에 시트가 없습니다.";
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    return "박스 입고 리스트에 데이터가 없습니다. (헤더만 있거나 빈 파일)";
  }

  const headerKeys = Object.keys(rows[0]).map((key) => key.replace(/\s/g, ""));
  const hasBarcodeCol = headerKeys.some((key) => /바코드|barcode/i.test(key));
  const hasQtyCol = headerKeys.some((key) => /수량|quantity|qty/i.test(key));

  if (!hasBarcodeCol || !hasQtyCol) {
    if (
      workbook.SheetNames.some(
        (name) => name.includes("로켓그로스") || name.includes("입고"),
      )
    ) {
      return (
        "이 파일은 쿠팡 WING 원본 입고 템플릿으로 보입니다. " +
        "박스 입고 리스트 칸과 쿠팡 원본 템플릿 칸이 바뀐 것 같습니다. 확인 후 다시 업로드해주세요."
      );
    }

    return (
      "박스 입고 리스트 형식이 아닙니다. " +
      "필수 컬럼(바코드, 수량)을 찾을 수 없습니다. " +
      `감지된 컬럼: ${Object.keys(rows[0]).slice(0, 6).join(", ")}`
    );
  }

  return null;
}
