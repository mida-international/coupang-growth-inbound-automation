import { requireProfile } from "@/lib/auth/profile";

export default async function SellerAccountsPage() {
  await requireProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          쿠팡 판매자 계정 관리
        </h1>
        <p className="text-muted-foreground">
          쿠팡 Wing 판매자 계정을 등록하고 관리합니다.
        </p>
      </div>
    </div>
  );
}
