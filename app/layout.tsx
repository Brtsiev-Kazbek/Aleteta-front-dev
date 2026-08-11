import type { Metadata } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Алетейя — AI Document OS",
  description:
    "Рабочее пространство для дел и документов: распознавание сканов, проверка реквизитов до генерации и выпуск пакета документов по вашим шаблонам.",
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
