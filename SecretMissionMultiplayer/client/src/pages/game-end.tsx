import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RotateCcw, Home } from "lucide-react";
import type { Player, Room } from "@shared/schema";

export default function GameEnd() {
  const { code } = useParams();

  const { data: roomData } = useQuery({
    queryKey: ["/api/rooms", code],
    enabled: !!code,
  });

  const room: Room & { players: Player[] } = roomData;

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading results...</div>
      </div>
    );
  }

  const winners = room.players?.filter(p => p.isAlive) || [];
  const eliminated = room.players?.filter(p => !p.isAlive) || [];
  const totalAccusations = 7; // This would come from game state in a real implementation

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-full mb-6">
            <Trophy className="text-4xl text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="title-game-over">
            Game Over!
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-game-result">
            {winners.length > 0 ? "The unmasked agents have won!" : "All players were eliminated!"}
          </p>
        </div>

        {/* Winners */}
        {winners.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center justify-center">
              <Trophy className="mr-2 text-accent" />
              Winners
            </h2>
            <div className="flex justify-center flex-wrap gap-4">
              {winners.map((player, index) => {
                const colors = [
                  "bg-accent",
                  "bg-secondary", 
                  "bg-primary",
                  "bg-yellow-500",
                  "bg-pink-500"
                ];
                
                return (
                  <Card key={player.id} className="bg-gradient-to-br from-accent/20 to-secondary/20 border-accent/30">
                    <CardContent className="p-4">
                      <div className={`w-16 h-16 ${colors[index % colors.length]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg" data-testid={`winner-avatar-${index}`}>
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="font-bold text-foreground" data-testid={`winner-name-${index}`}>
                        {player.name}
                      </div>
                      <div className="text-sm text-accent">Survived</div>
                      {player.mission && (
                        <div className="text-xs text-muted-foreground mt-2 max-w-32">
                          Mission: {player.mission}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Eliminated Players */}
        {eliminated.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">Eliminated Players</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {eliminated.map((player, index) => {
                const colors = [
                  "bg-muted",
                  "bg-muted", 
                  "bg-muted",
                  "bg-muted"
                ];
                
                return (
                  <Card key={player.id} className="bg-muted/30 border-border opacity-60">
                    <CardContent className="p-3">
                      <div className={`w-12 h-12 ${colors[index % colors.length]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                        <span className="text-muted-foreground font-bold" data-testid={`eliminated-avatar-${index}`}>
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground text-sm" data-testid={`eliminated-name-${index}`}>
                        {player.name}
                      </div>
                      <div className="text-xs text-destructive">Eliminated</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary" data-testid="stat-duration">12:34</div>
              <div className="text-muted-foreground text-sm">Game Duration</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent" data-testid="stat-accusations">
                {totalAccusations}
              </div>
              <div className="text-muted-foreground text-sm">Accusations Made</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary" data-testid="stat-eliminated">
                {eliminated.length}
              </div>
              <div className="text-muted-foreground text-sm">Players Eliminated</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500" data-testid="stat-survivors">
                {winners.length}
              </div>
              <div className="text-muted-foreground text-sm">Survivors</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Link href={`/room/${code}`}>
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" data-testid="button-play-again">
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" data-testid="button-main-menu">
              <Home className="mr-2 h-4 w-4" />
              Main Menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
