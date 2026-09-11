import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { StudioPage } from "@/pages/Studio";
import { ChatPage } from "@/pages/Chat";
import { SettingsPage } from "@/pages/Settings";
import { CreateEditPage } from "@/pages/CreateEdit";
import { CharacterCreatorPage } from "@/pages/CharacterCreator";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  return <Redirect to="/studio" />;
}

function AppRoutes() {
  return (
    <>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/studio" component={StudioPage} />
        <Route path="/chat/:conversationId" component={ChatPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/create-edit" component={CreateEditPage} />
        <Route path="/character-creator" component={CharacterCreatorPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#0d0d0d", border: "1px solid rgba(147,51,234,0.3)", color: "#fff" },
        }}
      />
    </>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
