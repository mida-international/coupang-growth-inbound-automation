import { redirect } from "next/navigation";

import { dashboardTabGroup, getDefaultTabHref } from "@/config/page-tabs";

export default function DashboardPage() {
  redirect(getDefaultTabHref(dashboardTabGroup));
}
