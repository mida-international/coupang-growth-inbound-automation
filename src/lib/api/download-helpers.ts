import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export async function resolveActiveSellerAccount(sellerId: string) {
  const accounts = await listSellerAccounts();

  return accounts.find(
    (account) => account.id === sellerId && account.isActive,
  );
}

export function encodeContentDispositionFilename(filename: string): string {
  const encoded = encodeURIComponent(filename);

  return `attachment; filename*=UTF-8''${encoded}`;
}

export function buildExcelDownloadResponse(
  buffer: Buffer,
  filename: string,
): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": encodeContentDispositionFilename(filename),
      "Cache-Control": "no-store",
    },
  });
}

export function parseSellerIdsFromSearchParams(
  searchParams: URLSearchParams,
): string[] {
  return searchParams
    .getAll("seller")
    .map((value) => value.trim())
    .filter(Boolean);
}
