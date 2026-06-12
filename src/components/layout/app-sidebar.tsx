"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import {
  APP_NAME,
  dataNavGroup,
  mainNavItems,
  syncNavGroup,
  settingsNavGroup as defaultSettingsNavGroup,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarInteraction } from "@/hooks/use-sidebar-hover";
import { cn } from "@/lib/utils";

const iconRailMenuClassName =
  "group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2";

const expandedMenuClassName = "gap-1.5 px-3 py-2";

const expandedIconClassName = "[&_svg]:size-[1.35rem]";

const expandedButtonClassName = cn(
  "h-11 gap-3 px-3 text-[0.95rem] leading-snug font-medium",
  expandedIconClassName,
);

const expandedSubButtonClassName = cn(
  "h-10 gap-3 px-3 text-[0.9rem] leading-snug",
  "[&_svg]:size-5",
);

const expandedGroupTriggerClassName = cn(
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] font-medium text-sidebar-foreground/70",
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  "[&[data-panel-open]]:text-sidebar-foreground",
);

function menuButtonClassName(isCollapsed: boolean) {
  if (isCollapsed) {
    return cn(
      "!size-10 !w-10 !min-w-10 !max-w-10 mx-auto justify-center p-0 overflow-hidden",
      expandedIconClassName,
      "text-sidebar-foreground/75",
      "data-active:bg-primary/12 data-active:text-primary data-active:[&_svg]:text-primary",
      "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
    );
  }

  return expandedButtonClassName;
}

function menuListClassName(isCollapsed: boolean) {
  return cn(iconRailMenuClassName, !isCollapsed && expandedMenuClassName);
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIconMenuItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuItem
      className={cn(isCollapsed && "flex w-full justify-center")}
    >
      <SidebarMenuButton
        className={menuButtonClassName(isCollapsed)}
        tooltip={item.title}
        isActive={isNavItemActive(pathname, item.href)}
        render={<Link href={item.href} />}
      >
        <item.icon />
        {!isCollapsed ? <span>{item.title}</span> : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavCollapsibleGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isGroupActive = group.items.some((item) =>
    isNavItemActive(pathname, item.href),
  );
  const [open, setOpen] = React.useState(isGroupActive);

  React.useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive]);

  if (isCollapsed) {
    return (
      <SidebarGroup className="py-0">
        <SidebarMenu className={menuListClassName(true)}>
          {group.items.map((item) => (
            <NavIconMenuItem key={item.href} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible"
      >
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className={expandedGroupTriggerClassName}>
              <group.icon className="size-[1.35rem] shrink-0" />
              <span className="flex-1 text-left">{group.title}</span>
              <ChevronDown className="size-[1.1rem] shrink-0 transition-transform group-data-[panel-open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          }
        />
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuSub className="gap-1.5 py-1">
                {group.items.map((item) => (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarMenuSubButton
                      className={expandedSubButtonClassName}
                      isActive={isNavItemActive(pathname, item.href)}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar({
  showSidebarTrigger = true,
  isMaster = false,
}: {
  showSidebarTrigger?: boolean;
  isMaster?: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { sidebarInteractionHandlers } = useSidebarInteraction();
  const settingsNavGroup = React.useMemo(
    () => ({
      ...defaultSettingsNavGroup,
      items: defaultSettingsNavGroup.items.filter(
        (item) => !item.masterOnly || isMaster
      ),
    }),
    [isMaster]
  );

  if (!showSidebarTrigger) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...sidebarInteractionHandlers}>
      <SidebarHeader
        className={cn(
          "flex h-14 shrink-0 flex-row items-center border-b border-sidebar-border py-0",
          isCollapsed ? "justify-center px-2" : "px-4",
        )}
      >
        {isCollapsed ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            미
          </span>
        ) : (
          <span className="text-lg font-semibold text-primary">{APP_NAME}</span>
        )}
      </SidebarHeader>
      <SidebarContent
        className={cn(
          isCollapsed && "overflow-x-hidden",
          !isCollapsed && "gap-2 py-1",
        )}
      >
        <SidebarGroup className={cn(isCollapsed && "py-0", !isCollapsed && "py-1")}>
          <SidebarGroupContent>
            <SidebarMenu className={menuListClassName(isCollapsed)}>
              {mainNavItems.map((item) => (
                <NavIconMenuItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavCollapsibleGroup group={syncNavGroup} pathname={pathname} />
        <NavCollapsibleGroup group={dataNavGroup} pathname={pathname} />
        <NavCollapsibleGroup group={settingsNavGroup} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
