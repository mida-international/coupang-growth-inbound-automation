import { centerSeparationBarcodeTarget } from "@/lib/excel/targets/center-separation";
import { coupangGrowthInboundTemplateTarget } from "@/lib/excel/targets/coupang-growth-inbound-template";
import { coupangGrowthInventoryHealthTarget } from "@/lib/excel/targets/coupang-growth-inventory-health";
import type {
  ExcelIngestionTarget,
  ExcelIngestionTargetId,
} from "@/lib/excel/types";

export const excelIngestionTargets: ExcelIngestionTarget[] = [
  coupangGrowthInboundTemplateTarget,
  coupangGrowthInventoryHealthTarget,
  centerSeparationBarcodeTarget,
];

const targetById = new Map(
  excelIngestionTargets.map((target) => [target.id, target]),
);

export function getTargetById(id: ExcelIngestionTargetId) {
  return targetById.get(id);
}

export function listTargets(ids?: readonly ExcelIngestionTargetId[]) {
  if (!ids) {
    return excelIngestionTargets;
  }

  return ids
    .map((id) => getTargetById(id))
    .filter((target): target is ExcelIngestionTarget => target !== undefined);
}
