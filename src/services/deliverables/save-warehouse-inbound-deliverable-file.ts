import {
  getWarehouseInboundDeliverableStoragePath,
  uploadExcelFile,
} from "@/lib/supabase/storage";

type SaveWarehouseInboundDeliverableFileInput = {
  deliverableId: string;
  buffer: Buffer;
};

export async function saveWarehouseInboundDeliverableFile(
  input: SaveWarehouseInboundDeliverableFileInput,
): Promise<string> {
  const path = getWarehouseInboundDeliverableStoragePath(input.deliverableId);

  await uploadExcelFile(
    path,
    input.buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    { upsert: false },
  );

  return path;
}
