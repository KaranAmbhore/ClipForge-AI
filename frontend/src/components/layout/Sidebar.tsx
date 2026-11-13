"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  FolderKanban,
  Video,
  Settings as SettingsIcon,
  Crown,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Create Shorts", href: "/create", icon: Film, highlight: true },
    { label: "My Projects", href: "/projects", icon: FolderKanban },
    { label: "Video Library", href: "/projects", icon: Video },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-sm hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary-light font-semibold border border-primary/20 shadow-sm"
                    : "text-muted hover:text-white hover:bg-card-border/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted"}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary text-white">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upgrade / Pro Plan Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Crown className="w-16 h-16 text-primary" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm text-white">Pro Creator</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Unlimited AI short generations, 1080p 9:16 export, and custom karaoke subtitles.
          </p>
          <Link
            href="/settings"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all shadow-md shadow-primary/30"
          >
            <span>Manage Subscription</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
