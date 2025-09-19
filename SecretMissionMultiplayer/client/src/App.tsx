import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import LocalSetup from "@/pages/local-setup";
import OnlineSetup from "@/pages/online-setup";
import RoomLobby from "@/pages/room-lobby";
import GamePlay from "@/pages/game-play";
import GameEnd from "@/pages/game-end";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/local" component={LocalSetup} />
      <Route path="/online" component={OnlineSetup} />
      <Route path="/room/:code" component={RoomLobby} />
      <Route path="/game/:code" component={GamePlay} />
      <Route path="/end/:code" component={GameEnd} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
