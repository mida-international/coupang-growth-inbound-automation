import { requireProfile } from "@/lib/auth/profile";

export default async function TrendsPage() {
  await requireProfile();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">추세조회</h1>
      <p className="text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
