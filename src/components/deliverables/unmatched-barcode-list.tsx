"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { UnmatchedBarcodeItem } from "@/lib/deliverables/unmatched-barcodes-header";

const PREVIEW_COUNT = 20;

type UnmatchedBarcodeListProps = {
  items: UnmatchedBarcodeItem[];
  // 헤더 크기 제한으로 목록이 잘렸을 때 안내하기 위한 전체 미매칭 건수
  totalCount: number;
};

function toTsv(items: UnmatchedBarcodeItem[]) {
  return items.map((item) => `${item.barcode}\t${item.quantity}`).join("\n");
}

function downloadCsv(items: UnmatchedBarcodeItem[]) {
  const csv = [
    "바코드,수량",
    ...items.map((item) => `"${item.barcode}",${item.quantity}`),
  ].join("\r\n");
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "쿠팡_입고템플릿_미매칭_바코드.csv";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function UnmatchedBarcodeList({
  items,
  totalCount,
}: UnmatchedBarcodeListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const visibleItems = isExpanded ? items : items.slice(0, PREVIEW_COUNT);
  const hiddenCount = items.length - visibleItems.length;
  const omittedCount = Math.max(0, totalCount - items.length);

  async function handleCopyClick() {
    try {
      await navigator.clipboard.writeText(toTsv(items));
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          미매칭 바코드 {totalCount.toLocaleString()}건
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopyClick}>
            {isCopied ? "복사됨" : "복사"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(items)}
          >
            CSV 다운로드
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-x-4 gap-y-1 font-mono text-sm">
        {visibleItems.map((item) => (
          <li key={item.barcode} className="flex justify-between gap-2">
            <span>{item.barcode}</span>
            <span className="text-muted-foreground">
              {item.quantity.toLocaleString()}개
            </span>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 || isExpanded ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? "접기" : `더보기 (${hiddenCount.toLocaleString()}건)`}
        </Button>
      ) : null}

      {omittedCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          목록이 길어 {omittedCount.toLocaleString()}건은 표시되지 않았습니다.
        </p>
      ) : null}
    </div>
  );
}
