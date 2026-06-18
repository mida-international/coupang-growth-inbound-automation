"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { DataListPanel } from "@/components/data-list/data-list-panel";
import { DataListTableScrollArea } from "@/components/data-list/data-list-table-scroll-area";
import {
  InboundWorkbenchTable,
  type InboundWorkbenchDraftEntry,
} from "@/components/inbound-workbench/inbound-workbench-table";
import { buildWorkbenchQuery } from "@/components/inbound-workbench/build-workbench-query";
import { InboundWorkbenchToolbar } from "@/components/inbound-workbench/inbound-workbench-toolbar";
import { useInboundWorkbenchColumnLayout } from "@/components/inbound-workbench/use-inbound-workbench-column-layout";
import { apiPatch } from "@/lib/api-client";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type {
  InboundWorkbenchRowView,
  ListInboundWorkbenchResult,
} from "@/services/inbound-workbench/types";
import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";
import {
  cycleInboundWorkbenchSort,
  parseInboundWorkbenchSort,
  type InboundWorkbenchSortColumn,
} from "@/services/inbound-workbench/inbound-workbench-sort";
import type { InboundWorkbenchColumnLayout } from "@/services/inbound-workbench/inbound-workbench-column-layout";

type DraftEntry = InboundWorkbenchDraftEntry & {
  optionId: string | null;
  templateId: string;
  calculatedGrowthInboundRecommend: number;
};

type DraftMap = Record<string, DraftEntry>;

type InboundWorkbenchPanelClientProps = {
  accounts: SellerAccountView[];
  sellerIds: string[];
  data: ListInboundWorkbenchResult;
  search: string;
  page: number;
  pageSize: number;
  sort: string | null;
  dir: string | null;
  columnLayout: InboundWorkbenchColumnLayout;
  children: ReactNode;
};

function buildDraftMap(rows: InboundWorkbenchRowView[]): DraftMap {
  const map: DraftMap = {};

  for (const row of rows) {
    const key = getInboundWorkbenchOverrideKey(row);

    if (!map[key]) {
      map[key] = {
        optionId: row.optionId,
        templateId: row.templateId,
        safetyStock: row.safetyStock,
        growthInboundRecommend: row.growthInboundRecommend,
        initialSafetyStock: row.safetyStock,
        initialGrowthInboundRecommend: row.growthInboundRecommend,
        calculatedGrowthInboundRecommend: row.calculatedGrowthInboundRecommend,
      };
    }
  }

  return map;
}

export function InboundWorkbenchPanelClient({
  accounts,
  sellerIds,
  data,
  search,
  page,
  pageSize,
  sort,
  dir,
  columnLayout,
  children,
}: InboundWorkbenchPanelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftSellerIds, setDraftSellerIds] = useState<string[]>(sellerIds);

  useEffect(() => {
    setDraftSellerIds(sellerIds);
  }, [sellerIds]);

  const parsedSort = parseInboundWorkbenchSort(sort ?? undefined, dir ?? undefined);
  const {
    columnOrder,
    getColumnWidth,
    reorderColumn,
    resizeColumn,
    resetLayout,
  } = useInboundWorkbenchColumnLayout({
    initialLayout: columnLayout,
    disabled: editMode,
  });

  const canEdit = data.totalCount > 0 && sellerIds.length === 1;
  const showSellerColumn = sellerIds.length > 1;

  function handleSort(column: InboundWorkbenchSortColumn) {
    const next = cycleInboundWorkbenchSort(
      parsedSort.sort,
      parsedSort.dir,
      column,
    );

    startTransition(() => {
      router.push(
        `/${buildWorkbenchQuery({
          sellers: sellerIds,
          q: search,
          page: 1,
          pageSize,
          sort: next.sort,
          dir: next.dir,
        })}`,
      );
    });
  }

  function handleApplySellers() {
    if (draftSellerIds.length === 0) {
      return;
    }

    startTransition(() => {
      router.push(
        `/${buildWorkbenchQuery({
          sellers: draftSellerIds,
          q: search,
          page: 1,
          pageSize,
          sort: parsedSort.sort,
          dir: parsedSort.dir,
        })}`,
      );
    });
  }

  const displayRows = useMemo(() => {
    if (!editMode) {
      return data.rows;
    }

    return data.rows.map((row) => {
      const key = getInboundWorkbenchOverrideKey(row);
      const draft = drafts[key];

      if (!draft) {
        return row;
      }

      return {
        ...row,
        safetyStock: draft.safetyStock,
        growthInboundRecommend: draft.growthInboundRecommend,
      };
    });
  }, [data.rows, drafts, editMode]);

  function startEdit() {
    setDrafts(buildDraftMap(data.rows));
    setSaveError(null);
    setEditMode(true);
  }

  function cancelEdit() {
    setDrafts({});
    setSaveError(null);
    setEditMode(false);
  }

  function updateDraft(
    key: string,
    field: "safetyStock" | "growthInboundRecommend",
    value: number,
  ) {
    setDrafts((prev) => {
      const current = prev[key];

      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  async function saveEdits() {
    const sellerId = sellerIds[0];

    if (!sellerId || Object.keys(drafts).length === 0) {
      return;
    }

    setSaveError(null);

    const items = Object.values(drafts)
      .map((draft) => {
        const item: {
          optionId?: string;
          templateId?: string;
          safetyStock?: number;
          growthInboundRecommendQty?: number;
        } = draft.optionId
          ? { optionId: draft.optionId, templateId: draft.templateId }
          : { templateId: draft.templateId };

        if (draft.safetyStock !== draft.initialSafetyStock) {
          item.safetyStock = draft.safetyStock;
        }

        if (
          draft.growthInboundRecommend !==
          draft.calculatedGrowthInboundRecommend
        ) {
          item.growthInboundRecommendQty = draft.growthInboundRecommend;
        }

        const hasPayload =
          item.safetyStock !== undefined ||
          item.growthInboundRecommendQty !== undefined;

        return hasPayload ? item : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
      setEditMode(false);
      setDrafts({});
      return;
    }

    const result = await apiPatch<void>("/api/inbound-workbench/overrides", {
      coupangSellerAccountId: sellerId,
      items,
    });

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }

    setEditMode(false);
    setDrafts({});
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DataListPanel>
      <InboundWorkbenchToolbar
        accounts={accounts}
        appliedSellerIds={sellerIds}
        draftSellerIds={draftSellerIds}
        onDraftSellerIdsChange={setDraftSellerIds}
        onApplySellers={handleApplySellers}
        search={search}
        page={page}
        pageSize={pageSize}
        sort={parsedSort.sort}
        dir={parsedSort.dir}
        totalCount={data.totalCount}
        snapshotDates={data.snapshotDates}
        editMode={editMode}
        canEdit={canEdit}
        saving={isPending}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={() => void saveEdits()}
        onResetColumns={resetLayout}
      />
      {saveError ? (
        <p className="text-sm text-destructive">{saveError}</p>
      ) : null}
      {data.totalCount > 0 ? (
        <DataListTableScrollArea>
          <InboundWorkbenchTable
            rows={displayRows}
            columnOrder={columnOrder}
            getColumnWidth={getColumnWidth}
            onReorderColumn={reorderColumn}
            onResizeColumn={resizeColumn}
            showSellerColumn={showSellerColumn}
            editMode={editMode}
            sort={parsedSort.sort}
            dir={parsedSort.dir}
            onSort={handleSort}
            drafts={editMode ? drafts : undefined}
            onDraftChange={updateDraft}
          />
        </DataListTableScrollArea>
      ) : (
        children
      )}
    </DataListPanel>
  );
}
