"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  InboundWorkbenchTable,
  type InboundWorkbenchDraftEntry,
} from "@/components/inbound-workbench/inbound-workbench-table";
import { InboundWorkbenchToolbar } from "@/components/inbound-workbench/inbound-workbench-toolbar";
import { apiPatch } from "@/lib/api-client";
import type { SellerAccountView } from "@/services/coupang-seller-accounts/types";
import type {
  InboundWorkbenchRowView,
  ListInboundWorkbenchResult,
} from "@/services/inbound-workbench/types";
import { getInboundWorkbenchOverrideKey } from "@/services/inbound-workbench/types";

type DraftEntry = InboundWorkbenchDraftEntry & {
  optionId: string | null;
  templateId: string;
  calculatedGrowthInboundRecommend: number;
};

type DraftMap = Record<string, DraftEntry>;

type InboundWorkbenchPanelClientProps = {
  accounts: SellerAccountView[];
  sellerId: string;
  data: ListInboundWorkbenchResult;
  search: string;
  page: number;
  pageSize: number;
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
  sellerId,
  data,
  search,
  page,
  pageSize,
  children,
}: InboundWorkbenchPanelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const canEdit = data.totalCount > 0 && Boolean(sellerId);

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
    <div className="space-y-4">
      <InboundWorkbenchToolbar
        accounts={accounts}
        sellerId={sellerId}
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        snapshotDates={data.snapshotDates}
        editMode={editMode}
        canEdit={canEdit}
        saving={isPending}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={() => void saveEdits()}
      />
      {saveError ? (
        <p className="text-sm text-destructive">{saveError}</p>
      ) : null}
      {data.totalCount > 0 ? (
        <InboundWorkbenchTable
          rows={displayRows}
          editMode={editMode}
          drafts={editMode ? drafts : undefined}
          onDraftChange={updateDraft}
        />
      ) : (
        children
      )}
    </div>
  );
}
