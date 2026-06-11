"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api-client";
import type { CreateAdminInput } from "@/lib/members/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<CreateAdminInput["role"]>("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await apiPost<void>("/api/members", {
      email,
      password,
      name: name.trim() || undefined,
      role,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEmail("");
    setPassword("");
    setName("");
    setRole("admin");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>관리자 추가</CardTitle>
        <CardDescription>
          새 관리자 계정을 생성합니다. 역할은 관리자 또는 마스터 중 선택할 수
          있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-email">이메일</FieldLabel>
              <Input
                id="member-email"
                type="email"
                autoComplete="off"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
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
              <FieldLabel htmlFor="member-name">이름 (선택)</FieldLabel>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="master">마스터</SelectItem>
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
