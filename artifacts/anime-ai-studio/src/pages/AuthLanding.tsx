import { ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthLandingPage() {
  const [, setLocation] = useLocation();

  return (
    <main className="onboarding-shell relative flex min-h-[100dvh] flex-col overflow-hidden px-5 py-6 text-white sm:px-8 sm:py-8" data-testid="auth-landing">
      <div className="onboarding-grid" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3">
        <img src={`${basePath}/logo.svg`} alt="" className="h-10 w-10" />
        <span className="text-sm font-semibold tracking-wide text-white/90">AI Character Studio</span>
      </header>
      <section className="relative z-10 mx-auto my-auto grid w-full max-w-6xl items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">
            <Sparkles size={13} aria-hidden="true" />
            A studio for your stories
          </div>
          <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Make room for a <span className="onboarding-title-accent">new story.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Sign in to create original anime characters, chat, write, and bring new scenes to life.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setLocation("/sign-in")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,58,237,0.22)] transition-colors hover:bg-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              data-testid="button-open-sign-in"
            >
              Sign in <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setLocation("/sign-up")}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-purple-200/40 hover:bg-purple-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
              data-testid="button-open-sign-up"
            >
              Create account
            </button>
          </div>
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-[430px] items-center justify-center" aria-hidden="true">
          <div className="absolute inset-[8%] rounded-full border border-purple-300/10" />
          <div className="absolute inset-[20%] rounded-full border border-cyan-200/10" />
          <div className="absolute inset-[33%] rounded-full border border-white/10" />
          <div className="absolute h-[68%] w-[68%] rotate-[-22deg] rounded-[38%] border border-purple-300/20 bg-[linear-gradient(145deg,rgba(124,58,237,0.16),rgba(7,7,12,0.55)_55%,rgba(34,211,238,0.12))] shadow-[0_24px_80px_rgba(95,49,166,0.17)]" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-[#11101a]/90 shadow-2xl sm:h-44 sm:w-44">
            <div className="absolute inset-3 rounded-[1.5rem] border border-purple-200/10" />
            <Sparkles className="text-cyan-200" size={42} strokeWidth={1.2} />
          </div>
          <span className="absolute left-[8%] top-[24%] rounded-xl border border-purple-200/15 bg-[#13111b]/90 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-purple-100/70">Character lab</span>
          <span className="absolute bottom-[17%] right-[4%] rounded-xl border border-cyan-200/15 bg-[#111419]/90 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-cyan-100/70">Story mode</span>
        </div>
      </section>
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between border-t border-white/[0.07] pt-5 text-[10px] tracking-[0.16em] text-white/30">
        <span>AI CHARACTER STUDIO</span>
        <span>CREATE · CHAT · IMAGINE</span>
      </footer>
    </main>
  );
}
