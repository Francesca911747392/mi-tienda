import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vidriera — Tu tienda online",
  description: "Creá tu tienda online y vendé por WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#FAFAF9] text-[#232120]">{children}</body>
    </html>
  );
}
