import { CenterSeparationPanel } from "@/components/center-separation/center-separation-panel";
import { CenterSeparationAddSection } from "@/components/center-separation/center-separation-add-section";
import { requireProfile } from "@/lib/auth/profile";
import { listCenterSeparation } from "@/services/center-separation/list-center-separation";
import { normalizeCenterSeparationPageSize } from "@/services/center-separation/types";

type CenterSeparationPageProps = {
  searchParams: Promise<{ page?: string; q?: string; pageSize?: string }>;
};

export default async function CenterSeparationPage({
  searchParams,
}: CenterSeparationPageProps) {
  await requireProfile();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const pageSize = normalizeCenterSeparationPageSize(Number(params.pageSize));
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listCenterSeparation({ page, pageSize, search });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">센터분리 관리</h1>
        <p className="text-muted-foreground">
          센터분리 대상 바코드를 등록하고, 대시보드 기준 상품 정보를 조회합니다.
        </p>
      </div>

      <CenterSeparationAddSection />

      <CenterSeparationPanel
        data={data}
        search={search}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
