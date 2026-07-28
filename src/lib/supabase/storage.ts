import { createAdminClient } from "@/lib/supabase/admin";

export const EXCEL_UPLOADS_BUCKET = "excel-uploads";

export function getInboundTemplateStoragePath(coupangSellerAccountId: string) {
  return `latest-inbound-template/${coupangSellerAccountId}.xlsx`;
}

export function getShoplingInboundDeliverableStoragePath(
  deliverableId: string,
  outputFileName: string,
) {
  return `shopling-inbound-deliverables/${deliverableId}/${outputFileName}`;
}

export function getWarehouseInboundDeliverableStoragePath(
  deliverableId: string,
) {
  // Supabase object keys must be ASCII-safe; user-facing filename is stored in DB.
  return `warehouse-inbound-deliverables/${deliverableId}/inbound-list.xlsx`;
}

export function getCoupangInboundDeliverableStoragePath(deliverableId: string) {
  // Supabase object keys must be ASCII-safe; user-facing filename is stored in DB.
  return `coupang-inbound-deliverables/${deliverableId}/inbound-template.xlsx`;
}

export function getTelegramBoxListStoragePath(uploadId: string) {
  return `telegram-box-list/${uploadId}/box-list.xlsx`;
}

export async function uploadExcelFile(
  path: string,
  buffer: Buffer,
  contentType: string,
  options?: { upsert?: boolean; cacheControl?: string },
) {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(EXCEL_UPLOADS_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: options?.upsert ?? true,
      // storage-js 기본값은 cacheControl "3600"(1시간)이다. 같은 경로를
      // 덮어쓰는 가변 파일(예: 최신 WING 템플릿)은 CDN이 옛 버전을 계속
      // 내려줄 수 있으므로, 호출부에서 "0"으로 넘겨 항상 재검증하게 한다.
      ...(options?.cacheControl ? { cacheControl: options.cacheControl } : {}),
    });

  if (error) {
    throw new Error(`Storage 업로드에 실패했습니다: ${error.message}`);
  }
}

export async function downloadExcelFile(path: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(EXCEL_UPLOADS_BUCKET)
    .download(path);

  if (error || !data) {
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteExcelFile(path: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(EXCEL_UPLOADS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Storage 삭제에 실패했습니다: ${error.message}`);
  }
}

export async function getExcelFileMetadata(path: string) {
  const supabase = createAdminClient();
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const fileName = path.includes("/")
    ? path.slice(path.lastIndexOf("/") + 1)
    : path;

  const { data, error } = await supabase.storage
    .from(EXCEL_UPLOADS_BUCKET)
    .list(folder, {
      limit: 100,
      search: fileName,
    });

  if (error || !data?.length) {
    return null;
  }

  const file = data.find((entry) => entry.name === fileName);

  if (!file) {
    return null;
  }

  return {
    updatedAt: file.updated_at ?? file.created_at ?? null,
    fileName,
  };
}
