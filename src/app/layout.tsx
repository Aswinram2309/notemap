import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteMap — Infinite Canvas Workspace",
  description: "Milanote-inspired infinite canvas workspace for roadmaps, video planning, game development, and study notes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full w-full overflow-hidden flex flex-col bg-[#EAEAE6] text-[#292929]">
        {children}
      </body>
    </html>
  );
}
