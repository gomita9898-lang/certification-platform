"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/admin/courses", icon: BookOpen, labelKey: "courses" as const },
  { href: "/admin/students", icon: Users, labelKey: "students" as const },
  { href: "/admin/reports", icon: BarChart3, labelKey: "reports" as const },
  { href: "/admin/settings", icon: Settings, labelKey: "settings" as const },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-secondary/30 md:block">
      <nav className="sticky top-16 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
