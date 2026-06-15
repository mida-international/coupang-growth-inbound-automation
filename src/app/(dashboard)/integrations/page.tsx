import { redirect } from "next/navigation";

import {
  getDefaultTabHref,
  integrationsTabGroup,
} from "@/config/page-tabs";

export default function IntegrationsPage() {
  redirect(getDefaultTabHref(integrationsTabGroup));
}
