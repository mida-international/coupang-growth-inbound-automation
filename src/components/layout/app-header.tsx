"use client";

import { usePathname } from "next/navigation";

import {
  dataNavGroup,
  mainNavItems,
  settingsNavGroup,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type NavContext = {
  groupTitle?: string;
  pageTitle: string;
  pageHref: string;
};

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveItem(pathname: string, items: NavItem[]) {
  return items.find((item) => isNavItemActive(pathname, item.href));
}

function findInGroup(pathname: string, group: NavGroup) {
  const item = findActiveItem(pathname, group.items);
  if (!item) {
    return null;
  }

  return {
    groupTitle: group.title,
    pageTitle: item.title,
    pageHref: item.href,
  };
}

function getNavContext(pathname: string): NavContext {
  const mainItem = findActiveItem(pathname, mainNavItems);
  if (mainItem) {
    return {
      pageTitle: mainItem.title,
      pageHref: mainItem.href,
    };
  }

  const dataMatch = findInGroup(pathname, dataNavGroup);
  if (dataMatch) {
    return dataMatch;
  }

  const settingsMatch = findInGroup(pathname, settingsNavGroup);
  if (settingsMatch) {
    return settingsMatch;
  }

  return {
    pageTitle: "대시보드",
    pageHref: "/",
  };
}

function HeaderBreadcrumb({ pathname }: { pathname: string }) {
  const { groupTitle, pageTitle } = getNavContext(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-2 text-lg">
        {groupTitle ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-lg font-semibold text-foreground">
                {groupTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-lg font-semibold text-foreground">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-lg font-semibold text-foreground">
              {pageTitle}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <HeaderBreadcrumb pathname={pathname} />
      <LogoutButton />
    </header>
  );
}
