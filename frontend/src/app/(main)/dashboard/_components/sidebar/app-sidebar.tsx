"use client";

import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { useAuth } from "@/hooks/use-auth";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const { user } = useAuth();
  
  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const filteredItems = sidebarItems.map((group) => {
    return {
      ...group,
      items: group.items.filter((item) => {
        if (item.id === "file-manager") {
          return user?.role === "admin";
        }
        return true;
      })
    };
  }).filter((group) => {
    if (group.label === "Admin") {
      return user?.role === "admin";
    }
    return group.items.length > 0;
  });

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/dashboard/productivity">
                <img
                  src="/logo_hitam.png"
                  alt="Logo"
                  className="size-7 shrink-0 object-contain block dark:hidden"
                />
                <img src="/logo_putih.png" alt="Logo" className="size-7 shrink-0 object-contain hidden dark:block" />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user?.username || "User", avatar: "", role: user?.role === "admin" ? "Workspace Owner" : "User" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
