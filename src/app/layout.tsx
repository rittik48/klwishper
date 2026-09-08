import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { title: siteConfig.name, description: siteConfig.description, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"><body><script dangerouslySetInnerHTML={{ __html: `try { if (localStorage.getItem("whisperkl-theme") === "dark") document.documentElement.classList.add("dark"); } catch {}` }} />{children}<span className="version-badge">v{siteConfig.version}</span></body></html>
  );
}
