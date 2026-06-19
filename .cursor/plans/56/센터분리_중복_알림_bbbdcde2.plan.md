---
name: 센터분리 중복 알림
overview: 센터분리 바코드 등록 시 DB에 이미 있는 바코드는 등록하지 않고 `existingBarcodes`로 반환하며, 단건·엑셀 모두 Dialog로 ‘이미 등록’·‘대시보드 없음’ 목록을 구분해 보여줍니다.
todos:
  - id: backend-existing
    content: existingBarcodes 타입·상수 + upsert/create/API·파서 반영
    status: completed
  - id: ui-dialogs
    content: 단건·엑셀 Dialog (이미 등록 / 대시보드 없음 구분)
    status: completed
  - id: verify-existing
    content: 서비스·파서 테스트 + 빌드 검증
    status: completed
isProject: false
---

# 센터분리 바코드 중복·누락 팝업

## 현황

- 단건 추가: [`create-center-separation-barcode.ts`](src/services/center-separation/create-center-separation-barcode.ts) → `upsert` → **이미 있어도 성공** (`stats.updated`만 증가)
- 엑셀: [`center-separation-add-section.tsx`](src/components/center-separation/center-separation-add-section.tsx) — `missingBarcodes`만 Dialog, 중복(DB 기존) 미표시
- upsert: [`upsert-center-separation-barcodes.ts`](src/services/center-separation/upsert-center-separation-barcodes.ts) — 기존 바코드도 `upsert` 호출

## 목표 UX

| 상황 | 동작 |
|------|------|
| 단건 — 대시보드 없음 | 기존 Dialog 유지 |
| 단건 — **이미 센터분리 DB에 있음** | 등록 안 함 → Dialog: "이미 등록된 바코드입니다" + 바코드 표시 |
| 엑셀 — 일부/전부 처리 후 | Dialog에 **섹션 2개**: `이미 등록된 바코드` / `대시보드에 없는 바코드` (각 스크롤 목록) |
| 엑셀 — 신규만 있으면 | 기존처럼 notice만, Dialog는 existing·missing이 있을 때만 |

중복 정의: **센터분리 DB에 이미 있는 바코드만** (엑셀 파일 내 반복 행은 기존처럼 dedupe 후 무시)

## 백엔드

### 1. 타입·상수 — [`types.ts`](src/services/center-separation/types.ts)

```ts
export const CENTER_SEPARATION_ALREADY_EXISTS_ERROR = "이미 등록된 바코드입니다.";

export type UpsertCenterSeparationResult = {
  stats: UpsertCenterSeparationStats;
  missingBarcodes: string[];
  existingBarcodes: string[];  // 신규
};
```

`CenterSeparationServiceResult` 실패 시에도 `existingBarcodes?: string[]` 허용.

### 2. upsert 분리 — [`upsert-center-separation-barcodes.ts`](src/services/center-separation/upsert-center-separation-barcodes.ts)

- DB 조회 후 `knownBarcodes`를 `toCreate` / `existingBarcodes`로 분리
- **`toCreate`만** `create` (기존 바코드는 upsert·갱신하지 않음)
- `stats.updated` 제거 또는 항상 0 (UI [`summarizeUpsert`](src/components/center-separation/center-separation-add-section.tsx)에서 `갱신` 문구 제거)
- 성공 조건: `created > 0` **또는** `existingBarcodes.length > 0` (전부 중복이어도 ok + 목록 반환)
- `created === 0 && existing === 0 && errors` → 기존처럼 실패

### 3. 단건 추가 — [`create-center-separation-barcode.ts`](src/services/center-separation/create-center-separation-barcode.ts)

- 대시보드 검증 후 DB 존재 여부 조회
- 이미 있으면 `{ ok: false, error: CENTER_SEPARATION_ALREADY_EXISTS_ERROR, existingBarcodes: [normalized] }`
- 없을 때만 `upsertCenterSeparationBarcodes([normalized])` 호출

### 4. API 응답 — [`center-separation-response.ts`](src/lib/api/center-separation-response.ts), [`parse-upsert-response.ts`](src/lib/center-separation/parse-upsert-response.ts)

- 성공·실패 JSON 모두 `existingBarcodes: string[]` 포함
- 클라이언트 파서·타입에 `existingBarcodes` 필드 추가

## 프론트엔드 — [`center-separation-add-section.tsx`](src/components/center-separation/center-separation-add-section.tsx)

### 공통 목록 UI

- `MissingBarcodesList` → `BarcodeListSection` (title + barcodes) 재사용

### 단건 Dialog (신규)

- `singleExistingDialogOpen` + 바코드 표시
- `handleAddBarcode`에서 `CENTER_SEPARATION_ALREADY_EXISTS_ERROR` 또는 `existingBarcodes` 처리

### 엑셀 결과 Dialog (통합)

- 상태: `{ existingBarcodes: string[]; missingBarcodes: string[] } | null`
- 기존 `missingBarcodesDialog` 대체
- 업로드 성공/부분 성공 시 `existing` 또는 `missing`이 있으면 Dialog 오픈
- 전부 대시보드 없음(기존 전량 실패)은 기존 에러 Dialog 유지

```tsx
// 예시 구조
<DialogTitle>등록 결과 안내</DialogTitle>
{existing.length > 0 && <BarcodeListSection title="이미 등록된 바코드" ... />}
{missing.length > 0 && <BarcodeListSection title="대시보드에 없는 바코드" ... />}
```

## 테스트

- [`upsert-center-separation-barcodes.test.ts`](src/services/center-separation/upsert-center-separation-barcodes.test.ts) (신규): mock 없이 분리 로직이 있다면 pure helper 테스트; 없으면 `create` 경로 단위 테스트 수준
- [`create-center-separation-barcode.test.ts`](src/services/center-separation/create-center-separation-barcode.test.ts): 빈 바코드 거부 (기존 패턴)
- [`parse-upsert-response.test.ts`](src/lib/center-separation/parse-upsert-response.test.ts) (있으면 확장): `existingBarcodes` 파싱

## 검증

- 단건: 등록된 바코드 재입력 → Dialog, DB 변경 없음
- 엑셀: 신규+중복+없음 혼합 → 신규만 등록, Dialog에 중복·없음 목록 분리 표시
- `npm run build`
