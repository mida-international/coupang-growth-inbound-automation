"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <Field>
            <FieldLabel htmlFor="seller-display-name">쿠팡 판매자 계정</FieldLabel>
            <Input
              id="seller-display-name"
              type="text"
              placeholder="mizucos"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={100}
              disabled={loading}
            />
          </Field>
          <Field orientation="horizontal" className="sm:pb-0.5">
            <Checkbox
              id="seller-is-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
              disabled={loading}
            />
            <FieldLabel htmlFor="seller-is-active">활성</FieldLabel>
          </Field>
          <Button type="submit" disabled={loading} className="sm:w-auto">
            {loading ? "추가 중..." : "계정 추가"}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
