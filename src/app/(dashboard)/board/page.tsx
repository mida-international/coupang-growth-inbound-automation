import { redirect } from "next/navigation";

import {
  boardCategoryTabGroup,
  getDefaultTabHref,
} from "@/config/page-tabs";

export default function BoardPage() {
  redirect(getDefaultTabHref(boardCategoryTabGroup));
}
