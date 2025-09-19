import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OnlineSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("8");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; maxPlayers: number; playerName: string }) => {
      // First create the room
      const roomResponse = await apiRequest("POST", "/api/rooms", {
        name: data.name,
        hostId: "temp", // Will be updated after player creation
        maxPlayers: data.maxPlayers,
        gameTimer: 600,
        settings: { missionPack: "classic", difficulty: "mixed" },
      });
      const room = await roomResponse.json();

      // Then create the host player
      const playerResponse = await apiRequest("POST", "/api/players", {
        roomId: room.id,
        name: data.playerName,
        isHost: true,
      });
      const player = await playerResponse.json();

      return { room, player };
    },
    onSuccess: ({ room, player }) => {
      // Store the current player ID for future use
      localStorage.setItem("currentPlayerId", player.id);
      localStorage.setItem("currentPlayerName", player.name);
      
      toast({
        title: "Room Created!",
        description: `Room code: ${room.code}`,
      });
      setLocation(`/room/${room.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: { code: string; playerName: string }) => {
      // Check if room exists
      const roomResponse = await apiRequest("GET", `/api/rooms/${data.code}`);
      const roomData = await roomResponse.json();

      // Join the room
      const playerResponse = await apiRequest("POST", "/api/players", {
        roomId: roomData.id,
        name: data.playerName,
        isHost: false,
      });
      const player = await playerResponse.json();

      return { room: roomData, player };
    },
    onSuccess: ({ room, player }) => {
      // Store the current player ID for future use
      localStorage.setItem("currentPlayerId", player.id);
      localStorage.setItem("currentPlayerName", player.name);
      
      toast({
        title: "Joined Room!",
        description: `Welcome to ${room.name}`,
      });
      setLocation(`/room/${room.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join room. Check the room code.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!roomName.trim() || !playerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    createRoomMutation.mutate({
      name: roomName,
      maxPlayers: parseInt(maxPlayers),
      playerName: playerName,
    });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim() || !playerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both room code and your name",
        variant: "destructive",
      });
      return;
    }

    joinRoomMutation.mutate({
      code: joinCode.toUpperCase(),
      playerName: playerName,
    });
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
          <h2 className="text-3xl font-bold text-foreground" data-testid="title-online-setup">
            Online Mode
          </h2>
        </div>

        {/* Player Name Input */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <Label htmlFor="playerName" className="text-muted-foreground">Your Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="bg-muted border-border mt-2"
              data-testid="input-player-name"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Create Room */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Plus className="text-accent mr-3" />
                Create New Room
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="roomName" className="text-muted-foreground">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="My Secret Game"
                    className="bg-muted border-border"
                    data-testid="input-room-name"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Max Players</Label>
                  <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                    <SelectTrigger className="bg-muted border-border" data-testid="select-max-players">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="6">6 Players</SelectItem>
                      <SelectItem value="8">8 Players</SelectItem>
                      <SelectItem value="10">10 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                data-testid="button-create-room"
              >
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Users className="text-secondary mr-3" />
                Join Existing Room
              </h3>
              <div className="flex gap-3">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit room code"
                  className="flex-1 bg-muted border-border text-center text-lg font-mono tracking-widest uppercase"
                  maxLength={6}
                  data-testid="input-room-code"
                />
                <Button
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  onClick={handleJoinRoom}
                  disabled={joinRoomMutation.isPending}
                  data-testid="button-join-room"
                >
                  {joinRoomMutation.isPending ? "Joining..." : "Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
