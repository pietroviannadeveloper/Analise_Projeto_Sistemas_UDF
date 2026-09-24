import type { Metadata } from "next";
import "./globals.css";
import "./parking.css";

export const metadata: Metadata = {
  title: "UDF Parking · Campus 3D",
  description: "Explore o campus em 3D, vagas simuladas e planos propostos do UDF Parking.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
