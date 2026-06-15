import { redirect } from "next/navigation";

import { getDefaultTabHref, shoplingDataTabGroup } from "@/config/page-tabs";

export default function ShoplingDataPage() {
  redirect(getDefaultTabHref(shoplingDataTabGroup));
}
