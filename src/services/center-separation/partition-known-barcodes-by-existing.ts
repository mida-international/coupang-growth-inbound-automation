export function partitionKnownBarcodesByExisting(
  knownBarcodes: string[],
  existingInDb: Set<string>,
): { toCreate: string[]; existingBarcodes: string[] } {
  const toCreate: string[] = [];
  const existingBarcodes: string[] = [];

  for (const barcode of knownBarcodes) {
    if (existingInDb.has(barcode)) {
      existingBarcodes.push(barcode);
    } else {
      toCreate.push(barcode);
    }
  }

  return { toCreate, existingBarcodes };
}
