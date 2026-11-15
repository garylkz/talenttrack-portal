import { BRAND_CONFIG } from "@/lib/config";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_CONFIG.name} | ${BRAND_CONFIG.tagline}`,
  description:
    "Track your job application status and view real-time hiring stage updates.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 transition-transform group-hover:scale-105">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {BRAND_CONFIG.name}
                </span>
                <span className="hidden sm:inline-block ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Careers Portal
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Check Status
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Recruiter Admin</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <p>
              &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights
              reserved.
            </p>
            <p>
              Need assistance with your application? Contact{" "}
              <a
                href={`mailto:${BRAND_CONFIG.supportEmail}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {BRAND_CONFIG.supportEmail}
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
