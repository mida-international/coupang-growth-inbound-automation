"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import type { Profile } from "@/generated/prisma/client";
import { apiDelete } from "@/lib/api-client";
import { getRoleLabel } from "@/lib/auth/role-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

export function MembersTable({ members }: { members: Profile[] }) {
  const router = useRouter();
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">등록된 관리자가 없습니다.</p>
    );
  }

  async function handleDelete(member: Profile) {
    const confirmed = window.confirm(
      `${member.email} 계정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(member.id);

    const result = await apiDelete<void>(`/api/members/${member.id}`);

    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이메일</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.name ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={member.role === "master" ? "default" : "secondary"}
                >
                  {getRoleLabel(member.role)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(member.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMember(member)}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === member.id}
                    onClick={() => handleDelete(member)}
                  >
                    {deletingId === member.id ? "삭제 중..." : "삭제"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditMemberDialog
        member={editingMember}
        open={editingMember !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
          }
        }}
      />
    </>
  );
}
