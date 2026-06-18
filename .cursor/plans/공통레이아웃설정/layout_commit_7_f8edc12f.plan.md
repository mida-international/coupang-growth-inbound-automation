---
name: Layout Commit 7
overview: "Commit 7: (dashboard)/page.tsx로 대시보드 첫 화면을 만들고, 기존 Next.js 기본 page.tsx를 제거해 / 에서 사이드바·헤더가 보이게 합니다. Commit 8(redirect)은 동일 작업에 포함됩니다."
todos:
  - id: create-dashboard-page
    content: src/app/(dashboard)/page.tsx 대시보드 placeholder 생성
    status: completed
  - id: remove-default-page
    content: src/app/page.tsx (Next.js 기본) 삭제
    status: completed
  - id: save-plan-file
    content: .cursor/plans/layout_commit_7.plan.md 저장
    status: completed
  - id: verify-build-dev
    content: build + dev에서 사이드바 표시 확인 (커밋 없음)
    status: completed
isProject: false
---

# Commit 7: 대시보드 첫 페이지

## 전제

- Commit 1~6 완료 (shell layout 조립됨)
- **커밋 정책:** 작업만 수행. `git commit`은 사용자 명시 요청 시에만
- **이번 커밋 후 `/` 접속 시 사이드바 + 헤더가 화면에 보임**

## 변경

| 작업 | 파일 |
|------|------|
| **신규** | `src/app/(dashboard)/page.tsx` |
| **삭제** | `src/app/page.tsx` |

- `(dashboard)/page.tsx` = `/` (route group)
- navigation `대시보드 href: "/"` 와 일치
- Commit 8 redirect 별도 불필요

## 페이지 내용

대시보드 placeholder — 제목 + 설명 문구

## 검증

```bash
npm run build
npm run dev
```

- 사이드바, 헤더, 대시보드 placeholder 표시
- Next.js 기본 페이지 제거

## 커밋 (사용자 요청 시에만)

```
feat(layout): 대시보드 첫 페이지 추가
```

## 이후

- 레이아웃 공통 작업 MVP 완료 (Commit 1~7)
- 다음: 개별 기능 페이지 (`/trends`, `/inbound` 등)
