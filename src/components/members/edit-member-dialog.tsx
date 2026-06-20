"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPatch } from "@/lib/api-client";
import { toLoginId } from "@/lib/auth/normalize-login-email";
import { getRoleLabel } from "@/lib/auth/role-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/generated/prisma/client";
import type { UpdatedMember, UpdateMemberInput } from "@/services/members/types";

type EditMemberDialogProps = {
  member: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditMemberFormProps = {
  member: Profile;
  onOpenChange: (open: boolean) => void;
};

function EditMemberForm({ member, onOpenChange }: EditMemberFormProps) {
  const router = useRouter();
  const [loginId, setLoginId] = useState(() => toLoginId(member.email));
  const [password, setPassword] = useState("");
  const [name, setName] = useState(member.name ?? "");
  const [role, setRole] = useState<UpdateMemberInput["role"]>(member.role);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await apiPatch<UpdatedMember>(`/api/members/${member.id}`, {
      loginId,
      password: password.trim() || undefined,
      name: name.trim() || undefined,
      role,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="edit-member-login-id">아이디</FieldLabel>
          <Input
            id="edit-member-login-id"
            type="text"
            autoComplete="username"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            required
            disabled={loading}
          />
          <FieldDescription>@mida.com이 자동으로 붙습니다.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-member-password">비밀번호</FieldLabel>
          <Input
            id="edit-member-password"
            type="password"
            autoComplete="new-password"
            placeholder="변경할 때만 입력 (8자 이상)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-member-role">역할</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as UpdateMemberInput["role"])}
          >
            <SelectTrigger id="edit-member-role" className="w-full">
              <SelectValue>{getRoleLabel(role)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">관리자</SelectItem>
              <SelectItem value="master">시스템</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-member-name">이름</FieldLabel>
          <Input
            id="edit-member-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />
        </Field>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </FieldGroup>
      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>관리자 수정</DialogTitle>
          <DialogDescription>
            아이디, 비밀번호, 역할, 이름을 변경할 수 있습니다. 비밀번호는 변경할
            때만 입력하세요.
          </DialogDescription>
        </DialogHeader>
        {member ? (
          <EditMemberForm key={member.id} member={member} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
