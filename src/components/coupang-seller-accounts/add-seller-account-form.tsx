"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AddSellerAccountForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await apiPost<void>("/api/coupang-seller-accounts", {
      displayName: displayName.trim(),
      isActive,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDisplayName("");
    setIsActive(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>판매자 계정 추가</CardTitle>
        <CardDescription>
          쿠팡 Wing 판매자 계정의 표시명을 등록합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="seller-display-name">표시명</FieldLabel>
              <Input
                id="seller-display-name"
                type="text"
                placeholder="예: 미즈코스 본점"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                maxLength={100}
                disabled={loading}
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="seller-is-active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
                disabled={loading}
              />
              <FieldLabel htmlFor="seller-is-active">활성</FieldLabel>
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? "추가 중..." : "판매자 계정 추가"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
