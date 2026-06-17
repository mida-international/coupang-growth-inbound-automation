"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiPatch } from "@/lib/api-client";
import {
  DEFAULT_COLUMN_WIDTHS,
  getDefaultColumnLayout,
  MIN_COLUMN_WIDTH,
  normalizeColumnLayout,
  type InboundWorkbenchColumnLayout,
} from "@/services/inbound-workbench/inbound-workbench-column-layout";
import type { InboundWorkbenchSortColumn } from "@/services/inbound-workbench/inbound-workbench-sort";

const SAVE_DEBOUNCE_MS = 400;

type UseInboundWorkbenchColumnLayoutOptions = {
  initialLayout: InboundWorkbenchColumnLayout;
  disabled?: boolean;
};

export function useInboundWorkbenchColumnLayout({
  initialLayout,
  disabled = false,
}: UseInboundWorkbenchColumnLayoutOptions) {
  const [layout, setLayout] = useState(() =>
    normalizeColumnLayout(initialLayout),
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef(layout);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const persistLayout = useCallback((nextLayout: InboundWorkbenchColumnLayout) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void apiPatch<InboundWorkbenchColumnLayout>(
        "/api/inbound-workbench/column-layout",
        nextLayout,
      );
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const persistLayoutImmediate = useCallback(
    (nextLayout: InboundWorkbenchColumnLayout) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      void apiPatch<InboundWorkbenchColumnLayout>(
        "/api/inbound-workbench/column-layout",
        nextLayout,
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const getColumnWidth = useCallback(
    (columnId: InboundWorkbenchSortColumn) => {
      return (
        layout.columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTHS[columnId]
      );
    },
    [layout.columnWidths],
  );

  const reorderColumn = useCallback(
    (fromId: InboundWorkbenchSortColumn, toId: InboundWorkbenchSortColumn) => {
      if (disabled || fromId === toId) {
        return;
      }

      setLayout((current) => {
        const nextOrder = [...current.columnOrder];
        const fromIndex = nextOrder.indexOf(fromId);
        const toIndex = nextOrder.indexOf(toId);

        if (fromIndex === -1 || toIndex === -1) {
          return current;
        }

        nextOrder.splice(fromIndex, 1);
        nextOrder.splice(toIndex, 0, fromId);

        const nextLayout = normalizeColumnLayout({
          ...current,
          columnOrder: nextOrder,
        });
        persistLayoutImmediate(nextLayout);
        return nextLayout;
      });
    },
    [disabled, persistLayoutImmediate],
  );

  const resizeColumn = useCallback(
    (columnId: InboundWorkbenchSortColumn, width: number) => {
      if (disabled) {
        return;
      }

      const clampedWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(width));

      setLayout((current) => {
        const nextLayout = normalizeColumnLayout({
          ...current,
          columnWidths: {
            ...current.columnWidths,
            [columnId]: clampedWidth,
          },
        });
        persistLayout(nextLayout);
        return nextLayout;
      });
    },
    [disabled, persistLayout],
  );

  const resetLayout = useCallback(() => {
    if (disabled) {
      return;
    }

    const nextLayout = getDefaultColumnLayout();
    setLayout(nextLayout);
    persistLayoutImmediate(nextLayout);
  }, [disabled, persistLayoutImmediate]);

  return {
    columnOrder: layout.columnOrder,
    getColumnWidth,
    reorderColumn,
    resizeColumn,
    resetLayout,
  };
}
