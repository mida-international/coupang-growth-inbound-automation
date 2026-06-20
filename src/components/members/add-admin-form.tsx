"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api-client";
import { getRoleLabel } from "@/lib/auth/role-label";
import type { CreateAdminInput } from "@/services/members/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddAdminForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<CreateAdminInput["role"]>("master");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await apiPost<void>("/api/members", {
      loginId,
      password,
      name: name.trim() || undefined,
      role,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLoginId("");
    setPassword("");
    setName("");
    setRole("master");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>관리자 추가</CardTitle>
        <CardDescription>
          새 관리자 계정을 생성합니다. 역할은 관리자 또는 시스템 중 선택할 수
          있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-login-id">아이디</FieldLabel>
              <Input
                id="member-login-id"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                required
                disabled={loading}
              />
              <FieldDescription>@mida.com이 자동으로 붙습니다.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="member-password">비밀번호</FieldLabel>
              <Input
                id="member-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-name">이름</FieldLabel>
              <Input
                id="member-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-role">역할</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as CreateAdminInput["role"])
                }
              >
                <SelectTrigger id="member-role" className="w-full">
                  <SelectValue>{getRoleLabel(role)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="master">시스템</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? "추가 중..." : "관리자 추가"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
