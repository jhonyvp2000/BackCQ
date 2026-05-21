import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BackCQ - Control de Centro Quirúrgico",
  description: "Sistema de gestión y programación del Centro Quirúrgico",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
