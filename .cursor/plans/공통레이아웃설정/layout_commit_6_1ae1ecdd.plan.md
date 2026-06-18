---
name: Layout Commit 6
overview: "Commit 6: SidebarProvider + AppSidebar + AppHeader + SidebarInset으로 dashboard shell layout을 조립하고, root layout에 TooltipProvider를 추가합니다. 화면 확인은 Commit 7에서 page를 (dashboard) 아래로 옮긴 후 가능합니다."
todos:
  - id: add-tooltip-provider
    content: src/app/layout.tsx에 TooltipProvider 추가
    status: completed
  - id: create-dashboard-layout
    content: src/app/(dashboard)/layout.tsx shell 조립
    status: completed
  - id: save-plan-file
    content: .cursor/plans/layout_commit_6.plan.md 저장
    status: completed
  - id: verify-build
    content: npm run build 검증 (커밋 없음)
    status: completed
isProject: false
---

# Commit 6: dashboard route group shell

## 전제

- Commit 1~5 완료 (`AppSidebar`, `AppHeader`, `navigation.ts`)
- **커밋 정책:** 작업만 수행. `git commit`은 사용자 명시 요청 시에만
- **shadcn 추가 설치 없음**

## 변경 파일

| 파일 | 작업 |
|------|------|
| [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx) | **신규** — admin shell 조립 |
| [src/app/layout.tsx](src/app/layout.tsx) | `TooltipProvider`로 `body` children 감싸기 |

## Shell 구조

```mermaid
flowchart LR
  subgraph root [RootLayout]
    TooltipProvider
  end
  subgraph dash [dashboard_layout]
    SidebarProvider
    AppSidebar
    SidebarInset
    AppHeader
    children[children]
  end
  TooltipProvider --> dash
```

## 작업 1: root layout — TooltipProvider

`TooltipProvider`로 `body` children 감싸기 (sidebar collapsed 툴팁)

## 작업 2: dashboard layout

`SidebarProvider` + `AppSidebar` + `SidebarInset` + `AppHeader` + content area

## 화면 확인 참고

`src/app/page.tsx`는 `(dashboard)` 밖에 있어 Commit 6만으로 `/`에서 shell 미적용. Commit 7 이후 확인.

## 검증

```bash
npm run build
```

## 커밋 (사용자 요청 시에만)

```
feat(layout): add dashboard route group shell
```

## 다음 커밋

- Commit 7: `(dashboard)/page.tsx` + `app/page.tsx` 정리
- Commit 8: (필요 시) root redirect

```mermaid
flowchart LR
  C5[Commit5_done]
  C6[Commit6_shell]
  C7[Commit7_dashboard_page]
  C5 --> C6 --> C7
```
