import { ShoplingIntegrationsPanel } from "@/components/integrations/shopling-integrations-panel";
import { requireMaster } from "@/lib/auth/profile";
import { getShoplingApiConfig } from "@/services/shopling-api-config/get-shopling-api-config";

export default async function IntegrationsShoplingPage() {
  await requireMaster();

  const configResult = await getShoplingApiConfig();

  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">샵플링</h1>
        <p className="text-muted-foreground">
          샵플링 외부 연동 설정 및 API 연동을 관리합니다.
        </p>
      </div>

      <ShoplingIntegrationsPanel initialConfig={configResult.data} />
    </div>
  );
}
