"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiPatch, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  CreateShoplingPackageMappingBody,
  ShoplingPackageMappingRowView,
  UpdateShoplingPackageMappingBody,
} from "@/services/shopling-package-mapping/types";

type FormState = {
  packageBarcode: string;
  packageGoodsKey: string;
  packageOptId: string;
  packagePtnGoodsCd: string;
  packageOptValue: string;
  singleBarcode: string;
  singleGoodsKey: string;
  singleOptId: string;
  singleOptValue: string;
  singlePtnGoodsCd: string;
  mapCnt: string;
};

const emptyFormState: FormState = {
  packageBarcode: "",
  packageGoodsKey: "",
  packageOptId: "",
  packagePtnGoodsCd: "",
  packageOptValue: "",
  singleBarcode: "",
  singleGoodsKey: "",
  singleOptId: "",
  singleOptValue: "",
  singlePtnGoodsCd: "",
  mapCnt: "1",
};

function rowToFormState(row: ShoplingPackageMappingRowView): FormState {
  return {
    packageBarcode: row.packageBarcode ?? "",
    packageGoodsKey: row.packageGoodsKey,
    packageOptId: row.packageOptId,
    packagePtnGoodsCd: row.packagePtnGoodsCd ?? "",
    packageOptValue: row.packageOptValue ?? "",
    singleBarcode: row.singleBarcode ?? "",
    singleGoodsKey: row.singleGoodsKey ?? "",
    singleOptId: row.singleOptId,
    singleOptValue: row.singleOptValue ?? "",
    singlePtnGoodsCd: row.singlePtnGoodsCd ?? "",
    mapCnt: String(row.mapCnt),
  };
}

type ShoplingPackageMappingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: ShoplingPackageMappingRowView | null;
};

export function ShoplingPackageMappingFormDialog({
  open,
  onOpenChange,
  row = null,
}: ShoplingPackageMappingFormDialogProps) {
  const router = useRouter();
  const isEdit = row !== null && row !== undefined;
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(isEdit && row ? rowToFormState(row) : emptyFormState);
    setError(null);
  }, [open, isEdit, row]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const mapCnt = Number(form.mapCnt);

    if (!Number.isFinite(mapCnt) || mapCnt < 1) {
      setLoading(false);
      setError("구성수량은 1 이상 정수여야 합니다.");
      return;
    }

    if (isEdit && row) {
      const body: UpdateShoplingPackageMappingBody = {
        packageBarcode: form.packageBarcode,
        packagePtnGoodsCd: form.packagePtnGoodsCd,
        packageOptValue: form.packageOptValue,
        singleBarcode: form.singleBarcode,
        singleGoodsKey: form.singleGoodsKey,
        singleOptValue: form.singleOptValue,
        singlePtnGoodsCd: form.singlePtnGoodsCd,
        mapCnt,
      };

      const result = await apiPatch<ShoplingPackageMappingRowView>(
        `/api/shopling/package-mapping/${row.id}`,
        body,
      );

      setLoading(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
      return;
    }

    const body: CreateShoplingPackageMappingBody = {
      packageOptId: form.packageOptId.trim(),
      singleOptId: form.singleOptId.trim(),
      packageGoodsKey: form.packageGoodsKey.trim(),
      mapCnt,
      packageBarcode: form.packageBarcode,
      packagePtnGoodsCd: form.packagePtnGoodsCd,
      packageOptValue: form.packageOptValue,
      singleBarcode: form.singleBarcode,
      singleGoodsKey: form.singleGoodsKey,
      singleOptValue: form.singleOptValue,
      singlePtnGoodsCd: form.singlePtnGoodsCd,
    };

    const result = await apiPost<ShoplingPackageMappingRowView>(
      "/api/shopling/package-mapping",
      body,
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "패키지 매핑 수정" : "패키지 매핑 추가"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "수정한 행은 동기화 시 자동 덮어쓰기에서 보호됩니다."
              : "수동 추가한 매핑은 동기화 시 자동 덮어쓰기에서 보호됩니다."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="package-goods-key">
                  패키지 샵플링코드 *
                </FieldLabel>
                <Input
                  id="package-goods-key"
                  value={form.packageGoodsKey}
                  onChange={(event) =>
                    updateField("packageGoodsKey", event.target.value)
                  }
                  required
                  disabled={loading || isEdit}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="package-opt-id">패키지 옵션ID *</FieldLabel>
                <Input
                  id="package-opt-id"
                  value={form.packageOptId}
                  onChange={(event) =>
                    updateField("packageOptId", event.target.value)
                  }
                  required
                  disabled={loading || isEdit}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="package-barcode">패키지 바코드</FieldLabel>
                <Input
                  id="package-barcode"
                  value={form.packageBarcode}
                  onChange={(event) =>
                    updateField("packageBarcode", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="package-ptn-goods-cd">
                  패키지 자사상품코드
                </FieldLabel>
                <Input
                  id="package-ptn-goods-cd"
                  value={form.packagePtnGoodsCd}
                  onChange={(event) =>
                    updateField("packagePtnGoodsCd", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="package-opt-value">패키지 옵션값</FieldLabel>
                <Input
                  id="package-opt-value"
                  value={form.packageOptValue}
                  onChange={(event) =>
                    updateField("packageOptValue", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="single-opt-id">단품 옵션ID *</FieldLabel>
                <Input
                  id="single-opt-id"
                  value={form.singleOptId}
                  onChange={(event) =>
                    updateField("singleOptId", event.target.value)
                  }
                  required
                  disabled={loading || isEdit}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="single-barcode">단품 바코드</FieldLabel>
                <Input
                  id="single-barcode"
                  value={form.singleBarcode}
                  onChange={(event) =>
                    updateField("singleBarcode", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="single-goods-key">단품 샵플링코드</FieldLabel>
                <Input
                  id="single-goods-key"
                  value={form.singleGoodsKey}
                  onChange={(event) =>
                    updateField("singleGoodsKey", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="single-ptn-goods-cd">
                  단품 자사상품코드
                </FieldLabel>
                <Input
                  id="single-ptn-goods-cd"
                  value={form.singlePtnGoodsCd}
                  onChange={(event) =>
                    updateField("singlePtnGoodsCd", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="single-opt-value">단품 옵션값</FieldLabel>
                <Input
                  id="single-opt-value"
                  value={form.singleOptValue}
                  onChange={(event) =>
                    updateField("singleOptValue", event.target.value)
                  }
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="map-cnt">구성수량 *</FieldLabel>
                <Input
                  id="map-cnt"
                  type="number"
                  min={1}
                  step={1}
                  value={form.mapCnt}
                  onChange={(event) => updateField("mapCnt", event.target.value)}
                  required
                  disabled={loading}
                />
              </Field>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "저장 중..." : isEdit ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
