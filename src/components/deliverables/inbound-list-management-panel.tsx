import { ShoplingInboundOriginalSection } from "@/components/deliverables/shopling-inbound-original-section";
import { ShoplingInboundTemplateSection } from "@/components/deliverables/shopling-inbound-template-section";

export function InboundListManagementPanel() {
  return (
    <div className="space-y-6">
      <ShoplingInboundTemplateSection />
      <ShoplingInboundOriginalSection />
    </div>
  );
}
