import * as XLSX from "xlsx";

export function validateInboundTemplateFile(
  buffer: ArrayBuffer | Buffer,
): string | null {
  let workbook: XLSX.WorkBook;

  try {
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    workbook = XLSX.read(data, { type: "buffer" });
  } catch {
    return "쿠팡 WING 입고 템플릿 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.";
  }

  const mainSheetName = workbook.SheetNames.find(
    (name) => !name.includes("사용법") && !name.includes("유의사항"),
  );

  if (!mainSheetName) {
    return "쿠팡 WING 입고 템플릿 형식이 아닙니다. (데이터 시트 없음)";
  }

  const worksheet = workbook.Sheets[mainSheetName];

  if (!worksheet?.["!ref"]) {
    return "쿠팡 WING 입고 템플릿 형식이 아닙니다. (빈 시트)";
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const colCount = range.e.c - range.s.c + 1;

  if (colCount < 25) {
    if (colCount <= 15) {
      return (
        "이 파일은 박스 입고 리스트로 보입니다. " +
        "쿠팡 WING 원본 템플릿 칸과 박스 입고 리스트 칸이 바뀐 것 같습니다. 확인 후 다시 업로드해주세요."
      );
    }

    return (
      `쿠팡 WING 입고 템플릿 형식이 아닙니다. ` +
      `컬럼 수가 너무 적습니다 (${colCount}열). 쿠팡 WING > 로켓그로스 > 입고요청 메뉴에서 다운로드한 원본 파일을 사용해주세요.`
    );
  }

  const optionIdCell = worksheet[XLSX.utils.encode_cell({ r: 2, c: 6 })];
  const barcodeCell = worksheet[XLSX.utils.encode_cell({ r: 2, c: 27 })];
  const optionIdHeader = optionIdCell ? String(optionIdCell.v).trim() : "";
  const barcodeHeader = barcodeCell ? String(barcodeCell.v).trim() : "";

  if (!/옵션.*ID|Option.*ID/i.test(optionIdHeader)) {
    return "쿠팡 WING 입고 템플릿 G열(옵션 ID)이 확인되지 않습니다. 쿠팡 WING에서 최신 템플릿을 다시 다운로드해주세요.";
  }

  if (!/바코드|barcode/i.test(barcodeHeader)) {
    return "쿠팡 WING 입고 템플릿 AB열(상품바코드)이 확인되지 않습니다. 쿠팡 WING에서 최신 템플릿을 다시 다운로드해주세요.";
  }

  if (range.e.r < 4) {
    return "쿠팡 WING 입고 템플릿에 상품 데이터가 없습니다. (헤더만 있음)";
  }

  return null;
}
