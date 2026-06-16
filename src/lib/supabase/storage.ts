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

export async function uploadExcelFile(
  path: string,
  buffer: Buffer,
  contentType: string,
  options?: { upsert?: boolean },
) {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(EXCEL_UPLOADS_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: options?.upsert ?? true,
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
