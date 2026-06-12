"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type {
  ShoplingSyncRunResult,
  ShoplingSyncStatus,
} from "@/services/shopling-sync/types";

type ShoplingSyncPanelProps = {
  initialStatus: ShoplingSyncStatus;
};

function formatYmd(ymd: string): string {
  if (ymd.length !== 8) {
    return ymd;
  }

  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}

export function ShoplingSyncPanel({ initialStatus }: ShoplingSyncPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShoplingSyncRunResult | null>(null);

  const isDisabled = !initialStatus.hasApiConfig || loading;

  async function handleSync() {
    setError(null);
    setResult(null);
    setLoading(true);

    const response = await apiPost<ShoplingSyncRunResult>(
      "/api/shopling-sync/run",
      {},
    );

    setLoading(false);

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setResult(response.data);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>동기화 상태</CardTitle>
          <CardDescription>
            확인용 1회 동기화 — API 1회 호출 후 당일 스냅샷으로 DB에
            reload합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">조회 구간 (고정)</dt>
              <dd>
                {formatYmd(initialStatus.verifyWindow.startDt)} ~{" "}
                {formatYmd(initialStatus.verifyWindow.endDt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">스냅샷 기준일 (KST)</dt>
              <dd>{formatYmd(initialStatus.snapshotDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">오늘 적재 행 수</dt>
              <dd>{initialStatus.todayRowCount.toLocaleString()}건</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">마지막 동기화</dt>
              <dd>
                {initialStatus.lastIngestion
                  ? `${formatDateTime(initialStatus.lastIngestion.createdAt)} · ${initialStatus.lastIngestion.rowCount.toLocaleString()}건${
                      initialStatus.lastIngestion.uploadedByName
                        ? ` · ${initialStatus.lastIngestion.uploadedByName}`
                        : ""
                    }`
                  : "없음"}
              </dd>
            </div>
          </dl>

          {!initialStatus.hasApiConfig ? (
            <p className="text-muted-foreground">
              API 설정이 필요합니다.{" "}
              <Link
                href="/integrations/shopling"
                className="text-primary underline-offset-4 hover:underline"
              >
                외부 연동 &gt; 샵플링
              </Link>
              에서 인증 정보를 저장해 주세요.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>확인용 동기화</CardTitle>
          <CardDescription>
            2022년 4~6월 등록 상품을 1회 조회해 `shopling_inventory`에
            적재합니다. DB 매핑 검증용입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" disabled={isDisabled} onClick={handleSync}>
            {loading ? "동기화 중..." : "확인용 동기화 (1회)"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-border p-4 text-sm">
              <p className="text-primary">동기화가 완료되었습니다.</p>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">조회 기간</dt>
                  <dd>
                    {formatYmd(result.startDt)} ~ {formatYmd(result.endDt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">스냅샷 기준일</dt>
                  <dd>{formatYmd(result.snapshotDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">상품 건수</dt>
                  <dd>{result.fetchedProductCount.toLocaleString()}건</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">적재 행 수</dt>
                  <dd>{result.rowCount.toLocaleString()}건</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
