import type { ReactNode } from "react";

export const metadata = {
  title: "Plataforma de Certificação",
  description: "Online certification platform for medical education",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
