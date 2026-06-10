"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import {
  APP_NAME,
  dataNavGroup,
  mainNavItems,
  settingsNavGroup,
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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isNavItemActive(pathname, item.href)}
        render={<Link href={item.href} />}
      >
        <item.icon />
        <span>{item.title}</span>
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
  const isGroupActive = group.items.some((item) =>
    isNavItemActive(pathname, item.href),
  );
  const [open, setOpen] = React.useState(isGroupActive);

  React.useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive]);

  return (
    <SidebarGroup>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible"
      >
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "[&[data-panel-open]]:text-sidebar-foreground",
              )}
            >
              <span className="flex-1 text-left">{group.title}</span>
              <ChevronDown className="size-4 shrink-0 transition-transform group-data-[panel-open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          }
        />
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuSub>
                {group.items.map((item) => (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarMenuSubButton
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 shrink-0 flex-row items-center border-b border-sidebar-border px-4 py-0">
        <span className="text-base font-semibold text-primary">{APP_NAME}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavMenuItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavCollapsibleGroup group={dataNavGroup} pathname={pathname} />
        <NavCollapsibleGroup group={settingsNavGroup} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
