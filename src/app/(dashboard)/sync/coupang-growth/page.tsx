import { redirect } from "next/navigation";

import {
  coupangGrowthSyncTabGroup,
  getDefaultTabHref,
} from "@/config/page-tabs";

export default function CoupangGrowthSyncPage() {
  redirect(getDefaultTabHref(coupangGrowthSyncTabGroup));
}
