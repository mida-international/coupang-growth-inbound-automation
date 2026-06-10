# nextjs-admin-starter

관리자(Admin) 웹 프로젝트를 빠르게 시작하기 위한 공용 starter입니다.
새 관리자 프로젝트를 만들 때마다 환경 설정을 반복하지 않도록, 검증된 기술 스택과 버전을 미리 고정해 두었습니다.

---

## 목적

- 새 관리자 프로젝트의 **시작 시간을 줄이기 위한 공용 자산**입니다.
- 프로젝트마다 "무슨 스택을 쓸지, 어떤 버전을 쓸지" 다시 고민하지 않도록 **표준을 하나로 통일**합니다.
- 누가 어느 프로젝트에 투입되어도 **같은 구조·같은 패턴**을 보게 됩니다.

이 저장소는 GitHub의 **Template repository** 로 설정되어 있습니다.
새 프로젝트는 이 템플릿을 복제해서 시작합니다. (아래 "사용법" 참고)

---

## 기술 스택

번들러는 Turbopack(Next.js 16 기본), 데이터베이스는 PostgreSQL(Supabase)을 전제로 합니다.

| 구분 | 패키지 | 버전 | 역할 |
| --- | --- | --- | --- |
| 기반 | Next.js | 16.2.7 (고정) | 라우팅·서버처리·빌드를 담당하는 React 프레임워크 |
| 기반 | React | 19.2.7 (고정) | 화면을 컴포넌트로 조립하는 UI 라이브러리 |
| 기반 | react-dom | 19.2.7 (고정) | React를 실제 브라우저 화면에 그려주는 짝 패키지 |
| 기반 | TypeScript | create-next-app 동봉 | 타입으로 오타·실수를 미리 잡는 안전장치 |
| 기반 | ESLint | create-next-app 동봉 | 버그·나쁜 패턴을 자동 검사 |
| UI | Tailwind CSS | create-next-app 동봉 | class만 붙여 빠르게 꾸미는 스타일 도구 |
| UI | shadcn/ui | 4.11.0 (고정) | 버튼·테이블 등을 내 코드로 복사해 쓰는 부품 모음 |
| UI | lucide-react | latest | shadcn이 기본으로 쓰는 아이콘 세트 |
| 데이터 화면 | @tanstack/react-table | latest | 목록 테이블의 정렬·필터·페이지네이션 |
| 데이터 화면 | react-hook-form | latest | 입력 폼을 효율적으로 다루는 도구 |
| 데이터 화면 | @hookform/resolvers | latest | react-hook-form과 zod를 연결하는 어댑터 |
| 데이터 화면 | zod | latest | 입력값이 규칙에 맞는지 검사 |
| 데이터 화면 | recharts | latest | 대시보드 차트·그래프 |
| DB | prisma | 6.19.3 (고정) | SQL 없이 코드로 DB를 다루는 ORM (개발용) |
| DB | @prisma/client | 6.19.3 (고정) | 실제 쿼리를 실행하는 Prisma 클라이언트 |

`latest` 로 표시된 패키지는 최초 생성 시점의 최신 버전이 설치되며, 그 정확한 버전이
`package-lock.json` 에 고정됩니다. **재현성의 기준은 이 표가 아니라 커밋된 `package-lock.json` 입니다.**

### 요구 환경

- Node.js `>= 24.16.0` (`.nvmrc` 에 명시)
- npm (프로젝트 표준 패키지 매니저)

---

## 사용법 (새 프로젝트 시작하기)

> 새 프로젝트를 시작할 때 **생성 스크립트를 다시 돌리지 않습니다.**
> 이 템플릿을 복제한 뒤 `npm ci` 로 셋업합니다.

### 1. 템플릿에서 새 저장소 만들기

이 저장소 페이지 상단의 초록색 **"Use this template" → "Create a new repository"** 버튼을 누릅니다.
새 프로젝트 이름(예: `coupang-growth-admin`)을 정하면, 내용을 통째로 복사한 **독립된 새 저장소**가 생성됩니다.

### 2. 내 PC로 clone

```bash
git clone https://github.com/<계정>/<새-프로젝트명>.git
cd <새-프로젝트명>
```

### 3. 셋업

```bash
nvm use              # .nvmrc 를 읽어 Node 버전을 맞춤
npm ci               # package-lock.json 대로 "정확히" 설치 (npm install 아님)
cp .env.example .env # 환경변수 틀 복사 → .env 에 이 프로젝트의 실제 값 입력
npx prisma generate  # Prisma 클라이언트 생성
npm run dev          # 개발 서버 실행 (http://localhost:3000)
```

> **`npm install` 이 아니라 `npm ci` 를 쓰는 이유**
> `npm ci` 는 `package-lock.json` 에 적힌 버전만 정확히 설치합니다.
> "내 PC에선 되는데 다른 PC에선 안 돼" 문제를 막아줍니다.

---

## 환경변수 (.env)

`.env` 는 **절대 커밋하지 않습니다** (비밀번호·키 유출 방지).
필요한 변수의 목록은 `.env.example` 에 키 이름만 적혀 있습니다.

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL 연결 문자열 (대시보드 > Project Settings > Database > Connection string) |

---

## DB 접근 가이드

이 starter의 **기본 DB 접근 방식은 Prisma(ORM)** 입니다.
대부분의 관리자 프로젝트는 여러 테이블을 CRUD하므로 Prisma가 잘 맞습니다.

다만 Prisma는 **강제가 아니라 기본값**입니다.
대량 적재·집계 위주(예: append-only 로그 적재, 배치 단위 통계)처럼 ORM의 객체 매핑 이점이
덜한 프로젝트는, 생SQL 또는 Supabase 클라이언트(`@supabase/supabase-js`)를 직접 써도 됩니다.
워크로드에 맞는 방식을 프로젝트별로 선택하세요.

---

## 의존성 업데이트 정책

평소에는 `package-lock.json` 을 고정해 두어 모두가 같은 버전을 사용합니다.
업데이트가 필요할 때(예: 보안 패치)는 **한 사람이 의도적으로** 다음을 수행합니다.

```bash
npm update                  # 또는 특정 패키지만: npm install <pkg>@<version>
npm run dev                 # 동작 확인
git add package-lock.json package.json
git commit -m "chore: update dependencies"
```

커밋된 변경은 다른 사람의 다음 `npm ci` 에서 그대로 반영됩니다.
즉 업데이트는 "각자 알아서"가 아니라 "한 번에, 커밋을 통해" 전파됩니다.

---

## 폴더 구조 (생성 직후)

```
<프로젝트명>/
├─ src/
│  └─ app/            # Next.js App Router (페이지·레이아웃)
├─ prisma/
│  └─ schema.prisma   # DB 스키마 정의
├─ components.json    # shadcn/ui 설정
├─ .nvmrc            # Node 버전 고정
├─ .env.example      # 필요한 환경변수 목록 (커밋함)
├─ .env              # 실제 환경변수 (커밋 안 함)
├─ package.json
└─ package-lock.json # 의존성 버전 잠금 (반드시 커밋)
```

---

## 참고: 이 starter는 어떻게 만들어졌나

최초 생성은 `scripts/create-next-admin-starter.sh` 스크립트로 1회 수행되었습니다. (26.06.09 기준)
이 파일은 **프로젝트 생성 스크립트**이며, 이미 이 저장소가 만들어진 뒤에는 다시 실행할 필요가 없습니다.
새 프로젝트는 위 "사용법" 대로 템플릿 복제로 시작합니다.

스크립트는 "어떤 구성으로 만들었는지" 기록용으로 보관해 두었지만, **삭제해도 프로젝트 동작에는 영향이 없습니다.**
더 이상 참고할 필요가 없다면 `scripts/create-next-admin-starter.sh` 를 지워도 됩니다.
