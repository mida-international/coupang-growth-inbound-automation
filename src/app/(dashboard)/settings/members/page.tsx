import { AddAdminForm } from "@/components/members/add-admin-form";
import { MembersTable } from "@/components/members/members-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMaster } from "@/lib/auth/profile";
import { listMembers } from "@/services/members/list-members";

export default async function MembersPage() {
  await requireMaster();

  const members = await listMembers();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">회원관리</h1>
        <p className="text-muted-foreground">
          관리자 계정을 추가하고 등록된 관리자 목록을 확인합니다.
        </p>
      </div>

      <AddAdminForm />

      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
          <CardDescription>등록된 모든 관리자 계정입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
