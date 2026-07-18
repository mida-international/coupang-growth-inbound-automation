export async function recordCoupangInbound(
  sellerId: string,
  boxListFile: File,
): Promise<number> {
  const formData = new FormData();
  formData.append("seller", sellerId);
  formData.append("boxListFile", boxListFile);

  const response = await fetch("/api/coupang-inbound-deliverables", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok: true; data: { recordedCount: number } }
    | { ok: false; error?: string }
    | null;

  if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "입고 기록에 실패했습니다.",
    );
  }

  return payload.data.recordedCount;
}
