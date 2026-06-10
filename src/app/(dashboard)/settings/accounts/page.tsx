import { ChangePasswordForm } from "@/components/account/change-password-form";
import { requireProfile } from "@/lib/auth/profile";

export default async function AccountsPage() {
  await requireProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">계정 관리</h1>
        <p className="text-muted-foreground">
          로그인 계정의 비밀번호를 변경할 수 있습니다.
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
