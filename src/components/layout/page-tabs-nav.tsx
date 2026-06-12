"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getActivePageTabHref,
  type PageTab,
} from "@/config/page-tabs";
import { cn } from "@/lib/utils";

type PageTabsNavProps = {
  tabs: PageTab[];
  className?: string;
};

export function PageTabsNav({ tabs, className }: PageTabsNavProps) {
  const pathname = usePathname();
  const activeHref = getActivePageTabHref(pathname, tabs);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="페이지 탭"
      className={cn("border-b border-border", className)}
    >
      <div className="flex h-11 items-end gap-1">
        {tabs.map((tab) => {
          const isActive = tab.href === activeHref;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
