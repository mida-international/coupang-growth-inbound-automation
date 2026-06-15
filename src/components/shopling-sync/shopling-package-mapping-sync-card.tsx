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
  SyncShoplingPackageMappingResult,
  SyncShoplingPackageMappingStats,
} from "@/services/shopling-package-mapping/types";

type ShoplingPackageMappingSyncCardProps = {
  hasApiConfig: boolean;
};

function formatBool(value: boolean): string {
  return value ? "예" : "아니오";
}

function StatsSummary({ stats }: { stats: SyncShoplingPackageMappingStats }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">API 파싱 매핑 수</dt>
        <dd>{stats.total.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">DB 반영 (upsert)</dt>
        <dd>{stats.upserted.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">수동 편집 보호 (skip)</dt>
        <dd>{stats.skipped_manual.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">패키지 바코드 누락</dt>
        <dd>{stats.missing_package_barcode.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">단품 바코드 누락</dt>
        <dd>{stats.missing_single_barcode.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">단품 자사코드 누락</dt>
        <dd>{stats.missing_single_ptn_goods_cd.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">중복 제거</dt>
        <dd>{stats.duplicates_removed.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">prune 삭제</dt>
        <dd>{stats.deleted.toLocaleString()}건</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">prune 스킵</dt>
        <dd>{formatBool(stats.prune_skipped)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">prune 시 수동 보호</dt>
        <dd>{stats.prune_protected_manual.toLocaleString()}건</dd>
      </div>
    </dl>
  );
}

export function ShoplingPackageMappingSyncCard({
  hasApiConfig,
}: ShoplingPackageMappingSyncCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncShoplingPackageMappingResult | null>(
    null,
  );

  const isDisabled = !hasApiConfig || loading;

  async function handleSync() {
    setError(null);
    setResult(null);
    setLoading(true);

    const response = await apiPost<SyncShoplingPackageMappingResult>(
      "/api/shopling/package-mapping/sync",
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
    <Card>
      <CardHeader>
        <CardTitle>패키지 매핑 동기화</CardTitle>
        <CardDescription>
          샵플링 pkgOptMappings를 조회해 패키지-구성단품 매핑을 upsert합니다.
          manually_edited=true 행은 덮어쓰지 않으며, 응답에 없는 자동 행은 prune
          대상입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasApiConfig ? (
          <p className="text-sm text-muted-foreground">
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

        <Button type="button" disabled={isDisabled} onClick={handleSync}>
          {loading ? "동기화 중..." : "패키지 매핑 동기화"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {result ? (
          <div className="space-y-4 rounded-md border border-border p-4 text-sm">
            <p className="text-primary">패키지 매핑 동기화가 완료되었습니다.</p>
            <StatsSummary stats={result.stats} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
