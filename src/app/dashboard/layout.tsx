
"use client";
import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoutes';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar'; // Assuming this is the correct path to your enhanced sidebar
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ScanLine, History, UserCircle, Settings, LifeBuoy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Overview & New Scan', icon: ScanLine },
  { href: '/dashboard/scans', label: 'Scan History', icon: History },
  { href: '/dashboard/account', label: 'Account Settings', icon: UserCircle },
];

const adminNavItems = [
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/system', label: 'System Logs', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-primary" />
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden font-headline">Safety Scan</span>
            </Link>
            <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={{children: item.label, side:"right", className:"ml-2"}}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
              {userProfile?.role === 'admin' && (
                <>
                  <SidebarMenuItem className="mt-4 mb-1">
                    <span className="text-xs text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">Admin</span>
                  </SidebarMenuItem>
                  {adminNavItems.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                          <SidebarMenuButton
                            isActive={pathname === item.href}
                            tooltip={{children: item.label, side:"right", className:"ml-2"}}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 mt-auto border-t">
              <Button variant="outline" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                <LifeBuoy className="w-5 h-5 group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Support</span>
              </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
