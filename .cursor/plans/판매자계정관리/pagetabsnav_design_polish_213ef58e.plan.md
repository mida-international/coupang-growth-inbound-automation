---
name: PageTabsNav Design Polish
overview: 범용 관리자 UI에서 가장 흔한 하단 강조선(underline) 탭 스타일로 PageTabsNav를 재구성합니다. 공통 tabs.tsx는 건드리지 않고 layout 전용 컴포넌트만 수정합니다.
todos:
  - id: refactor-page-tabs-nav
    content: page-tabs-nav.tsx를 Link 기반 underline 관리자 스타일로 재구성
    status: completed
  - id: tweak-coupang-layout-spacing
    content: coupang-growth/layout.tsx 탭-본문 간격 gap-6 조정
    status: completed
  - id: verify-tabs-build
    content: npm run build 및 브라우저 탭 UI 확인
    status: completed
isProject: false
---

# PageTabsNav 관리자 스타일 개선

## 문제 (현재)

[`page-tabs-nav.tsx`](src/components/layout/page-tabs-nav.tsx)가 shadcn `Tabs` line variant에 의존하면서:

- `TabsTrigger` 기본 `flex-1` → 탭 1개일 때도 가로로 늘어남
- `after:bottom-[-5px]` underline이 외부 `border-b`와 겹쳐 어색함
- inactive `text-foreground/60` + 얇은 패딩 → 헤더(breadcrumb) 대비 위계가 약함

## 선택한 스타일: 하단 강조선 (범용 관리자형)

Ant Design, MUI, Vercel/Linear 대시보드 등 **섹션 네비게이션**에 가장 널리 쓰이는 패턴.

| 상태 | 스타일 |
|------|--------|
| 컨테이너 | `border-b border-border`, 탭 영역 `h-11` |
| 활성 | `border-b-2 border-primary text-foreground font-semibold` |
| 비활성 | `text-muted-foreground hover:text-foreground` |
| 간격 | `px-4`, 탭 너비는 콘텐츠에 맞춤 (`inline-flex`, flex-1 없음) |

세그먼트(pill)형은 카드 내부 토글이나 2~3개 뷰 전환에 적합해, **여러 데이터 관리 섹션**에 재사용할 상단 탭에는 underline이 더 범용적.

## 구현 (변경 파일 2개)

### 1. [`src/components/layout/page-tabs-nav.tsx`](src/components/layout/page-tabs-nav.tsx) — 핵심

`Tabs` / `TabsList` / `TabsTrigger` **제거** → `nav` + `Link` 기반 (URL 탭에 더 적합, 스타일 완전 제어).

```tsx
<nav aria-label="페이지 탭" className="border-b border-border">
  <div className="flex h-11 items-end gap-1">
    {tabs.map((tab) => {
      const isActive = tab.href === activeHref;
      return (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "inline-flex h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors",
            isActive
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.title}
        </Link>
      );
    })}
  </div>
</nav>
```

- `getActivePageTabHref` 로직은 그대로 유지
- 접근성: `nav` + `aria-current="page"`

### 2. [`src/app/(dashboard)/data/coupang-growth/layout.tsx`](src/app/(dashboard)/data/coupang-growth/layout.tsx) — 간격 미세 조정

- `PageTabsNav`의 `className="-mx-4 px-4"` 유지 (부모 `p-4` 상쇄)
- `gap-4` → 탭과 본문 사이 `gap-6`으로 여백 확대 (관리자 페이지 섹션 분리감)

```tsx
<div className="flex flex-col gap-6">
  <PageTabsNav tabs={coupangGrowthTabGroup.tabs} className="-mx-4 px-4" />
  {children}
</div>
```

## 변경하지 않는 것

- [`tabs.tsx`](src/components/ui/tabs.tsx) — 다른 곳에서 쓸 수 있으므로 유지
- [`page-tabs.ts`](src/config/page-tabs.ts) — 데이터 구조 동일
- 라우트, DB, API

## 검증

1. `npm run build` 통과
2. 브라우저 `/data/coupang-growth/seller-accounts`:
   - 탭이 콘텐츠 너비만큼만 표시 (늘어나지 않음)
   - 활성 탭 primary 하단선 + semibold
   - 헤더 breadcrumb과 시각적 위계 정리

## 커밋 메시지 (컨벤션)

```
style(MIDACGIA-16): PageTabsNav 관리자형 underline 탭 스타일 적용
```

또는 기존 커밋에 amend하지 않고 별도 style 커밋으로 분리.
