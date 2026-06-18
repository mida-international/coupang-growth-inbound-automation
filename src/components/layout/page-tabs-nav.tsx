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
  equalWidth?: boolean;
};

export function PageTabsNav({
  tabs,
  className,
  equalWidth = false,
}: PageTabsNavProps) {
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
      <div
        className={cn(
          "h-11 items-end gap-1",
          equalWidth ? "grid" : "flex",
        )}
        style={
          equalWidth
            ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {tabs.map((tab) => {
          const isActive = tab.href === activeHref;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors",
                equalWidth && "justify-center",
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
