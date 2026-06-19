---
name: Growth 동기화 드롭다운
overview: 데이터 동기화 > 쿠팡 Growth 페이지의 판매자 계정 선택을 라디오에서 드롭다운 +「선택」버튼(드래프트/적용 분리)으로 변경합니다. 업로드 API는 계정 1개 그대로 사용합니다.
todos:
  - id: panel-state
    content: "excel-upload-panel: draft/applied state 및 appliedAccountId로 업로드 연결"
    status: completed
  - id: panel-ui
    content: 라디오 UI를 Select + 선택 버튼 + 미적용 안내로 교체
    status: completed
  - id: verify-build
    content: npm run build로 검증
    status: completed
isProject: false
---

# 쿠팡 Growth 동기화 — 판매자 계정 드롭다운 + 선택 버튼

## 대상

[`src/components/coupang-growth-sync/excel-upload-panel.tsx`](src/components/coupang-growth-sync/excel-upload-panel.tsx)  
(페이지: [`sync/coupang-growth/excel-upload/page.tsx`](src/app/(dashboard)/sync/coupang-growth/excel-upload/page.tsx))

현재: 라디오 목록 + 선택 즉시 반영 (`selectedAccountId` 단일 state)

## UX (사용자 확정)

- **드롭다운**으로 활성 판매자 계정 1개 선택 (draft)
- 옆 **「선택」** 버튼으로 적용 (applied)
- 엑셀 드롭존·업로드는 **적용된 계정**(`appliedAccountId`) 기준 — API 변경 없음

```mermaid
flowchart LR
  dropdown["Select draftAccountId"] --> selectBtn["선택 버튼"]
  selectBtn --> applied["appliedAccountId"]
  applied --> dropzone["ExcelDropzone / 업로드"]
```

| 상태 | 동작 |
|------|------|
| draft ≠ applied | 「선택」버튼 활성 (primary), 안내 문구 표시 |
| draft = applied | 「선택」버튼 비활성 (outline) |
| 업로드 중 | 드롭다운·선택 버튼 비활성 |

## 구현

### 1. State 분리

```tsx
const defaultId = getDefaultSellerAccountId(accounts);
const [draftAccountId, setDraftAccountId] = useState(defaultId);
const [appliedAccountId, setAppliedAccountId] = useState(defaultId);
```

- `selectedAccountId` 참조를 `appliedAccountId`로 교체 (`addFiles`, `handleUpload`, `canUpload`, dropzone `disabled`)
- 「선택」클릭: `setAppliedAccountId(draftAccountId)`, `setUploadResult(null)`

### 2. UI 교체

라디오 `FieldGroup` 블록(약 267–304행)을 아래로 교체:

- 상단: 설명 + `flex` 행 (`Select` + `Button`)
- [`Select`](src/components/ui/select.tsx) / `SelectTrigger` / `SelectContent` / `SelectItem` — [`add-admin-form.tsx`](src/components/members/add-admin-form.tsx) 패턴 참고
- 활성 계정만 `SelectItem` (`account.isActive`)
- `Select` `value={draftAccountId}`, `onValueChange={setDraftAccountId}`
- `SelectTrigger` `className="min-w-[12rem] flex-1 sm:max-w-md"` 등으로 너비 확보
- **선택** 버튼: `size="sm"`, draft ≠ applied일 때 `variant="default"`, 아니면 `outline` + `disabled`
- draft ≠ applied 시 amber 안내 (대시보드 툴바와 동일 톤)

섹션 설명 문구 변경:

> 동기화할 쿠팡 판매자 계정을 고른 뒤 **선택**을 누르세요.

### 3. 범위 외

- API [`excel-upload/route.ts`](src/app/api/coupang-growth-sync/excel-upload/route.ts) — 변경 없음
- `SellerAccountCheckboxList` — 사용하지 않음 (단일 계정 드롭다운)
- 다른 sync/데이터 페이지 — 이번 작업 제외

## 검증

1. 드롭다운에서 계정 변경 → 엑셀 영역은 아직 이전 적용 계정 기준
2. 「선택」 후 dropzone/업로드가 새 계정으로 동작
3. 계정 미선택(활성 계정 0개) 시 기존 empty state 유지
4. `npm run build` 통과

## 커밋 메시지 제안

```
feat: 쿠팡 Growth 동기화 판매자 계정 선택을 드롭다운+선택 버튼으로 변경
```
