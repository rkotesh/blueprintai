import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueprintAI — Understand-While-You-Build",
  description: "The guided understand-while-you-build companion that sits between an idea and the code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
