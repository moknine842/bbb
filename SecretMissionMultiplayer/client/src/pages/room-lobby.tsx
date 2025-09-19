import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Key, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Player, Room } from "@shared/schema";

export default function RoomLobby() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mission, setMission] = useState("");
  const [missionSubmitted, setMissionSubmitted] = useState(false);
  const [gameTimer, setGameTimer] = useState("10");
  const [missionPack, setMissionPack] = useState("classic");
  const [difficulty, setDifficulty] = useState("mixed");

  const { data: roomData, isLoading } = useQuery({
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
          case "player_joined":
            queryClient.invalidateQueries({ queryKey: ["/api/rooms", code] });
            toast({
              title: "Player Joined",
              description: `${message.player.name} joined the room`,
            });
            break;
          case "mission_submitted":
            // Update UI to show mission was submitted
            break;
          case "game_started":
            setLocation(`/game/${code}`);
            break;
        }
      };
    }
  }, [socket, queryClient, code, setLocation, toast]);

  const submitMissionMutation = useMutation({
    mutationFn: async (missionContent: string) => {
      const currentPlayerId = localStorage.getItem("currentPlayerId");
      if (!currentPlayerId) {
        throw new Error("No player ID found - please rejoin the room");
      }
      
      const response = await apiRequest("POST", "/api/missions", {
        roomId: room.id,
        authorId: currentPlayerId,
        content: missionContent,
      });
      return response.json();
    },
    onSuccess: () => {
      setMissionSubmitted(true);
      setMission("");
      toast({
        title: "Mission Submitted!",
        description: "Your secret mission has been added to the game",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit mission",
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/games/${room.id}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Starting!",
        description: "Missions are being assigned...",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start game. Make sure all players have submitted missions.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitMission = () => {
    if (!mission.trim()) {
      toast({
        title: "Empty Mission",
        description: "Please write a mission before submitting",
        variant: "destructive",
      });
      return;
    }
    
    submitMissionMutation.mutate(mission);
  };

  const handleStartGame = () => {
    if (!room?.players?.length || room.players.length < 4) {
      toast({
        title: "Not Enough Players",
        description: "Need at least 4 players to start",
        variant: "destructive",
      });
      return;
    }
    
    startGameMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading room...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Room Not Found</h2>
            <p className="text-muted-foreground mb-4">The room code "{code}" does not exist.</p>
            <Link href="/online">
              <Button>Back to Online Setup</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlayerId = localStorage.getItem("currentPlayerId");
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/online">
              <Button
                variant="outline"
                size="icon"
                className="mr-4"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-foreground" data-testid="text-room-name">
                {room.name}
              </h2>
              <div className="flex items-center text-muted-foreground">
                <Key className="mr-2 h-4 w-4" />
                <span className="font-mono text-lg tracking-wider" data-testid="text-room-code">
                  {room.code}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Players</div>
            <div className="text-2xl font-bold text-accent" data-testid="text-player-count">
              {room.players?.length || 0}/{room.maxPlayers}
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

        {/* Player List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Players in Room</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {room.players?.map((player, index) => {
              const colors = [
                "bg-primary",
                "bg-secondary", 
                "bg-accent",
                "bg-yellow-500",
                "bg-pink-500",
                "bg-green-500",
                "bg-orange-500",
                "bg-purple-500"
              ];
              
              return (
                <Card key={player.id} className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${colors[index % colors.length]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                      <span className="text-white font-bold" data-testid={`player-avatar-${index}`}>
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="font-semibold text-foreground text-sm" data-testid={`player-name-${index}`}>
                      {player.name}
                    </div>
                    <div className="text-xs text-accent">
                      {player.isHost ? "Host" : "Player"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Game Settings - Only visible to host */}
        {isHost && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Game Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Game Timer</Label>
                  <Select value={gameTimer} onValueChange={setGameTimer}>
                    <SelectTrigger className="bg-muted border-border">
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
                  <Label className="text-muted-foreground">Mission Pack</Label>
                  <Select value={missionPack} onValueChange={setMissionPack}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="party">Party Fun</SelectItem>
                      <SelectItem value="mystery">Mystery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mission Input */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Submit Your Secret Mission</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Write a mission for another player. Be creative but fair!
            </p>
            {!missionSubmitted ? (
              <>
                <Textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Example: Make someone laugh without them knowing it was intentional..."
                  rows={3}
                  className="bg-muted border-border mb-3"
                  data-testid="textarea-mission"
                />
                <Button
                  onClick={handleSubmitMission}
                  disabled={submitMissionMutation.isPending}
                  className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  data-testid="button-submit-mission"
                >
                  {submitMissionMutation.isPending ? "Submitting..." : "Submit Mission"}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-accent text-lg font-semibold mb-2">✓ Mission Submitted!</div>
                <p className="text-muted-foreground">Waiting for other players...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Game Button - Only visible to host */}
        {isHost && (
          <Button
            size="lg"
            onClick={handleStartGame}
            disabled={startGameMutation.isPending}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
            data-testid="button-start-game"
          >
            <Play className="mr-2 h-5 w-5" />
            {startGameMutation.isPending ? "Starting Game..." : "Start Game"}
          </Button>
        )}
      </div>
    </div>
  );
}
