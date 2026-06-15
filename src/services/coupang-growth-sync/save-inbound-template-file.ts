import {
  getInboundTemplateStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

type SaveInboundTemplateFileInput = {
  coupangSellerAccountId: string;
  buffer: Buffer;
  sourceFileName: string;
};

export async function saveInboundTemplateFile(
  input: SaveInboundTemplateFileInput,
): Promise<void> {
  const path = getInboundTemplateStoragePath(input.coupangSellerAccountId);

  await uploadExcelFile(
    path,
    input.buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
