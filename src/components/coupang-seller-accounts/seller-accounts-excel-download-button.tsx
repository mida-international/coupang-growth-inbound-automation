"use client";

import { useState } from "react";

import { ListExcelDownloadButton } from "@/components/data-list/list-excel-download-button";

export function SellerAccountsExcelDownloadButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ListExcelDownloadButton
        disabled={disabled}
        downloadHref="/api/downloads/seller-accounts"
        onError={setError}
      />
    </div>
  );
}
