"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { buildWorkbenchQuery } from "@/components/inbound-workbench/build-workbench-query";
import {
  areSellerSelectionsEqual,
  SellerAccountCheckboxList,
} from "@/components/inbound-workbench/seller-account-checkbox-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type { InboundWorkbenchSnapshotDates } from "@/services/inbound-workbench/types";
import { INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS } from "@/services/inbound-workbench/types";
import type {
  InboundWorkbenchSortColumn,
  InboundWorkbenchSortDirection,
} from "@/services/inbound-workbench/inbound-workbench-sort";

type InboundWorkbenchToolbarProps = {
  accounts: SellerAccountView[];
  appliedSellerIds: string[];
  draftSellerIds: string[];
  onDraftSellerIdsChange: (nextIds: string[]) => void;
  onApplySellers: () => void;
  search: string;
  page: number;
  pageSize: number;
  sort: InboundWorkbenchSortColumn | null;
  dir: InboundWorkbenchSortDirection | null;
  totalCount: number;
  snapshotDates: InboundWorkbenchSnapshotDates | null;
  editMode?: boolean;
  canEdit?: boolean;
  saving?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onResetColumns?: () => void;
};

function formatSnapshotLine(
  dates: InboundWorkbenchSnapshotDates | null,
  sellerCount: number,
): string {
  const sellerPrefix =
    sellerCount > 1 ? `${sellerCount}개 판매자 · ` : "";

  if (!dates) {
    return `${sellerPrefix}스냅샷 없음`;
  }

  const parts = [`템플릿 ${dates.template}`];

  if (dates.health) {
    parts.push(`재고 ${dates.health}`);
  }

  if (dates.shopling) {
    parts.push(`샵플링 ${dates.shopling}`);
  }

  return `${sellerPrefix}${parts.join(" · ")}`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function InboundWorkbenchToolbar({
  accounts,
  appliedSellerIds,
  draftSellerIds,
  onDraftSellerIdsChange,
  onApplySellers,
  search,
  page,
  pageSize,
  sort,
  dir,
  totalCount,
  snapshotDates,
  editMode = false,
  canEdit = false,
  saving = false,
  onEdit,
  onCancel,
  onSave,
  onResetColumns,
}: InboundWorkbenchToolbarProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalCount > 0;
  const hasPendingSellerChanges = !areSellerSelectionsEqual(
    draftSellerIds,
    appliedSellerIds,
  );

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="space-y-4 p-4">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <SectionLabel>판매자 계정</SectionLabel>
              <p className="text-sm text-muted-foreground">
                조회할 계정을 선택한 뒤{" "}
                <span className="font-medium text-foreground">선택 적용</span>
                을 누르세요.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={hasPendingSellerChanges ? "default" : "outline"}
              className="shrink-0 sm:min-w-24"
              disabled={
                editMode ||
                draftSellerIds.length === 0 ||
                !hasPendingSellerChanges
              }
              onClick={onApplySellers}
            >
              선택 적용
            </Button>
          </div>

          <SellerAccountCheckboxList
            accounts={accounts}
            selectedIds={draftSellerIds}
            appliedIds={appliedSellerIds}
            disabled={editMode}
            onChange={onDraftSellerIdsChange}
          />

          {hasPendingSellerChanges && !editMode ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              계정 선택이 변경되었습니다. 적용하려면 선택 적용을 누르세요.
            </p>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionLabel>검색</SectionLabel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              method="GET"
              action="/"
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  defaultValue={search}
                  disabled={editMode}
                  placeholder="상품명 · 옵션명 · 바코드 · 자사상품코드"
                  className="h-9 bg-background pl-9"
                />
              </div>
              <input type="hidden" name="pageSize" value={pageSize} />
              {appliedSellerIds.map((sellerId) => (
                <input
                  key={sellerId}
                  type="hidden"
                  name="seller"
                  value={sellerId}
                />
              ))}
              {sort ? <input type="hidden" name="sort" value={sort} /> : null}
              {dir ? <input type="hidden" name="dir" value={dir} /> : null}
              <Button
                type="submit"
                size="sm"
                className="shrink-0 sm:min-w-20"
                disabled={editMode}
              >
                조회
              </Button>
            </form>

            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:border-l lg:border-border lg:pl-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={editMode || !onResetColumns}
                onClick={onResetColumns}
              >
                열 초기화
              </Button>
              {!editMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canEdit}
                  onClick={onEdit}
                >
                  편집
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={onCancel}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={onSave}
                  >
                    {saving ? "저장 중…" : "저장"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {formatSnapshotLine(snapshotDates, appliedSellerIds.length)} ·{" "}
          <span className="font-medium text-foreground">
            {totalCount.toLocaleString()}건
          </span>
          {editMode ? (
            <span className="ml-1 text-amber-700 dark:text-amber-300">
              · 편집 모드
            </span>
          ) : null}
        </p>

        {showPagination && !editMode ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={pageSize}
              aria-label="표시 건수"
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                router.push(
                  `/${buildWorkbenchQuery({
                    sellers: appliedSellerIds,
                    q: search,
                    page: 1,
                    pageSize: nextPageSize,
                    sort,
                    dir,
                  })}`,
                );
              }}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {INBOUND_WORKBENCH_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}건
                </option>
              ))}
            </select>
            <span className="text-sm tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <div className="flex gap-1.5">
              {hasPrev ? (
                <Link
                  href={`/${buildWorkbenchQuery({
                    sellers: appliedSellerIds,
                    q: search,
                    page: page - 1,
                    pageSize,
                    sort,
                    dir,
                  })}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  이전
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  이전
                </Button>
              )}
              {hasNext ? (
                <Link
                  href={`/${buildWorkbenchQuery({
                    sellers: appliedSellerIds,
                    q: search,
                    page: page + 1,
                    pageSize,
                    sort,
                    dir,
                  })}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  다음
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  다음
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
