import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";
import { StudioPage } from "@/pages/Studio";
import { ChatPage } from "@/pages/Chat";
import { SettingsPage } from "@/pages/Settings";
import { CreateEditPage } from "@/pages/CreateEdit";
import { CharacterCreatorPage } from "@/pages/CharacterCreator";
import { VideoGenerationPage } from "@/pages/VideoGeneration";
import { AuthLandingPage } from "@/pages/AuthLanding";
import { OnboardingGate } from "@/components/OnboardingGate";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY.");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#8b5cf6",
    colorForeground: "#f8fafc",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#fb7185",
    colorBackground: "#0f172a",
    colorInput: "#111827",
    colorInputForeground: "#f8fafc",
    colorNeutral: "#64748b",
    fontFamily: "Montserrat, sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "flex w-full justify-center",
    cardBox: "w-[440px] max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/90 shadow-2xl backdrop-blur-2xl",
    card: "!rounded-none !border-0 !bg-transparent !shadow-none",
    footer: "!rounded-none !border-0 !bg-transparent !shadow-none",
    headerTitle: "font-bold text-white",
    headerSubtitle: "text-gray-300",
    socialButtonsBlockButtonText: "font-semibold text-white",
    formFieldLabel: "font-medium text-gray-200",
    footerActionLink: "font-semibold text-cyan-200 hover:text-cyan-100",
    footerActionText: "text-gray-400",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-cyan-200",
    formFieldSuccessText: "text-emerald-300",
    alertText: "text-rose-200",
    logoBox: "rounded-xl",
    logoImage: "rounded-xl",
    socialButtonsBlockButton: "border-white/10 bg-white/[0.04] hover:border-cyan-300/30 hover:bg-white/[0.08]",
    formButtonPrimary: "font-bold shadow-lg shadow-purple-950/30",
    formFieldInput: "border-white/10 bg-[#0b0f19]/70 text-white placeholder:text-slate-500 focus:border-violet-400/60",
    footerAction: "border-white/[0.08]",
    dividerLine: "bg-white/10",
    alert: "border-rose-400/20 bg-rose-500/10",
    otpCodeFieldInput: "border-white/15 bg-black/30 text-white",
    formFieldRow: "gap-2",
    main: "text-white",
  },
};

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#08070d] text-white" role="status" data-testid="status-auth-loading">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-purple-300/20 border-t-cyan-200" aria-hidden="true" />
      <span className="sr-only">Loading your account</span>
    </main>
  );
}

function AuthPageFrame({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <main className="onboarding-shell min-h-[100dvh] px-4 py-6 text-white sm:px-8 sm:py-8" data-testid="auth-page">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-3 rounded-xl text-left" aria-label="Back to home">
          <img src={`${basePath}/logo.svg`} alt="" className="h-10 w-10" />
          <span className="text-sm font-semibold tracking-wide">AI Character Studio</span>
        </button>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 sm:block">Create · Chat · Imagine</span>
      </header>
      <section className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-5xl items-center justify-center py-10">
        {children}
      </section>
    </main>
  );
}

function SignInPage() {
  return (
    <AuthPageFrame>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </AuthPageFrame>
  );
}

function SignUpPage() {
  const [location] = useLocation();
  const normalizedLocation = basePath && location.startsWith(basePath)
    ? location.slice(basePath.length) || "/"
    : location;
  const routePath = normalizedLocation.split(/[?#]/, 1)[0] || "/";
  const isClerkSubroute = routePath !== "/sign-up";
  const [firstName, setFirstName] = useState(() => {
    try {
      return sessionStorage.getItem("scripto-signup-first-name") ?? "";
    } catch {
      return "";
    }
  });
  const [nameStepComplete, setNameStepComplete] = useState(isClerkSubroute);

  useEffect(() => {
    if (isClerkSubroute) setNameStepComplete(true);
  }, [isClerkSubroute]);

  function continueToSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = firstName.trim();
    if (!cleanName) return;
    setFirstName(cleanName);
    try {
      sessionStorage.setItem("scripto-signup-first-name", cleanName);
    } catch {
      // The Clerk sign-up form remains usable when browser storage is unavailable.
    }
    setNameStepComplete(true);
  }

  return (
    <AuthPageFrame>
      <div className="w-full max-w-[440px]">
        {!nameStepComplete ? (
          <form onSubmit={continueToSignUp} className="rounded-2xl border border-purple-300/15 bg-[#100d16] p-6 shadow-2xl sm:p-8" data-testid="form-signup-name">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Create your account</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">What should we call you?</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">We’ll use your first name for your welcome greeting.</p>
            </div>
            <label htmlFor="signup-first-name" className="mb-2 block text-sm font-medium text-white/80">First name</label>
            <input
              id="signup-first-name"
              autoComplete="given-name"
              required
              maxLength={48}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-300/60 focus:ring-1 focus:ring-purple-300/30"
              placeholder="Your first name"
              data-testid="input-signup-first-name"
            />
            <button type="submit" className="mt-5 flex w-full items-center justify-center rounded-xl bg-purple-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-400" data-testid="button-signup-continue">
              Continue to account setup
            </button>
          </form>
        ) : (
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            fallbackRedirectUrl={`${basePath}/`}
            unsafeMetadata={{ firstName: firstName.trim() }}
          />
        )}
      </div>
    </AuthPageFrame>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoadingScreen />;
  return isSignedIn ? <Redirect to="/studio" /> : <AuthLandingPage />;
}

function AuthenticatedAppRoutes() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [location] = useLocation();

  if (!isLoaded || !isUserLoaded) return <AuthLoadingScreen />;
  if (!isSignedIn || !user) return <Redirect to="/" />;

  const metadataFirstName = user.unsafeMetadata?.firstName;
  const emailName = user.primaryEmailAddress?.emailAddress.split("@")[0]?.split(/[._-]/)[0];
  const firstName =
    user.firstName?.trim() ||
    (typeof metadataFirstName === "string" ? metadataFirstName.trim() : "") ||
    user.username?.trim() ||
    emailName ||
    "there";

  return (
    <OnboardingGate key={user.id} userId={user.id} firstName={firstName}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial={{ opacity: 0, scale: 0.985, filter: "blur(5px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.992, filter: "blur(4px)" }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="min-h-[100dvh]"
        >
          <Switch>
            <Route path="/studio" component={StudioPage} />
            <Route path="/chat/:conversationId" component={ChatPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/create-edit" component={CreateEditPage} />
            <Route path="/character-creator" component={CharacterCreatorPage} />
            <Route path="/video-generation" component={VideoGenerationPage} />
            <Route><Redirect to="/studio" /></Route>
          </Switch>
        </motion.div>
      </AnimatePresence>
    </OnboardingGate>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/" component={HomeRedirect} />
      <Route component={AuthenticatedAppRoutes} />
    </Switch>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUserId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) {
        queryClient.clear();
      }
      previousUserId.current = nextUserId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to continue to your studio" } },
        signUp: { start: { title: "Create your account", subtitle: "Make a space for your next idea" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#0d0d0d", border: "1px solid rgba(147,51,234,0.3)", color: "#fff" },
          }}
        />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
