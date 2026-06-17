import type { NextConfig } from "next";

const AUTOMATION_API_ROUTES = [
  "/api/automation/shopling-negative-stock/run",
  "/api/automation/shopling-negative-stock/login",
] as const;

// playwright-core/** 전체는 Turbopack NFT가 repo 전체를 추적한다고 경고한다.
// 런타임에 필요한 파일만 명시한다 (browsers.json 동적 require 대응).
const PLAYWRIGHT_CORE_TRACE = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/package.json",
  "./node_modules/playwright-core/index.js",
  "./node_modules/playwright-core/index.mjs",
  "./node_modules/playwright-core/lib/**",
] as const;

const AUTOMATION_TRACE_INCLUDES = [
  ...PLAYWRIGHT_CORE_TRACE,
  "./public/templates/stockIpReg.xlsx",
] as const;

const outputFileTracingIncludes = Object.fromEntries(
  AUTOMATION_API_ROUTES.map((route) => [route, [...AUTOMATION_TRACE_INCLUDES]]),
) satisfies NextConfig["outputFileTracingIncludes"];

const nextConfig: NextConfig = {
  outputFileTracingIncludes,
};

export default nextConfig;
