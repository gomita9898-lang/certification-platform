"use client";

import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-300", className)}>
      {children}
    </div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export function StaggerItem({ children, index, className }: StaggerItemProps) {
  return (
    <div
      className={cn("animate-in fade-in slide-in-from-bottom-2 fill-mode-both", className)}
      style={{ animationDelay: `${index * 75}ms`, animationDuration: "300ms" }}
    >
      {children}
    </div>
  );
}
