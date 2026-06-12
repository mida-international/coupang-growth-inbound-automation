import { ExcelUploadPanel } from "@/components/coupang-growth-sync/excel-upload-panel";
import { requireProfile } from "@/lib/auth/profile";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";

export default async function CoupangGrowthExcelUploadPage() {
  await requireProfile();

  const accounts = (await listSellerAccounts()).sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          쿠팡 Growth 데이터 동기화
        </h1>
        <p className="text-muted-foreground">
          쿠팡 Growth 상품 정보를 엑셀 파일로 업로드하여 동기화합니다.
        </p>
      </div>
      <ExcelUploadPanel accounts={accounts} />
    </div>
  );
}
