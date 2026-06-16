import { redirect } from "next/navigation";

import {
  deliverablesTabGroup,
  getDefaultTabHref,
} from "@/config/page-tabs";

export default function DownloadsPage() {
  redirect(getDefaultTabHref(deliverablesTabGroup));
}
