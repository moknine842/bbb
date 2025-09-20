import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Users, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LocalSetup() {
  const [playerCount, setPlayerCount] = useState(4);
  const [gameTimer, setGameTimer] = useState("10");
  const [players, setPlayers] = useState<string[]>(Array(4).fill(""));
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const addPlayer = () => {
    if (playerCount < 10) {
      setPlayerCount(prev => prev + 1);
      setPlayers(prev => [...prev, ""]);
    }
  };

  const removePlayer = () => {
    if (playerCount > 4) {
      setPlayerCount(prev => prev - 1);
      setPlayers(prev => prev.slice(0, -1));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const isReady = players.slice(0, playerCount).every(name => name.trim().length > 0);

  const createLocalGameMutation = useMutation({
    mutationFn: async () => {
      // Create room first with a temporary hostId
      const roomResponse = await apiRequest("POST", "/api/rooms", {
        name: `Local Game - ${players[0]?.trim() || 'Players'}`,
        hostId: "temp", // Temporary, will be updated after creating first player
        maxPlayers: playerCount,
        gameTimer: parseInt(gameTimer) * 60, // Convert minutes to seconds
      });
      const room = await roomResponse.json();
      
      // Add players to room
      let hostPlayer = null;
      const playerPromises = players.slice(0, playerCount).map(async (name, index) => {
        const playerResponse = await apiRequest("POST", "/api/players", {
          name: name.trim(),
          roomId: room.id,
          isHost: index === 0, // First player is host
        });
        const player = await playerResponse.json();
        
        // Store first player as current player and as host
        if (index === 0) {
          localStorage.setItem("currentPlayerId", player.id);
          hostPlayer = player;
        }
        
        return player;
      });
      
      await Promise.all(playerPromises);
      return room;
    },
    onSuccess: (room) => {
      toast({
        title: "Local Game Created!",
        description: "Redirecting to mission input...",
      });
      setLocation(`/room/${room.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create local game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartGame = () => {
    createLocalGameMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="mr-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold text-foreground" data-testid="title-local-setup">
            Local Mode Setup
          </h2>
        </div>

        <div className="space-y-6">
          {/* Game Settings */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Game Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timer" className="text-muted-foreground">Game Timer</Label>
                  <Select value={gameTimer} onValueChange={setGameTimer}>
                    <SelectTrigger id="timer" data-testid="select-timer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Players</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={removePlayer}
                      disabled={playerCount <= 4}
                      data-testid="button-remove-player"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-foreground font-semibold w-8 text-center" data-testid="text-player-count">
                      {playerCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={addPlayer}
                      disabled={playerCount >= 10}
                      data-testid="button-add-player"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Names */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Users className="mr-2" />
                Player Names
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {players.slice(0, playerCount).map((name, index) => (
                  <div key={index}>
                    <Label htmlFor={`player-${index}`} className="text-muted-foreground text-sm">
                      Player {index + 1}
                    </Label>
                    <Input
                      id={`player-${index}`}
                      value={name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                      className="bg-muted border-border"
                      data-testid={`input-player-${index}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mission Input Instructions */}
          <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">How Local Mode Works</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Each player will secretly input a mission for others</li>
                <li>• Pass the device around to maintain secrecy</li>
                <li>• Missions are randomly assigned to players</li>
                <li>• Complete your mission without being caught!</li>
              </ul>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
            disabled={!isReady || createLocalGameMutation.isPending}
            onClick={handleStartGame}
            data-testid="button-start-local-game"
          >
            {createLocalGameMutation.isPending ? "Creating Game..." : "Start Mission Input"}
          </Button>
        </div>
      </div>
    </div>
  );
}
