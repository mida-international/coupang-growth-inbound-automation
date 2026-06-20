"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiPut } from "@/lib/api-client";
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
import type { ShoplingApiConfigView } from "@/services/shopling-api-config/types";

type ShoplingApiFormProps = {
  initialConfig: ShoplingApiConfigView;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved?: (config: ShoplingApiConfigView) => void;
};

export function ShoplingApiForm({
  initialConfig,
  onDirtyChange,
  onSaved,
}: ShoplingApiFormProps) {
  const router = useRouter();
  const [loginId, setLoginId] = useState(initialConfig.loginId);
  const [companyId, setCompanyId] = useState(initialConfig.companyId);
  const [apiAuthKey, setApiAuthKey] = useState(initialConfig.apiAuthKeyMasked);
  const [hasConfig, setHasConfig] = useState(initialConfig.hasConfig);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateDirty(nextLoginId: string, nextCompanyId: string, nextApiKey: string) {
    const isDirty =
      nextLoginId !== initialConfig.loginId ||
      nextCompanyId !== initialConfig.companyId ||
      nextApiKey !== initialConfig.apiAuthKeyMasked;

    onDirtyChange?.(isDirty);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await apiPut<ShoplingApiConfigView>("/api/integrations/shopling", {
      loginId,
      companyId,
      apiAuthKey,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLoginId(result.data.loginId);
    setCompanyId(result.data.companyId);
    setApiAuthKey(result.data.apiAuthKeyMasked);
    setHasConfig(result.data.hasConfig);
    onDirtyChange?.(false);
    onSaved?.(result.data);
    setSuccess("저장되었습니다.");
    router.refresh();

    window.setTimeout(() => {
      setSuccess(null);
    }, 3000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API 설정</CardTitle>
        <CardDescription>
          샵플링 상품조회 API 인증 정보를 저장합니다. API 인증 키는 시스템만
          조회·수정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="shopling-login-id">로그인 ID</FieldLabel>
              <Input
                id="shopling-login-id"
                value={loginId}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setLoginId(nextValue);
                  updateDirty(nextValue, companyId, apiAuthKey);
                }}
                autoComplete="off"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shopling-company-id">회사 ID</FieldLabel>
              <Input
                id="shopling-company-id"
                value={companyId}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCompanyId(nextValue);
                  updateDirty(loginId, nextValue, apiAuthKey);
                }}
                autoComplete="off"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shopling-api-auth-key">API 인증 키</FieldLabel>
              <Input
                id="shopling-api-auth-key"
                type="password"
                value={apiAuthKey}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setApiAuthKey(nextValue);
                  updateDirty(loginId, companyId, nextValue);
                }}
                autoComplete="off"
                placeholder={hasConfig ? "변경 시에만 입력" : "API 인증 키를 입력하세요"}
                required={!hasConfig}
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            {success ? (
              <p className="text-sm text-primary">{success}</p>
            ) : null}
            <div>
              <Button type="submit" disabled={loading}>
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
