---
name: Header alignment fix
overview: 사이드바 헤더(미즈코스)와 메인 헤더(토글·breadcrumb)의 높이를 h-14로 통일해 상단 border와 콘텐츠 baseline을 맞춥니다.
todos:
  - id: align-sidebar-header
    content: app-sidebar SidebarHeader를 h-14 items-center로 AppHeader와 통일
    status: completed
  - id: verify-visual
    content: dev 서버에서 상단 정렬 확인 (커밋 없음)
    status: completed
isProject: false
---

# 상단 헤더 간격 정렬

## 원인

| 영역 | 현재 스타일 | 높이 |
|------|------------|------|
| [app-header.tsx](src/components/layout/app-header.tsx) | `h-14 items-center px-4` | **고정 56px** |
| [app-sidebar.tsx](src/components/layout/app-sidebar.tsx) | `SidebarHeader` + `py-3 px-4` | **가변** (기본 `p-2` + padding) |

[sidebar.tsx](src/components/ui/sidebar.tsx)의 `SidebarHeader` 기본값:

```tsx
className={cn("flex flex-col gap-2 p-2", className)}
```

패딩 기반이라 `AppHeader`의 `h-14`와 **높이·border 위치가 어긋남**.

## 수정 (2파일, 최소 변경)

### 1. [src/components/layout/app-sidebar.tsx](src/components/layout/app-sidebar.tsx)

`SidebarHeader` className 변경:

```tsx
// 변경 전
<SidebarHeader className="border-b border-sidebar-border px-4 py-3">

// 변경 후
<SidebarHeader className="flex h-14 shrink-0 flex-row items-center border-b border-sidebar-border px-4 py-0">
```

- `h-14` — AppHeader와 동일 높이
- `flex-row items-center` — 기본 `flex-col gap-2` 덮어씀
- `py-0` — `p-2`/`py-3` 제거, 세로는 height + items-center로 정렬

### 2. [src/components/layout/app-header.tsx](src/components/layout/app-header.tsx)

border 색만 사이드바와 통일 (선택, 시각 일관성):

```tsx
// border-b border-border → border-b border-sidebar-border (선택)
```

또는 그대로 `border-border` 유지해도 높이 맞추면 대부분 해결됨. **이번 수정은 sidebar만으로 충분.**

## 검증

```bash
npm run dev
```

`http://localhost:3000` 에서 확인:

- [ ] 사이드바 "미즈코스"와 헤더 토글·breadcrumb **상단 baseline 정렬**
- [ ] 좌우 `border-b` 구분선 **같은 높이**

## 커밋 (사용자 요청 시)

```
fix(layout): align sidebar and header top spacing
```

또는 한국어:

```
fix(layout): 사이드바·헤더 상단 높이 맞춤
```
