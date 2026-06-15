"use client";

import { useState } from "react";

import { ShoplingApiConnectionTest } from "@/components/integrations/shopling-api-connection-test";
import { ShoplingApiForm } from "@/components/integrations/shopling-api-form";
import type { ShoplingApiConfigView } from "@/services/shopling-api-config/types";

type ShoplingIntegrationsPanelProps = {
  initialConfig: ShoplingApiConfigView;
};

export function ShoplingIntegrationsPanel({
  initialConfig,
}: ShoplingIntegrationsPanelProps) {
  const [hasConfig, setHasConfig] = useState(initialConfig.hasConfig);
  const [isFormDirty, setIsFormDirty] = useState(false);

  return (
    <div className="space-y-6">
      <ShoplingApiForm
        initialConfig={initialConfig}
        onDirtyChange={setIsFormDirty}
        onSaved={(config) => {
          setHasConfig(config.hasConfig);
        }}
      />
      <ShoplingApiConnectionTest
        hasConfig={hasConfig}
        isFormDirty={isFormDirty}
      />
    </div>
  );
}
