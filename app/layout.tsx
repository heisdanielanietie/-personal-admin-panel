import type { Metadata } from "next";
import "./globals.css";
import "./studio-theme.css";
import {StudioTheme} from "./studio-theme";

export const metadata: Metadata = {
  title: "DauVinci Studio — Your website workspace",
  description: "DauVinci Studio — a creative workspace for visually editing websites, shaping ideas and saving your work.",
  icons: {
    icon: "/favicon.svg?v=dauvinci",
    shortcut: "/favicon.svg?v=dauvinci",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><StudioTheme>{children}</StudioTheme></body>
    </html>
  );
}
