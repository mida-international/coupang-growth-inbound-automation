import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInteractionProvider } from "@/hooks/use-sidebar-hover";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-icon": "4.25rem",
        } as React.CSSProperties
      }
    >
      <SidebarInteractionProvider>
        <AppSidebar showSidebarTrigger />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarInteractionProvider>
    </SidebarProvider>
  );
}
