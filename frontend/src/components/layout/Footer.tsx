import Link from "next/link";
import { Sparkles, Shield, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/90 text-muted py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-base">ClipForge AI</span>
            <p className="text-xs text-muted">Empowering content creators with intelligent short-form video generation.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted">
          <div className="flex items-center gap-1.5 text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>TOS & Copyright Compliant</span>
          </div>
          <span>•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/settings" className="hover:text-white transition-colors">
            API Settings
          </Link>
        </div>

        <div className="text-xs text-muted flex items-center gap-1">
          <span>Built for Creators with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>in 2026</span>
        </div>
      </div>
    </footer>
  );
}
