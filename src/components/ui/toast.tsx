"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, options?: { onUndo?: () => void; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; className: string }> = {
  success: { icon: CheckCircle, className: "bg-success" },
  error: { icon: XCircle, className: "bg-destructive" },
  warning: { icon: AlertTriangle, className: "bg-warning text-warning-foreground" },
  info: { icon: Info, className: "bg-primary" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, options?: { onUndo?: () => void; duration?: number }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, onUndo: options?.onUndo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options?.duration ?? 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUndo = useCallback((toast: Toast) => {
    toast.onUndo?.();
    removeToast(toast.id);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed right-4 top-4 z-[100] flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-right-5 fade-in duration-200",
                config.className,
              )}
              role="alert"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              {toast.onUndo && (
                <button
                  onClick={() => handleUndo(toast)}
                  className="ml-1 flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold hover:bg-white/20 transition-colors"
                  aria-label="Undo"
                >
                  <Undo2 className="h-3 w-3" />
                  Undo
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-1 shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
