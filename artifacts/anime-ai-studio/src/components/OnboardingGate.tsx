import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, MessageCircle, Palette, Sparkles } from "lucide-react";
import { ANIME_SERIES, MARVEL_CHARACTERS, type Character } from "@/data/characters";
import { CharacterPortrait } from "@/components/CharacterPortrait";
import { readStoredCharacter, storeCharacter } from "@/lib/characterStorage";

const COMPLETED_KEY = "anime-ai-studio-onboarding-complete";
const LEGACY_COMPLETED_KEY = "scripto-frame-onboarding-complete";
const INTRO_PROMPT = "What do you want to do today? Here are all my options.";
const INTRO_BRAND = "scripto-frame-ai";
const steps = [
  {
    eyebrow: "01 / Make it yours",
    title: "Meet your next original character.",
    description: "Choose an anime character to chat with, or shape a new one in the Character Creator. Your studio starts with your imagination.",
    icon: Palette,
    accent: "#a78bfa",
  },
  {
    eyebrow: "02 / Pick a direction",
    title: "One studio, many ways to create.",
    description: "Start a conversation, write a story, explore image creation, or bring a scene to life with video tools.",
    icon: Compass,
    accent: "#67e8f9",
  },
  {
    eyebrow: "03 / Keep the story going",
    title: "Your ideas are ready when you are.",
    description: "Return to recent conversations from History, switch characters whenever inspiration strikes, and make the studio your own.",
    icon: MessageCircle,
    accent: "#f0abfc",
  },
];

type OnboardingStage = "greeting" | "welcome" | "selection" | "complete";

export function OnboardingGate({
  children,
  userId,
  firstName,
}: {
  children: React.ReactNode;
  userId: string;
  firstName: string;
}) {
  const [location, setLocation] = useLocation();
  const intendedRoute = useRef<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    try {
      return localStorage.getItem(`${COMPLETED_KEY}:${userId}`) === "true"
        || localStorage.getItem(`${LEGACY_COMPLETED_KEY}:${userId}`) === "true";
    } catch {
      return false;
    }
  });
  const [hasCharacter, setHasCharacter] = useState(() => !!readStoredCharacter(userId));
  const [stage, setStage] = useState<OnboardingStage>(() => {
    if (!hasCompletedOnboarding) return "welcome";
    return readStoredCharacter(userId) ? "greeting" : "selection";
  });
  const [splashPhase, setSplashPhase] = useState<"greeting" | "brand">("greeting");
  const [typedGreeting, setTypedGreeting] = useState("");
  const [typedPrompt, setTypedPrompt] = useState("");
  const [typedBrand, setTypedBrand] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectionTimeout = useRef<number | null>(null);
  const currentStep = steps[stepIndex];
  const CurrentIcon = currentStep?.icon ?? Sparkles;
  const greetingText = `Hey, ${firstName}`;
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (stage === "complete" || intendedRoute.current) return;
    const path = location.split(/[?#]/, 1)[0] || "/";
    const route = path === "/" ? "/studio" : path;
    const suffix = typeof window === "undefined" ? "" : `${window.location.search}${window.location.hash}`;
    intendedRoute.current = `${route}${suffix}`;
  }, [location, stage]);

  useEffect(() => {
    if (stage !== "complete") headingRef.current?.focus();
  }, [stage, stepIndex]);

  useEffect(() => () => {
    if (selectionTimeout.current !== null) window.clearTimeout(selectionTimeout.current);
  }, []);

  useEffect(() => {
    if (stage !== "greeting") return;
    let timeout: number | undefined;
    let cancelled = false;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    function typeText(
      value: string,
      setValue: (next: string) => void,
      delay: number,
      onComplete: () => void,
    ) {
      let position = 0;
      const typeNext = () => {
        if (cancelled) return;
        position += 1;
        setValue(value.slice(0, position));
        if (position < value.length) {
          timeout = window.setTimeout(typeNext, delay);
        } else {
          onComplete();
        }
      };
      timeout = window.setTimeout(typeNext, delay);
    }

    function showBrand() {
      if (cancelled) return;
      setSplashPhase("brand");
      setTypedGreeting("");
      setTypedPrompt("");
      const enterStudio = () => {
        timeout = window.setTimeout(() => {
          if (cancelled) return;
          setStage("complete");
          setLocation(intendedRoute.current || "/studio");
        }, 1500);
      };
      if (prefersReducedMotion) {
        setTypedBrand(INTRO_BRAND);
        enterStudio();
      } else {
        typeText(INTRO_BRAND, setTypedBrand, 58, enterStudio);
      }
    }

    setSplashPhase("greeting");
    setTypedGreeting("");
    setTypedPrompt("");
    setTypedBrand("");

    if (prefersReducedMotion) {
      setTypedGreeting(greetingText);
      setTypedPrompt(INTRO_PROMPT);
      timeout = window.setTimeout(showBrand, 400);
    } else {
      typeText(greetingText, setTypedGreeting, 54, () => {
        timeout = window.setTimeout(() => {
          typeText(INTRO_PROMPT, setTypedPrompt, 32, () => {
            timeout = window.setTimeout(showBrand, 350);
          });
        }, 280);
      });
    }

    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [greetingText, setLocation, stage]);

  function finish() {
    try {
      localStorage.setItem(`${COMPLETED_KEY}:${userId}`, "true");
    } catch {
      // The flow still completes for this visit if browser storage is unavailable.
    }
    setHasCompletedOnboarding(true);
    setStage("selection");
  }

  function selectCharacter(character: Character) {
    setSelectedCharacterId(character.id);
    storeCharacter(userId, character);
    setHasCharacter(true);
    if (selectionTimeout.current !== null) window.clearTimeout(selectionTimeout.current);
    selectionTimeout.current = window.setTimeout(() => {
      selectionTimeout.current = null;
      setStage("complete");
      setLocation(intendedRoute.current || "/studio");
    }, 240);
  }

  if (stage === "complete") return <>{children}</>;

  if (stage === "greeting" && hasCharacter) {
    const greetingPrefix = "Hey, ";
    const visiblePrefix = typedGreeting.slice(0, Math.min(typedGreeting.length, greetingPrefix.length));
    const visibleName = typedGreeting.slice(greetingPrefix.length);
    return (
      <main className="onboarding-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 text-white" data-testid="greeting-splash">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[min(68vw,32rem)] w-[min(68vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute inset-0 onboarding-grid opacity-40" />
        </div>
        {splashPhase === "greeting" ? (
          <div className="onboarding-enter relative z-10 max-w-4xl text-center">
            <h1
              ref={headingRef}
              tabIndex={-1}
              aria-label={greetingText}
              className="text-5xl font-semibold tracking-[-0.05em] outline-none sm:text-7xl"
              data-testid="heading-greeting"
            >
              {visiblePrefix}<span className="onboarding-title-accent">{visibleName}</span>
              {typedGreeting.length < greetingText.length && <span className="typing-caret bg-cyan-100" aria-hidden="true" />}
            </h1>
            <p
              aria-label={INTRO_PROMPT}
              className="mt-6 min-h-7 text-base text-white/65 sm:text-lg"
              data-testid="text-greeting-prompt"
            >
              {typedPrompt}
              {typedPrompt.length > 0 && typedPrompt.length < INTRO_PROMPT.length && <span className="typing-caret bg-purple-200" aria-hidden="true" />}
            </p>
          </div>
        ) : (
          <h1
            ref={headingRef}
            tabIndex={-1}
            aria-label={INTRO_BRAND}
            className="onboarding-enter relative z-10 text-center text-4xl font-semibold tracking-[-0.045em] outline-none sm:text-6xl"
            data-testid="heading-brand-intro"
          >
            <span className="onboarding-title-accent">{typedBrand}</span>
            {typedBrand.length < INTRO_BRAND.length && <span className="typing-caret bg-cyan-100" aria-hidden="true" />}
          </h1>
        )}
      </main>
    );
  }

  return (
      <main className="onboarding-shell min-h-[100dvh] overflow-x-hidden overflow-y-auto px-5 py-8 text-white sm:px-8 sm:py-10" data-testid="onboarding-screen">
      <div className="onboarding-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-300/20 bg-purple-500/15 text-sm font-black tracking-tight text-white">AI</div>
            <span className="text-sm font-semibold tracking-wide text-white/90">AI Character Studio</span>
          </div>
          <span className="hidden text-xs tracking-[0.2em] text-white/35 sm:block">YOUR CREATIVE UNIVERSE</span>
        </header>

        {stage === "welcome" || stage === "selection" ? (
          stage === "welcome" ? (
          <section className="onboarding-enter my-auto grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">
                <Sparkles size={13} aria-hidden="true" />
                A studio for your stories
              </div>
              <h1 ref={headingRef} tabIndex={-1} className="max-w-2xl text-5xl font-semibold leading-[1.03] tracking-[-0.055em] outline-none sm:text-6xl lg:text-7xl" data-testid="heading-welcome">
                Every great story starts with <span className="onboarding-title-accent">you.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
                Create original anime characters, find a voice for your ideas, and turn a spark into a whole new world.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => { setStepIndex(0); setTourOpen(true); }}
                  data-testid="button-start-tutorial"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,58,237,0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070d]"
                >
                  Step inside <ArrowRight size={16} aria-hidden="true" />
                </button>
                <span className="text-xs text-white/35">A quick, three-step tour</span>
              </div>
            </div>

            <div className="onboarding-orbit relative mx-auto flex aspect-square w-full max-w-[430px] items-center justify-center" aria-hidden="true">
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
              <span className="absolute right-[10%] top-[14%] h-2 w-2 rounded-full bg-cyan-200/80 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
              <span className="absolute bottom-[20%] left-[14%] h-1.5 w-1.5 rounded-full bg-purple-200/80" />
            </div>
          </section>
          ) : (
            <CharacterSelection
              selectedId={selectedCharacterId}
              onSelect={selectCharacter}
            />
          )
        ) : (
          <section className="onboarding-enter my-auto grid items-center gap-9 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200/70">
                <BookOpen size={14} aria-hidden="true" /> Quick-start guide
              </div>
              <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-semibold leading-tight tracking-[-0.045em] outline-none sm:text-5xl" data-testid="heading-tutorial">
                Your studio, <span className="text-purple-200">in three steps.</span>
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/55">A quick tour of the places where characters and ideas come to life.</p>
              <div className="mt-8 flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`} role="status" data-testid="status-tutorial-progress">
                {steps.map((step, index) => (
                  <span key={step.eyebrow} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-10 bg-purple-300" : index < stepIndex ? "w-5 bg-purple-300/50" : "w-5 bg-white/15"}`} />
                ))}
                <span className="ml-2 text-xs text-white/40">Step {stepIndex + 1} of {steps.length}</span>
              </div>
            </div>

            <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101017]/90 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-10" aria-live="polite" aria-atomic="true" data-testid={`tutorial-step-${stepIndex + 1}`}>
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: currentStep.accent }} aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: currentStep.accent }}>{currentStep.eyebrow}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]" style={{ color: currentStep.accent }}>
                    <CurrentIcon size={21} aria-hidden="true" />
                  </div>
                </div>
                <h2 className="mt-9 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl" data-testid="text-tutorial-title">{currentStep.title}</h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/55 sm:text-base">{currentStep.description}</p>
                <div className="mt-9 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
                  <button
                    type="button"
                    onClick={() => stepIndex === 0 ? setStage("welcome") : setStepIndex((step) => Math.max(0, step - 1))}
                    data-testid="button-tutorial-back"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
                  >
                    <ArrowLeft size={16} aria-hidden="true" /> Back
                  </button>
                  {stepIndex < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((step) => Math.min(steps.length - 1, step + 1))}
                      data-testid="button-tutorial-next"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      Next <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finish}
                      data-testid="button-complete-onboarding"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      Enter the studio <Check size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          </section>
        )}
        <footer className="flex items-center justify-between border-t border-white/[0.07] pt-5 text-[10px] tracking-[0.16em] text-white/30">
          <span>AI CHARACTER STUDIO</span>
          <span>CREATE · CHAT · IMAGINE</span>
        </footer>
      </div>
      {stage === "welcome" && (
        tourOpen &&
        <TourModal
          stepIndex={stepIndex}
          onBack={() => stepIndex === 0 ? setTourOpen(false) : setStepIndex((step) => Math.max(0, step - 1))}
          onNext={() => setStepIndex((step) => Math.min(steps.length - 1, step + 1))}
          onClose={() => setTourOpen(false)}
          onFinish={() => { setTourOpen(false); finish(); }}
        />
      )}
    </main>
  );
}

function CharacterSelection({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (character: Character) => void;
}) {
  const characters = [...ANIME_SERIES.flatMap((series) => series.characters), ...MARVEL_CHARACTERS];
  return (
    <section className="onboarding-enter my-auto w-full py-10" data-testid="character-selection">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Choose your companion</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" data-testid="heading-character-selection">
          Please select your Character
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Choose the voice that will meet you in your studio. You can switch characters any time.</p>
        <div className="mt-8 grid max-h-[58dvh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((character) => (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelect(character)}
              aria-pressed={selectedId === character.id}
              data-testid={`button-onboarding-character-${character.id}`}
              className={`group flex min-h-[90px] items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                selectedId === character.id
                  ? "border-cyan-200/80 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,.18)]"
                  : "border-white/10 bg-slate-950/35 hover:border-violet-300/50 hover:bg-white/[0.06]"
              }`}
            >
              <CharacterPortrait id={character.id} name={character.name} className="h-12 w-12 rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{character.name}</span>
                <span className="mt-1 block truncate text-xs text-white/45">{character.series}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TourModal({
  stepIndex,
  onBack,
  onNext,
  onClose,
  onFinish,
}: {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  onFinish: () => void;
}) {
  const currentStep = steps[stepIndex];
  const Icon = currentStep.icon;
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
  }, [stepIndex]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05040a]/75 px-4 py-6 backdrop-blur-md" data-testid="tutorial-modal">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <article ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="tutorial-dialog-title" className="onboarding-enter relative z-10 w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-violet-200/15 bg-[#10101b]/95 p-6 shadow-[0_32px_100px_rgba(0,0,0,.55)] outline-none sm:p-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: currentStep.accent }} aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: currentStep.accent }}>{currentStep.eyebrow}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]" style={{ color: currentStep.accent }}><Icon size={20} aria-hidden="true" /></span>
          </div>
          <div className="mt-5 flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`} role="status" data-testid="status-tutorial-progress">
            {steps.map((step, index) => <span key={step.eyebrow} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-10 bg-violet-300" : index < stepIndex ? "w-5 bg-violet-300/50" : "w-5 bg-white/15"}`} />)}
            <span className="ml-2 text-xs text-white/40">Step {stepIndex + 1} of {steps.length}</span>
          </div>
          <h2 id="tutorial-dialog-title" className="mt-7 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">{currentStep.title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/55 sm:text-base">{currentStep.description}</p>
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
            <button type="button" onClick={onBack} data-testid="button-tutorial-back" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"><ArrowLeft size={16} aria-hidden="true" /> Back</button>
            {stepIndex < steps.length - 1 ? (
              <button type="button" onClick={onNext} data-testid="button-tutorial-next" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Next <ArrowRight size={16} aria-hidden="true" /></button>
            ) : (
              <button type="button" onClick={onFinish} data-testid="button-complete-onboarding" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Enter the studio <Check size={16} aria-hidden="true" /></button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
