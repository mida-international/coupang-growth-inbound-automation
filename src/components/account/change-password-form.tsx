"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { changePasswordAction } from "@/app/actions/account";
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

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const result = await changePasswordAction({
      currentPassword,
      newPassword,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("비밀번호가 변경되었습니다.");
    router.refresh();

    window.setTimeout(() => {
      setSuccess(null);
    }, 3000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
        <CardDescription>
          본인 계정의 비밀번호만 변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">현재 비밀번호</FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">새 비밀번호</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">새 비밀번호 확인</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm text-muted-foreground" role="status">
                {success}
              </p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
