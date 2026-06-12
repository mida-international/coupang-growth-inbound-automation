import type { ExcelIngestionTarget } from "@/lib/excel/types";

/** Columns B–AA: Inventory ID ~ Product listing date */
export const coupangGrowthInventoryHealthTarget: ExcelIngestionTarget = {
  id: "coupang_growth_inventory_health",
  tableName: "coupang_growth_inventory_health",
  label: "재고 현황",
  requiredHeaderKeywords: [
    "Inventory ID",
    "Option ID",
    "Orderable quantity",
    "Days of cover",
  ],
};
