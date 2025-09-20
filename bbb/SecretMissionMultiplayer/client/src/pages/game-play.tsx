import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import Timer from "@/components/ui/timer";
import PlayerCard from "@/components/ui/player-card";
import AccusationModal from "@/components/ui/accusation-modal";
import type { Player, Room, GameState } from "@shared/schema";

export default function GamePlay() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showAccusationModal, setShowAccusationModal] = useState(false);

  const { data: roomData } = useQuery({
    queryKey: ["/api/rooms", code],
    enabled: !!code,
  });

  const room: Room & { players: Player[] } = roomData;
  const { socket, isConnected } = useWebSocket("/ws");

  useEffect(() => {
    if (socket && room) {
      const currentPlayerId = localStorage.getItem("currentPlayerId");
      if (currentPlayerId) {
        socket.send(JSON.stringify({
          type: "join_room",
          roomId: room.id,
          playerId: currentPlayerId,
        }));
      }
    }
  }, [socket, room]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "room_state":
            setGameState(message.gameState);
            break;
          case "time_update":
            setGameState(prev => prev ? { ...prev, timeRemaining: message.timeRemaining } : null);
            break;
          case "player_eliminated":
            queryClient.invalidateQueries({ queryKey: ["/api/rooms", code] });
            toast({
              title: "Player Eliminated!",
              description: message.reason === "too_many_strikes" 
                ? `${message.playerId} was eliminated for too many wrong guesses`
                : `${message.playerId} was caught! Mission: ${message.correctMission}`,
            });
            break;
          case "game_ended":
            setLocation(`/end/${code}`);
            break;
        }
      };
    }
  }, [socket, queryClient, code, setLocation, toast]);

  const currentPlayerId = localStorage.getItem("currentPlayerId");
  const currentPlayer = room?.players?.find(p => p.id === currentPlayerId);
  const otherPlayers = room?.players?.filter(p => p.id !== currentPlayerId && p.isAlive) || [];
  const eliminatedPlayers = room?.players?.filter(p => !p.isAlive) || [];

  const handleAccusePlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowAccusationModal(true);
  };

  if (!room || !gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading game...</div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Timer */}
          <Timer 
            timeRemaining={gameState.timeRemaining} 
            totalTime={600}
            data-testid="game-timer"
          />

          {/* Room Code */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Room</div>
            <div className="font-mono text-lg tracking-wider text-foreground" data-testid="text-room-code">
              {room.code}
            </div>
          </div>

          {/* Players Remaining */}
          <div className="flex items-center bg-card border border-border rounded-xl px-4 py-3">
            <div className="text-right mr-3">
              <div className="text-lg font-bold text-accent" data-testid="text-players-alive">
                {gameState.playersAlive}/{gameState.totalPlayers}
              </div>
              <div className="text-xs text-muted-foreground">Alive</div>
            </div>
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <span className="text-accent-foreground">👥</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="bg-destructive/20 border-destructive/30 mb-6">
            <CardContent className="p-4">
              <p className="text-destructive">Disconnected from server. Trying to reconnect...</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Your Mission Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 mb-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center">
                  <span className="mr-2">🎯</span>
                  Your Mission
                </h3>
                <div className="bg-card/50 backdrop-blur rounded-lg p-4 mb-4">
                  <p className="text-foreground" data-testid="text-player-mission">
                    {currentPlayer?.mission || "Loading mission..."}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                    {currentPlayer?.missionCompleted ? "Completed" : "In Progress"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Your Status */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-3">Your Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wrong Guesses:</span>
                    <div className="flex space-x-1" data-testid="strikes-indicator">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < (currentPlayer?.strikes || 0) ? "bg-destructive" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Correct Guesses:</span>
                    <span className="text-accent font-bold" data-testid="text-correct-guesses">
                      0
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players Panel */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-foreground mb-4">Other Players</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {otherPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onAccuse={() => handleAccusePlayer(player)}
                  data-testid={`player-card-${player.id}`}
                />
              ))}
            </div>

            {/* Eliminated Players */}
            {eliminatedPlayers.length > 0 && (
              <>
                <h4 className="text-lg font-semibold text-muted-foreground mb-3">Eliminated</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {eliminatedPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      eliminated
                      data-testid={`eliminated-player-${player.id}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Accusation Modal */}
        <AccusationModal
          isOpen={showAccusationModal}
          onClose={() => setShowAccusationModal(false)}
          player={selectedPlayer}
          roomId={room.id}
        />
      </div>
    </div>
  );
}
