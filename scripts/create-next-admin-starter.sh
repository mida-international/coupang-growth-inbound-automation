#!/usr/bin/env bash
set -e

# =====================================================================
# 회사 공용 관리자 프로젝트 starter — 최초 생성 스크립트 (1회성)
#
# [용도] 새 관리자 프로젝트를 시작할 때 공통 뼈대를 깔아주는 자산.
# [주의] 이 스크립트는 "프로젝트를 처음 만들 때"만 사용합니다.
#        한 번 생성한 뒤에는 다시 돌리지 마세요.
#        이후 셋업은 git clone + npm ci 로 합니다. (README 참고)
#        스크립트는 "어떤 구성으로 만들었는지" 기록용으로 보관합니다.
#
# [버전 정책]
#  - next / react / react-dom / prisma / shadcn : 버전 고정 (회사 표준)
#  - 그 외 패키지 : 생성 시점 latest → package-lock.json 에 박제됨
#  - 재현성의 기준은 이 스크립트가 아니라 커밋된 package-lock.json
# =====================================================================

PROJECT_NAME="${1:-nextjs-admin-starter}"
NODE_VERSION="24.16.0"
NEXT_VERSION="16.2.7"
REACT_VERSION="19.2.7"
PRISMA_VERSION="6.19.3"
SHADCN_VERSION="4.11.0"

echo "======================================"
echo "Next.js 관리자 starter 생성"
echo "프로젝트명: $PROJECT_NAME"
echo "Node $NODE_VERSION / Next $NEXT_VERSION / React $REACT_VERSION / Prisma $PRISMA_VERSION"
echo "======================================"
echo ""

echo "01. 개발환경 확인"
git -v
node -v
npm -v
echo ""

echo "02. 기존 동일 폴더 삭제"
rm -rf "$PROJECT_NAME"
echo ""

echo "03. Next.js 프로젝트 생성"
npx --yes create-next-app@"$NEXT_VERSION" "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

cd "$PROJECT_NAME"
echo ""

echo "04. Node 버전 고정 (.nvmrc + package.json engines)"
echo "$NODE_VERSION" > .nvmrc
node -e "const f='package.json';const p=require('./'+f);p.engines={node:'>=$NODE_VERSION'};require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n');"
echo ""

echo "05. Next / React 버전 고정 설치"
npm install next@"$NEXT_VERSION" react@"$REACT_VERSION" react-dom@"$REACT_VERSION"
echo ""

echo "06. 관리자 대시보드 필수 패키지 설치"
npm install @tanstack/react-table react-hook-form @hookform/resolvers zod recharts lucide-react
echo ""

echo "07. Prisma 설치 (6.x 고정)"
npm install @prisma/client@"$PRISMA_VERSION"
npm install -D prisma@"$PRISMA_VERSION"
echo ""

echo "08. Prisma PostgreSQL 초기화 (Supabase 호환, .env 방식)"
npx --yes prisma init --datasource-provider postgresql
echo ""

echo "09. shadcn/ui 초기화"
npx --yes shadcn@"$SHADCN_VERSION" init -d --yes
echo ""

echo "10. shadcn/ui 기본 컴포넌트 추가"
# base-nova: form 대신 field (v4 폼 래퍼)
npx --yes shadcn@"$SHADCN_VERSION" add button input label textarea select checkbox dialog dropdown-menu table tabs card badge separator field sheet breadcrumb avatar skeleton sidebar collapsible --yes
echo ""

echo "11. 설치 버전 확인"
npm list next react react-dom prisma @prisma/client @tanstack/react-table react-hook-form @hookform/resolvers zod recharts lucide-react
echo ""

echo "======================================"
echo "starter 생성 완료"
echo "======================================"
echo ""
echo "다음 단계:"
echo "1) .env 의 DATABASE_URL 을 Supabase 연결 문자열로 수정"
echo "   (Supabase 대시보드 > Project Settings > Database > Connection string)"
echo "2) git init && git add -A && git commit -m 'chore: initial admin starter'"
echo "   (package-lock.json 과 .nvmrc 가 반드시 커밋되어야 함)"
echo "3) 원격 저장소(또는 템플릿 repo)에 push"
echo ""
echo "[참고] 이 starter의 기본 DB 접근은 Prisma 입니다."
echo "       단, 대량 적재·집계 위주 프로젝트는 생SQL 또는 Supabase 클라이언트를"
echo "       직접 써도 됩니다. (README 의 DB 가이드 참고)"