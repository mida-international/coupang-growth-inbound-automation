import type { VisionExtractedData } from "@/lib/vision/types";

/**
 * 판매자 마스터(WING 입고 템플릿의 상품명·옵션·바코드)를 이용한 바코드 교정.
 *
 * OCR이 바코드를 살짝 틀리게 읽어도(한 자리 빠짐/자릿값 변형), 같은 행의
 * 상품명 + 옵션으로 판매자 실제 바코드를 조회해 교정한다. "지어내는" 게 아니라
 * 정답 집합(판매자 상품 목록)에서 찾는 것이라, 순수 OCR보다 훨씬 정확하다.
 */

export type MasterBarcodeIndex = {
  /** 정규화된 실제 바코드 집합(이미 맞게 읽힌 바코드는 교정 대상에서 제외). */
  barcodeSet: Set<string>;
  /** 정규화된 "상품명옵션" → 바코드. 유일할 때만 담는다. */
  byNameOption: Map<string, string>;
  /** 퍼지 매칭용 전체 목록. */
  entries: MasterEntry[];
};

export type MasterEntry = {
  name: string; // 정규화된 상품명
  option: string; // 정규화된 옵션
  barcode: string; // 정규화된 바코드
};

export type BarcodeCorrection = {
  from: string;
  to: string;
  productName: string;
  option: string;
};

/** 공백·기호 제거 + 소문자. 상품명/옵션 비교 키. */
export function normalizeText(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[\s\-_.·,()[\]]/g, "");
}

/** 숫자만. 바코드 정규화. */
export function normalizeBarcodeDigits(value: string | undefined): string {
  return (value ?? "").replace(/[^\d]/g, "");
}

/** Levenshtein 편집거리. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/** 0~1 유사도(1 = 동일). */
function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

// 퍼지 교정 임계값 — 잘못된 상품으로 오교정하는 것을 막기 위해 보수적으로.
const NAME_SIM_MIN = 0.75;
const OPTION_SIM_MIN = 0.7;
const SCORE_MIN = 0.82;
const UNIQUE_MARGIN = 0.05; // 2등과의 점수 차가 이보다 작으면 애매 → 교정 안 함

function findMasterBarcode(
  name: string,
  option: string,
  index: MasterBarcodeIndex,
): string | null {
  // 1) 정규화 키 정확 일치(유일).
  const exact = index.byNameOption.get(`${name}${option}`);
  if (exact) {
    return exact;
  }

  // 2) 퍼지: 상품명·옵션 유사도.
  if (!name && !option) {
    return null;
  }

  let best: { barcode: string; score: number } | null = null;
  let secondScore = -1;

  for (const entry of index.entries) {
    const nameSim = similarity(name, entry.name);
    const optionSim = similarity(option, entry.option);
    if (nameSim < NAME_SIM_MIN || optionSim < OPTION_SIM_MIN) {
      continue;
    }
    const score = 0.5 * nameSim + 0.5 * optionSim;
    if (!best || score > best.score) {
      secondScore = best ? best.score : secondScore;
      best = { barcode: entry.barcode, score };
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (best && best.score >= SCORE_MIN && best.score - secondScore >= UNIQUE_MARGIN) {
    return best.barcode;
  }

  return null;
}

/**
 * visionData 의 각 행에서, 바코드가 마스터에 없으면 상품명+옵션으로 실제 바코드를
 * 찾아 교정한다. 이미 마스터에 있는 바코드는 그대로 둔다.
 */
export function correctVisionBarcodesAgainstMaster(
  visionData: VisionExtractedData,
  index: MasterBarcodeIndex,
): { visionData: VisionExtractedData; corrections: BarcodeCorrection[] } {
  const corrections: BarcodeCorrection[] = [];

  const rows = visionData.rows.map((row) => {
    const rawBarcode = row["바코드"] ?? "";
    const barcode = normalizeBarcodeDigits(rawBarcode);

    // 이미 실제 바코드면 손대지 않는다.
    if (barcode && index.barcodeSet.has(barcode)) {
      return row;
    }

    const name = normalizeText(row["등록상품명"] ?? row["상품명"]);
    const option = normalizeText(row["옵션"] ?? row["옵션명"]);
    const corrected = findMasterBarcode(name, option, index);

    if (corrected && corrected !== barcode) {
      corrections.push({
        from: rawBarcode,
        to: corrected,
        productName: row["등록상품명"] ?? "",
        option: row["옵션"] ?? "",
      });
      return { ...row, 바코드: corrected };
    }

    return row;
  });

  return {
    visionData: { columns: visionData.columns, rows },
    corrections,
  };
}
