import type { Metadata } from "next";
export const metadata: Metadata = { title: "Painel — Clean Car System" };
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
