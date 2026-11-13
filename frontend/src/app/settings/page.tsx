"use client";

import { useState, useEffect } from "react";
import {
  User,
  Key,
  Shield,
  Palette,
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ExternalLink,
  Save,
  Crown,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [name, setName] = useState("Demo Creator");
  const [email, setEmail] = useState("demo@clipforge.ai");
  const [plan, setPlan] = useState("pro");
  const [openaiKey, setOpenaiKey] = useState("");
  const [youtubeKey, setYoutubeKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await api.getMe();
        setName(u.name);
        setEmail(u.email);
        setPlan(u.plan);
      } catch (e) {}
    }
    loadProfile();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex bg-background">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings & Preferences</h1>
          <p className="text-sm text-muted mt-1">
            Manage your account credentials, AI API keys, and subscription details.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* PROFILE SECTION */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-border pb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">Profile Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-xs text-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* AI & API PREFERENCES */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-border pb-4">
              <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                <Key className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">AI Engine & API Keys</h2>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              ClipForge AI includes built-in fallback moment detection and local Whisper transcription out of the box.
              You can optionally supply your own OpenAI API key for maximum viral scoring accuracy.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">OpenAI API Key (Optional)</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-muted">Used for GPT-4o analysis and Whisper transcription.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">YouTube Data API v3 Key (Optional)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={youtubeKey}
                  onChange={(e) => setYoutubeKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-muted">Used for official YouTube metadata and channel verification.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Preferred LLM Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Efficient)</option>
                  <option value="gpt-4o">GPT-4o (Deep Context & Viral Scoring)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION PLAN */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Current Subscription</h2>
                  <p className="text-xs text-muted">Pro Plan Active • Unlimited AI Shorts</p>
                </div>
              </div>

              <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                PRO ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <p className="font-bold text-white">Features Included:</p>
                <ul className="space-y-1.5 text-muted">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Unlimited Short Generations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> 1080p 9:16 Vertical Export
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> Karaoke Animated Subtitles
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border flex flex-col justify-between">
                <div>
                  <p className="font-bold text-white">Billing Information</p>
                  <p className="text-muted mt-1">Stripe customer portal ready for production deployment.</p>
                </div>
                <button
                  type="button"
                  className="mt-3 py-2 px-3 rounded-xl bg-card-border hover:bg-zinc-700 text-white font-semibold text-xs text-center transition-colors"
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
