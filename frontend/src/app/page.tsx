"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Play,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Flame,
  Zap,
  Layers,
  Crop,
  Type,
  Share2,
  HelpCircle,
  ShieldCheck,
  Check,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const handleQuickValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsValidating(true);
    try {
      const res = await api.validateYoutubeUrl(urlInput);
      setValidationResult(res);
      if (res.is_valid) {
        // Redirect to create page with URL pre-filled
        router.push(`/create?youtube_url=${encodeURIComponent(urlInput)}`);
      }
    } catch (err) {
      setValidationResult({
        is_valid: false,
        message: "Failed to validate URL. Please check your network connection.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const faqs = [
    {
      q: "How does ClipForge AI find the best moments to turn into shorts?",
      a: "ClipForge AI extracts the audio from your video, transcribes it word-for-word using Whisper, and runs our advanced AI retention algorithm to detect opening hooks, emotional peaks, surprising insights, and punchlines.",
    },
    {
      q: "Does ClipForge AI comply with YouTube's Terms of Service?",
      a: "Yes, 100%. We retrieve video metadata exclusively through authorized APIs (oEmbed & YouTube Data API). Users upload their own source media or authorized recordings, ensuring full respect for copyright and platform integrity.",
    },
    {
      q: "What video aspect ratios are supported?",
      a: "We support 9:16 vertical (YouTube Shorts, TikTok, Instagram Reels), 1:1 square (Instagram feed, LinkedIn), and 16:9 widescreen with intelligent face-centered auto reframing.",
    },
    {
      q: "Can I customize the generated captions?",
      a: "Absolutely! Choose from 4 caption styles (Modern, Bold, Karaoke, Minimal), adjust font sizes, change text and highlight colors, reposition subtitles, and edit individual words inside our built-in video editor.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[250px] bg-secondary/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-card-border mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-secondary">ClipForge AI 2.0 Released</span>
            <span className="text-xs text-muted">• Auto 9:16 Video Reframe</span>
          </div>

          {/* Heading & Subheading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Turn Long Videos Into <br />
            <span className="text-gradient">Viral Shorts With AI</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Transform hours of content into engaging short-form videos in minutes. Powered by intelligent moment
            detection, automated vertical cropping, and animated karaoke captions.
          </p>

          {/* Quick Input Action Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form onSubmit={handleQuickValidate} className="relative flex flex-col sm:flex-row gap-3 p-2 rounded-2xl glass-card glow-purple">
              <div className="relative flex-1 flex items-center">
                <LinkIcon className="absolute left-4 w-5 h-5 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Paste YouTube video link (e.g. https://youtube.com/watch?v=...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/60 border border-border text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isValidating}
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Start Creating Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {validationResult && !validationResult.is_valid && (
              <p className="mt-3 text-xs text-rose-400 font-medium">{validationResult.message}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted">
              <Link href="/create" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-secondary" />
                <span>Or upload video file (MP4, MOV, WebM)</span>
              </Link>
              <span>•</span>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                See How It Works ↓
              </a>
            </div>
          </div>

          {/* INTERACTIVE PRODUCT PREVIEW SECTION */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-card-border/80 via-card/40 to-background border border-card-border shadow-2xl">
            <div className="rounded-2xl bg-card/90 overflow-hidden border border-border p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
              {/* Left Column: Metrics & Features */}
              <div className="md:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/20 text-primary-light text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Highlight Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  From 1 Hour Podcast to 5 High-Retention Viral Shorts
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  ClipForge scans cadence, speech semantics, and audience engagement hooks to isolate self-contained
                  lessons and punchlines with zero filler.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <p className="text-2xl font-extrabold text-white">98%</p>
                    <p className="text-xs text-muted mt-0.5">Average Hook Score</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <p className="text-2xl font-extrabold text-secondary">3.4x</p>
                    <p className="text-xs text-muted mt-0.5">Watch Time Multiplier</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Auto 9:16 smart cropping centered on active speaker</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dynamic word-level karaoke animated subtitles</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Burned directly with hardware-accelerated FFmpeg</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 9:16 Phone Mockup */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-64 h-[440px] rounded-[36px] p-2 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 shadow-2xl border-2 border-zinc-700/60">
                  {/* Phone notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-950 rounded-full z-20" />

                  {/* Phone Screen */}
                  <div className="w-full h-full rounded-[28px] bg-gradient-to-b from-purple-900/60 to-black overflow-hidden relative flex flex-col justify-between p-4 pt-10 text-white">
                    {/* Top overlay badge */}
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500 text-black flex items-center gap-1 shadow">
                        <Flame className="w-3 h-3" /> 98 VIRAL SCORE
                      </span>
                      <span className="text-[10px] text-zinc-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                        0:24
                      </span>
                    </div>

                    {/* Middle preview graphics */}
                    <div className="text-center my-auto space-y-2 z-10">
                      <div className="w-12 h-12 rounded-full bg-primary/40 border border-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/50">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-300">Clip #1: The 3-Step Growth Formula</p>
                    </div>

                    {/* Animated Subtitle Overlay */}
                    <div className="z-10 bg-black/70 p-3 rounded-xl border border-white/10 backdrop-blur-md text-center space-y-1">
                      <p className="text-xs font-extrabold uppercase tracking-wide">
                        <span className="text-amber-400 bg-amber-400/20 px-1 rounded">CAPTURE ATTENTION</span> IN THE
                        FIRST 2 SECONDS!
                      </p>
                      <p className="text-[9px] text-zinc-400">#clipforge #strategy #growth</p>
                    </div>

                    {/* Vertical background grid effect */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:16px_16px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 border-t border-border/60 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Workflow</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How ClipForge AI Works in 3 Simple Steps
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto text-sm sm:text-base">
            From raw long-form footage to ready-to-publish short-form clips in under 60 seconds.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-card border border-border relative group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Input Your Video</h3>
              <p className="text-sm text-muted leading-relaxed">
                Paste any YouTube link to fetch metadata or drop your original MP4, MOV, or WebM video file directly
                into the browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-card border border-border relative group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Analyzes Content</h3>
              <p className="text-sm text-muted leading-relaxed">
                Whisper generates timestamped transcripts while our LLM moment-scoring engine pinpoints the highest
                retention segments.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-card border border-border relative group hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Edit, Reframe & Export</h3>
              <p className="text-sm text-muted leading-relaxed">
                Preview your 9:16 vertical shorts, customize caption styling or timing in the editor, and download
                crisp 1080p MP4s with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Maximum Organic Reach
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Crop,
                title: "Intelligent 9:16 Auto Reframe",
                desc: "Automatically crops widescreen videos into vertical mobile format without awkward stretching or loss of focus.",
              },
              {
                icon: Type,
                title: "Animated Karaoke Subtitles",
                desc: "High-contrast dynamic captions with word-by-word highlights proven to boost watch-time by over 40%.",
              },
              {
                icon: Flame,
                title: "AI Viral Score & Hook Detection",
                desc: "Ranks every extracted clip with an engagement score (0-100) and writes catchy titles and hashtag descriptions.",
              },
              {
                icon: Layers,
                title: "Built-In Video Editor",
                desc: "Trim clip boundaries, fine-tune subtitle timestamps, adjust font sizes, and switch aspect ratios directly in the browser.",
              },
              {
                icon: Zap,
                title: "Real-Time FFmpeg Rendering",
                desc: "Hardware-accelerated video cuts and subtitle burning ensure fast exports without compromising 1080p source quality.",
              },
              {
                icon: ShieldCheck,
                title: "100% TOS & Copyright Safe",
                desc: "Built to honor YouTube policies. Uses official APIs for metadata and processes authorized video sources securely.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-border/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUPPORTED PLATFORMS */}
      <section className="py-16 border-t border-border/60 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-6">
            Export short videos formatted for every modern platform
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-zinc-300">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>YouTube Shorts (9:16)</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>Instagram Reels (9:16)</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>TikTok Videos (9:16)</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>LinkedIn & Feed (1:1)</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Transparent Plans</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Start Free, Upgrade When You Grow
          </h2>
          <p className="mt-4 text-muted max-w-lg mx-auto text-sm">
            Everything you need to turn podcasts, interviews, and long tutorials into viral shorts.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-card border border-border flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-muted">Starter</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-muted">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted">Ideal for creators trying out AI shorts generation.</p>

                <div className="mt-8 space-y-3">
                  {[
                    "Up to 5 AI Shorts per project",
                    "Max 15 minute video source",
                    "720p / 1080p standard export",
                    "Modern & Minimal subtitle styles",
                    "Full browser video editor access",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/create"
                className="mt-8 w-full py-3 rounded-xl bg-card-border hover:bg-zinc-700 text-white font-semibold text-xs text-center transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-primary/20 via-card to-card border-2 border-primary/50 relative flex flex-col justify-between shadow-xl shadow-primary/10">
              <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow">
                Most Popular
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-secondary">Creator Pro</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">$29</span>
                  <span className="text-xs text-muted">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted">Designed for prolific podcasters and marketing teams.</p>

                <div className="mt-8 space-y-3">
                  {[
                    "Unlimited AI Shorts generation",
                    "Up to 2 hour long-form videos",
                    "Crisp 1080x1920 HD exports",
                    "Animated Karaoke & Bold subtitles",
                    "Priority FFmpeg background queue",
                    "Custom branding & highlight colors",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-white font-medium">
                      <Check className="w-4 h-4 text-secondary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/create"
                className="mt-8 w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs text-center transition-all shadow-md shadow-primary/30"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 border-t border-border/60 bg-card/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div key={index} className="rounded-2xl bg-card border border-border overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-secondary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-muted ml-4 text-base">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-muted leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 border-t border-border/60 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Turn Hours into Viral Minutes?
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto">
            Join creators who use ClipForge AI to automatically generate dozens of high-retention shorts every week.
          </p>
          <div className="pt-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xl shadow-primary/30 transition-all active:scale-95"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
