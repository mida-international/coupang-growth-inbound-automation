"use client";

import { usePathname } from "next/navigation";

import {
  dataNavGroup,
  mainNavItems,
  settingsNavGroup,
  syncNavGroup,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";
import {
  boardWorkflowTabGroup,
  findPageTabGroup,
  getActivePageTabHref,
} from "@/config/page-tabs";
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
    if (
      isNavItemActive(pathname, "/downloads") ||
      isNavItemActive(pathname, "/board")
    ) {
      if (isNavItemActive(pathname, "/board")) {
        const activeWorkflowHref = getActivePageTabHref(
          pathname,
          boardWorkflowTabGroup.tabs,
        );
        const activeWorkflowTab = boardWorkflowTabGroup.tabs.find(
          (tab) => tab.href === activeWorkflowHref,
        );

        if (activeWorkflowTab) {
          return {
            groupTitle: mainItem.title,
            pageTitle: activeWorkflowTab.title,
            pageHref: activeWorkflowTab.href,
          };
        }
      }

      const tabGroup = findPageTabGroup(pathname);
      if (tabGroup) {
        const activeTabHref = getActivePageTabHref(pathname, tabGroup.tabs);
        const activeTab = tabGroup.tabs.find(
          (tab) => tab.href === activeTabHref,
        );

        if (activeTab) {
          return {
            groupTitle: mainItem.title,
            pageTitle: activeTab.title,
            pageHref: activeTab.href,
          };
        }
      }
    }

    return {
      pageTitle: mainItem.title,
      pageHref: mainItem.href,
    };
  }

  const syncMatch = findInGroup(pathname, syncNavGroup);
  if (syncMatch) {
    return syncMatch;
  }

  const dataMatch = findInGroup(pathname, dataNavGroup);
  if (dataMatch) {
    if (isNavItemActive(pathname, "/data/dashboard")) {
      const tabGroup = findPageTabGroup(pathname);
      if (tabGroup) {
        const activeTabHref = getActivePageTabHref(pathname, tabGroup.tabs);
        const activeTab = tabGroup.tabs.find(
          (tab) => tab.href === activeTabHref,
        );

        if (activeTab) {
          return {
            groupTitle: dataNavGroup.title,
            pageTitle: activeTab.title,
            pageHref: activeTab.href,
          };
        }
      }
    }

    return dataMatch;
  }

  const settingsMatch = findInGroup(pathname, settingsNavGroup);
  if (settingsMatch) {
    if (isNavItemActive(pathname, "/integrations")) {
      const tabGroup = findPageTabGroup(pathname);
      if (tabGroup) {
        const activeTabHref = getActivePageTabHref(pathname, tabGroup.tabs);
        const activeTab = tabGroup.tabs.find(
          (tab) => tab.href === activeTabHref,
        );

        if (activeTab) {
          return {
            groupTitle: settingsNavGroup.title,
            pageTitle: activeTab.title,
            pageHref: activeTab.href,
          };
        }
      }
    }

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
