import { Skeleton } from "@/components/ui/skeleton";

// 메뉴 이동 시 서버 렌더링을 기다리지 않고 즉시 화면을 전환하기 위한 로딩 화면.
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">불러오는 중…</span>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
