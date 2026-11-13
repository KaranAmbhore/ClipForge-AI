"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Video, FolderGit2, Settings, Zap, ArrowRight, User as UserIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              ClipForge <span className="text-secondary text-xs uppercase px-1.5 py-0.5 rounded bg-primary/20 border border-primary/30 font-semibold">AI</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted">
          <Link
            href="/dashboard"
            className={`px-3.5 py-2 rounded-lg transition-colors hover:text-white ${
              pathname === "/dashboard" ? "text-white bg-card" : ""
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/create"
            className={`px-3.5 py-2 rounded-lg transition-colors hover:text-white ${
              pathname === "/create" ? "text-white bg-card" : ""
            }`}
          >
            Create Shorts
          </Link>
          <Link
            href="/projects"
            className={`px-3.5 py-2 rounded-lg transition-colors hover:text-white ${
              pathname === "/projects" ? "text-white bg-card" : ""
            }`}
          >
            My Projects
          </Link>
          <Link
            href="/settings"
            className={`px-3.5 py-2 rounded-lg transition-colors hover:text-white ${
              pathname === "/settings" ? "text-white bg-card" : ""
            }`}
          >
            Settings
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400/40" />
            <span>Pro Plan Active</span>
          </Link>

          <Link
            href="/create"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
          >
            <span>Create Shorts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
