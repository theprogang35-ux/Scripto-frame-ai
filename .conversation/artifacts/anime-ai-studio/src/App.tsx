import { useEffect, useRef } from "react";
import { ClerkProvider, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { LandingPage } from "@/pages/Landing";
import { StudioPage } from "@/pages/Studio";
import { ChatPage } from "@/pages/Chat";
import { SettingsPage } from "@/pages/Settings";
import { CreateEditPage } from "@/pages/CreateEdit";
import { CharacterCreatorPage } from "@/pages/CharacterCreator";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "#9333ea",
    colorForeground: "#ffffff",
    colorMutedForeground: "#888888",
    colorDanger: "#ef4444",
    colorBackground: "#0d0d0d",
    colorInput: "#111111",
    colorInputForeground: "#ffffff",
    colorNeutral: "#333333",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[#0d0d0d] border border-purple-900/40 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-purple-900/20",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-gray-300",
    footerActionLink: "text-purple-400 hover:text-purple-300",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-600",
    identityPreviewEditButton: "text-purple-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-400",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "bg-[#1a1a1a] border border-purple-900/30 hover:bg-[#222] text-white",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-500 text-white",
    formFieldInput: "bg-[#111] border-purple-900/40 text-white",
    footerAction: "bg-[#0d0d0d]",
    dividerLine: "bg-purple-900/30",
    alert: "bg-red-900/20 border border-red-900/40",
    otpCodeFieldInput: "bg-[#111] border-purple-900/40 text-white",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 animate-pulse" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return <LandingPage />;
  return <>{children}</>;
}

function HomeRedirect() {
  return <Redirect to="/studio" />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your AI Character Studio" } },
        signUp: { start: { title: "Join AI Character Studio", subtitle: "Chat with your favorite characters" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/studio">
            <ProtectedRoute><StudioPage /></ProtectedRoute>
          </Route>
          <Route path="/chat/:conversationId">
            <ProtectedRoute><ChatPage /></ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          </Route>
          <Route path="/create-edit">
            <ProtectedRoute><CreateEditPage /></ProtectedRoute>
          </Route>
          <Route path="/character-creator">
            <ProtectedRoute><CharacterCreatorPage /></ProtectedRoute>
          </Route>
          <Route><Redirect to="/" /></Route>
        </Switch>
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
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
