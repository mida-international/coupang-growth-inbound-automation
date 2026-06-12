import { redirect } from "next/navigation";

import { coupangGrowthTabGroup, getDefaultTabHref } from "@/config/page-tabs";

export default function CoupangGrowthPage() {
  redirect(getDefaultTabHref(coupangGrowthTabGroup));
}
