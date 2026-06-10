"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateProfile } from "@/app/actions/profile";
import { Badge } from "@/components/ui/badge";
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
import type { ProfileView } from "@/lib/profile/types";

function roleLabel(role: ProfileView["role"]) {
  return role === "master" ? "마스터" : "관리자";
}

export function ProfileSettingsForm({ profile }: { profile: ProfileView }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await updateProfile({ name });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName(result.data.name ?? "");
    setSuccess("저장되었습니다.");
    router.refresh();

    window.setTimeout(() => {
      setSuccess(null);
    }, 3000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필 정보</CardTitle>
        <CardDescription>
          이메일과 역할은 변경할 수 없습니다. 이름만 수정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-email">이메일</FieldLabel>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                disabled
              />
            </Field>
            <Field>
              <FieldLabel>역할</FieldLabel>
              <div>
                <Badge
                  variant={profile.role === "master" ? "default" : "secondary"}
                >
                  {roleLabel(profile.role)}
                </Badge>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-name">이름</FieldLabel>
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={loading}
                maxLength={50}
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
              {loading ? "저장 중..." : "저장"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
