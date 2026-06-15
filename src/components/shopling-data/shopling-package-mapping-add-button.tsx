"use client";

import { useState } from "react";

import { ShoplingPackageMappingFormDialog } from "@/components/shopling-data/shopling-package-mapping-form-dialog";
import { Button } from "@/components/ui/button";

export function ShoplingPackageMappingAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        추가
      </Button>
      <ShoplingPackageMappingFormDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
