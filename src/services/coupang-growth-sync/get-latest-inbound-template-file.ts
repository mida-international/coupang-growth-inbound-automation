import {
  downloadExcelFile,
  getExcelFileMetadata,
  getInboundTemplateStoragePath,
} from "@/lib/supabase/storage";
import type {
  LatestInboundTemplateFile,
  LatestInboundTemplateFileMeta,
} from "@/services/deliverables/types";

export async function getLatestInboundTemplateFileMeta(
  coupangSellerAccountId: string,
): Promise<LatestInboundTemplateFileMeta> {
  const path = getInboundTemplateStoragePath(coupangSellerAccountId);
  const metadata = await getExcelFileMetadata(path);

  if (!metadata) {
    return {
      exists: false,
      updatedAt: null,
      fileName: null,
    };
  }

  return {
    exists: true,
    updatedAt: metadata.updatedAt,
    fileName: metadata.fileName,
  };
}

export async function getLatestInboundTemplateFile(
  coupangSellerAccountId: string,
): Promise<LatestInboundTemplateFile | null> {
  const path = getInboundTemplateStoragePath(coupangSellerAccountId);
  const [metadata, buffer] = await Promise.all([
    getExcelFileMetadata(path),
    downloadExcelFile(path),
  ]);

  if (!metadata || !buffer) {
    return null;
  }

  return {
    exists: true,
    updatedAt: metadata.updatedAt,
    fileName: metadata.fileName,
    buffer,
  };
}
