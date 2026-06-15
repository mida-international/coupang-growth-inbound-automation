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
  ShoplingSyncStoppedReason,
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

function formatStoppedReason(reason: ShoplingSyncStoppedReason): string {
  if (reason === "empty_streak") {
    return "연속 빈 청크 5회 도달";
  }

  return "최대 40청크 처리 완료";
}

export function ShoplingSyncPanel({ initialStatus }: ShoplingSyncPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShoplingSyncRunResult | null>(null);

  const isDisabled = !initialStatus.hasApiConfig || loading;
  const { syncPolicy } = initialStatus;

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
            오늘(KST)부터 3개월씩 과거로 최대 {syncPolicy.maxChunks}청크 조회 후
            당일 스냅샷으로 DB에 reload합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">조회 기준</dt>
              <dd>
                {syncPolicy.searchTp} · {syncPolicy.chunkMonths}개월 청크 · 최대{" "}
                {syncPolicy.maxChunks}회
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">중단 조건</dt>
              <dd>연속 빈 청크 {syncPolicy.emptyStop}회</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">스냅샷 기준일 (KST)</dt>
              <dd>{formatYmd(initialStatus.snapshotDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">오늘 적재 행 수</dt>
              <dd>{initialStatus.todayRowCount.toLocaleString()}건</dd>
            </div>
            <div className="sm:col-span-2">
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
          <CardTitle>동기화</CardTitle>
          <CardDescription>
            등록일 기준으로 과거 방향 3개월 창을 연속 조회합니다. 청크 경계일은
            맞닿으며, 중복 SKU는 goods_key+barcode 기준으로 제거합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" disabled={isDisabled} onClick={handleSync}>
            {loading ? "동기화 중..." : "동기화"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <div className="space-y-4 rounded-md border border-border p-4 text-sm">
              <p className="text-primary">동기화가 완료되었습니다.</p>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">조회 기간</dt>
                  <dd>
                    {formatYmd(result.oldestStartDt)} ~{" "}
                    {formatYmd(result.newestEndDt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">스냅샷 기준일</dt>
                  <dd>{formatYmd(result.snapshotDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">처리 청크</dt>
                  <dd>{result.chunksProcessed}개</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">중단 사유</dt>
                  <dd>{formatStoppedReason(result.stoppedReason)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">상품 건수 (합계)</dt>
                  <dd>{result.fetchedProductCount.toLocaleString()}건</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">적재 행 수 (dedupe 후)</dt>
                  <dd>{result.rowCount.toLocaleString()}건</dd>
                </div>
              </dl>

              {result.chunks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">청크</th>
                        <th className="py-2 pr-3 font-medium">기간</th>
                        <th className="py-2 pr-3 font-medium">상품</th>
                        <th className="py-2 font-medium">병합 행</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.chunks.map((chunk) => (
                        <tr
                          key={chunk.chunkIndex}
                          className="border-b border-border/60"
                        >
                          <td className="py-2 pr-3">{chunk.chunkIndex}</td>
                          <td className="py-2 pr-3">
                            {formatYmd(chunk.startDt)} ~{" "}
                            {formatYmd(chunk.endDt)}
                          </td>
                          <td className="py-2 pr-3">{chunk.productCount}</td>
                          <td className="py-2">{chunk.rowsMerged}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
