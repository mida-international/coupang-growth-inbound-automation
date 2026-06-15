import { ShoplingSyncPanel } from "@/components/shopling-sync/shopling-sync-panel";
import { requireProfile } from "@/lib/auth/profile";
import { getShoplingSyncStatus } from "@/services/shopling-sync/get-shopling-sync-status";

export default async function ShoplingSyncPage() {
  await requireProfile();
  const status = await getShoplingSyncStatus();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          샵플링 데이터 동기화
        </h1>
        <p className="text-muted-foreground">
          샵플링 상품 정보를 외부 API에서 가져와 동기화합니다.
        </p>
      </div>
      <ShoplingSyncPanel initialStatus={status} />
    </div>
  );
}
