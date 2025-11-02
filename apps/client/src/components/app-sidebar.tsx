"use client";

import * as React from "react";
import {
  ArchiveX,
  CircleUserRound,
  Command,
  File,
  Inbox,
  MessagesSquare,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";

import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useBoundStore } from "@/stores/useBoundStore";
import ChatsSidebar from "./chats-sidebar";
import FriendsSidebar from "./friends-sidebar";


type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const mainNavItems: NavItem[] = [
  {
    title: "Chats",
    url: "/chats",
    icon: MessagesSquare,
  },
  {
    title: "Friends",
    url: "/friends",
    icon: Users,
  },
];

const SecondarySidebars: Record<string, React.ComponentType> = {
  "/chats": ChatsSidebar,
  "/friends": FriendsSidebar,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const user = useBoundStore((state) => state.user);
  const { setOpen } = useSidebar();

  // Determinate if url is active
  function isRouteActive(url: string) {
    return location.pathname === url || location.pathname.startsWith(url + "/");
  }

  // Get sidebar component based on route name
  const SecondarySidebarComponent = React.useMemo(() => {
    const pathname = location.pathname;

    const componentKey = Object.keys(SecondarySidebars).find((key) =>
      pathname.startsWith(key)
    );

    return componentKey ? SecondarySidebars[componentKey] : null;
  }, [location.pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">HeyApp</span>
                    <span className="truncate text-xs">Messaging app</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      isActive={isRouteActive(item.url)}
                      className="px-2.5 md:px-2"
                      onClick={() => setOpen(true)}
                      asChild
                    >
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: "",
            }}
          />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="flex-1 md:flex">
        {SecondarySidebarComponent && <SecondarySidebarComponent />}
      </Sidebar>
    </Sidebar>
  );
}
