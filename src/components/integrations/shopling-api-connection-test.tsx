"use client";

import { useState } from "react";

import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShoplingApiConnectionTestResult } from "@/services/shopling-api-config/types";

type ShoplingApiConnectionTestProps = {
  hasConfig: boolean;
  isFormDirty: boolean;
};

function formatHttpStatus(status: number | null): string {
  return status === null ? "-" : String(status);
}

export function ShoplingApiConnectionTest({
  hasConfig,
  isFormDirty,
}: ShoplingApiConnectionTestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShoplingApiConnectionTestResult | null>(
    null,
  );

  const isDisabled = !hasConfig || isFormDirty || loading;

  async function handleTest() {
    setError(null);
    setResult(null);
    setLoading(true);

    const response = await apiPost<ShoplingApiConnectionTestResult>(
      "/api/integrations/shopling/test",
      {},
    );

    setLoading(false);

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setResult(response.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>연동 테스트</CardTitle>
        <CardDescription>
          저장된 인증 정보로 샵플링 상품조회 API에 최근 7일 구간 1회 요청합니다.
          상품 데이터는 DB에 저장되지 않습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasConfig ? (
          <p className="text-sm text-muted-foreground">
            API 설정을 먼저 저장해 주세요.
          </p>
        ) : null}
        {isFormDirty ? (
          <p className="text-sm text-muted-foreground">
            변경된 설정이 있습니다. 저장 후 연동 테스트를 실행해 주세요.
          </p>
        ) : null}
        <div>
          <Button type="button" disabled={isDisabled} onClick={handleTest}>
            {loading ? "테스트 중..." : "연동 테스트"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {result ? (
          <div className="space-y-2 rounded-md border border-border p-4 text-sm">
            <p className={result.ok ? "text-primary" : "text-destructive"}>
              {result.message}
            </p>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">HTTP 상태</dt>
                <dd>{formatHttpStatus(result.httpStatus)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">소요 시간</dt>
                <dd>{result.durationMs}ms</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">조회 기간</dt>
                <dd>
                  {result.startDt} ~ {result.endDt}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">상품 건수</dt>
                <dd>{result.productCount}</dd>
              </div>
            </dl>
            {result.apiError ? (
              <p className="text-destructive">API 오류: {result.apiError}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
