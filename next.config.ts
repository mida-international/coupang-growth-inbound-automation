import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core는 런타임에 browsers.json 등 패키지 루트 파일을 동적으로
  // 읽는데, Next의 파일 추적(NFT)이 lib만 포함하고 이를 빠뜨려 서버리스에서
  // "Cannot find module .../playwright-core/browsers.json" 오류가 난다.
  // 브라우저 자동화 라우트에 playwright-core 패키지 전체를 강제 포함한다.
  outputFileTracingIncludes: {
    "/api/automation/shopling-negative-stock/run": [
      "./node_modules/playwright-core/**",
    ],
    "/api/automation/shopling-negative-stock/login": [
      "./node_modules/playwright-core/**",
    ],
  },
};

export default nextConfig;
