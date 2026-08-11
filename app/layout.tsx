import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Алетейя — AI Document OS",
  description:
    "Интеллектуальная операционная система для ваших дел и документов: анализ файлов, извлечение реквизитов и массовая генерация документов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={fontVariables}>
      <body className="bg-bg text-fg antialiased">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
