import {
  getShoplingInboundDeliverableStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

type SaveShoplingInboundDeliverableFileInput = {
  deliverableId: string;
  outputFileName: string;
  buffer: Buffer;
};

export async function saveShoplingInboundDeliverableFile(
  input: SaveShoplingInboundDeliverableFileInput,
): Promise<string> {
  const path = getShoplingInboundDeliverableStoragePath(
    input.deliverableId,
    input.outputFileName,
  );

  await uploadExcelFile(
    path,
    input.buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    { upsert: false },
  );

  return path;
}
