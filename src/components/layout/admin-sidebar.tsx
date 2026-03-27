"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/admin/courses", icon: BookOpen, labelKey: "courses" as const },
  { href: "/admin/students", icon: Users, labelKey: "students" as const },
  { href: "/admin/reports", icon: BarChart3, labelKey: "reports" as const },
  { href: "/admin/settings", icon: Settings, labelKey: "settings" as const },
];

function SidebarNav({
  pathname,
  t,
  onLinkClick,
}: {
  pathname: string;
  t: (key: "dashboard" | "courses" | "students" | "reports" | "settings") => string;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {sidebarLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/admin/dashboard"
            ? pathname === "/admin/dashboard" || pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
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
    </>
  );
}

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen, closeDrawer]);

  // Trap focus inside drawer when open
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Focus the close button when drawer opens
    const firstFocusable = drawer.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    function handleTabTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusableElements = drawer.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTabTrap);
    return () => document.removeEventListener("keydown", handleTabTrap);
  }, [drawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop sidebar - unchanged */}
      <aside className="hidden w-56 shrink-0 border-r bg-secondary/30 md:block">
        <nav className="sticky top-16 space-y-1 p-4">
          <SidebarNav pathname={pathname} t={t} />
        </nav>
      </aside>

      {/* Mobile menu trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={t("menuOpen") ?? "Open menu"}
        aria-expanded={drawerOpen}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer overlay + panel */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          onClick={closeDrawer}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Drawer panel */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("navigation") ?? "Admin navigation"}
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-background shadow-xl transition-transform duration-300 ease-in-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b p-4">
            <span className="text-sm font-semibold">
              {t("navigation") ?? "Navigation"}
            </span>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                triggerRef.current?.focus();
              }}
              aria-label={t("menuClose") ?? "Close menu"}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer nav */}
          <nav className="space-y-1 p-4">
            <SidebarNav
              pathname={pathname}
              t={t}
              onLinkClick={closeDrawer}
            />
          </nav>
        </div>
      </div>
    </>
  );
}
