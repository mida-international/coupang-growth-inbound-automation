import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { requireProfile } from "@/lib/auth/profile";
import { getProfileView } from "@/services/profile/get-profile-view";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const profileView = await getProfileView(profile.id);

  if (!profileView) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">개인정보</h1>
        <p className="text-muted-foreground">
          본인 프로필 정보를 확인하고 이름을 수정할 수 있습니다.
        </p>
      </div>

      <ProfileSettingsForm profile={profileView} />
    </div>
  );
}
