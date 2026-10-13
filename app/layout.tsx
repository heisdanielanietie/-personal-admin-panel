import type { Metadata } from "next";
import "./globals.css";
import "./studio-theme.css";
import {StudioTheme} from "./studio-theme";

export const metadata: Metadata = {
  title: "Daniel Studio — Your website workspace",
  description: "Edit your websites visually, save drafts, and publish a private copy.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><StudioTheme>{children}</StudioTheme></body>
    </html>
  );
}
