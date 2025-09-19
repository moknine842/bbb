import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertPlayerSchema, insertMissionSchema, insertAccusationSchema } from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Room management
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  app.get("/api/rooms/:code", async (req, res) => {
    try {
      const room = await storage.getRoomByCode(req.params.code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      const players = await storage.getPlayersByRoom(room.id);
      console.log("GET /api/rooms/:code - players:", players.map(p => ({ id: p.id, name: p.name, mission: p.mission })));
      res.json({ ...room, players });
    } catch (error) {
      res.status(500).json({ message: "Error fetching room" });
    }
  });

  // Player management
  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      
      // Notify other players in the room
      broadcastToRoom(player.roomId, {
        type: "player_joined",
        player,
      });
      
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
    }
  });

  app.get("/api/rooms/:roomId/players", async (req, res) => {
    try {
      const players = await storage.getPlayersByRoom(req.params.roomId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Error fetching players" });
    }
  });

  // Mission management
  app.post("/api/missions", async (req, res) => {
    try {
      console.log("Mission submission request:", req.body);
      const missionData = insertMissionSchema.parse(req.body);
      console.log("Parsed mission data:", missionData);
      
      const mission = await storage.createMission(missionData);
      console.log("Created mission:", mission);
      
      // Update the player to indicate they've submitted a mission
      await storage.updatePlayerMission(mission.authorId, mission.content, false);
      console.log("Updated player mission for authorId:", mission.authorId);
      
      // Verify the player was updated
      const updatedPlayer = await storage.getPlayer(mission.authorId);
      console.log("Player after mission update:", updatedPlayer);
      
      // Notify room that a mission was submitted
      broadcastToRoom(mission.roomId, {
        type: "mission_submitted",
        authorId: mission.authorId,
      });
      
      res.json(mission);
    } catch (error) {
      console.error("Mission submission error:", error);
      res.status(400).json({ message: "Invalid mission data" });
    }
  });

  app.post("/api/games/:roomId/start", async (req, res) => {
    try {
      // Get all missions and players
      const missions = await storage.getUnassignedMissions(req.params.roomId);
      const players = await storage.getPlayersByRoom(req.params.roomId);

      // Check that all players have submitted missions
      const playersWithMissions = players.filter(p => p.mission !== null);
      if (playersWithMissions.length < players.length) {
        return res.status(400).json({ message: "Not all players have submitted missions" });
      }

      // Randomly assign missions to players
      const shuffledMissions = [...missions].sort(() => Math.random() - 0.5);
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

      for (let i = 0; i < players.length; i++) {
        const mission = shuffledMissions[i];
        const player = shuffledPlayers[i];
        
        // Ensure player doesn't get their own mission
        if (mission.authorId === player.id && shuffledMissions[i + 1]) {
          [shuffledMissions[i], shuffledMissions[i + 1]] = [shuffledMissions[i + 1], shuffledMissions[i]];
        }

        await storage.assignMission(shuffledMissions[i].id, player.id);
        await storage.updatePlayerMission(player.id, shuffledMissions[i].content);
      }

      // Update room status
      await storage.updateRoomStatus(req.params.roomId, "playing");

      // Start game timer and notify all players
      broadcastToRoom(req.params.roomId, {
        type: "game_started",
        gameState: await storage.getGameState(req.params.roomId),
      });

      startGameTimer(req.params.roomId);

      res.json({ message: "Game started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error starting game" });
    }
  });

  // Accusations
  app.post("/api/accusations", async (req, res) => {
    try {
      const accusationData = insertAccusationSchema.parse(req.body);
      const accusation = await storage.createAccusation(accusationData);
      
      // Get the accused player's actual mission
      const accusedPlayer = await storage.getPlayer(accusation.accusedId);
      const isCorrect = accusedPlayer?.mission?.toLowerCase().includes(accusation.guess.toLowerCase()) || false;
      
      await storage.updateAccusationResult(accusation.id, isCorrect);

      if (isCorrect) {
        // Eliminate the accused player
        await storage.updatePlayerStatus(accusation.accusedId, false);
        
        broadcastToRoom(accusation.roomId, {
          type: "player_eliminated",
          playerId: accusation.accusedId,
          accuserId: accusation.accuserId,
          correctMission: accusedPlayer?.mission,
        });
      } else {
        // Add strike to accuser
        const accuser = await storage.getPlayer(accusation.accuserId);
        if (accuser) {
          const newStrikes = accuser.strikes + 1;
          await storage.updatePlayerStrikes(accusation.accuserId, newStrikes);
          
          if (newStrikes >= 3) {
            broadcastToRoom(accusation.roomId, {
              type: "player_eliminated",
              playerId: accusation.accuserId,
              reason: "too_many_strikes",
            });
          }
        }
      }

      // Check win condition
      const gameState = await storage.getGameState(accusation.roomId);
      if (gameState.playersAlive <= 1) {
        await storage.updateRoomStatus(accusation.roomId, "finished");
        broadcastToRoom(accusation.roomId, {
          type: "game_ended",
          winners: await getWinners(accusation.roomId),
        });
      }

      res.json({ isCorrect, gameState });
    } catch (error) {
      res.status(400).json({ message: "Invalid accusation data" });
    }
  });

  // Game state
  app.get("/api/games/:roomId/state", async (req, res) => {
    try {
      const gameState = await storage.getGameState(req.params.roomId);
      res.json(gameState);
    } catch (error) {
      res.status(500).json({ message: "Error fetching game state" });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_room':
            ws.playerId = data.playerId;
            ws.roomId = data.roomId;
            
            // Send current game state
            const gameState = await storage.getGameState(data.roomId);
            const players = await storage.getPlayersByRoom(data.roomId);
            
            ws.send(JSON.stringify({
              type: 'room_state',
              gameState,
              players,
            }));
            break;

          case 'leave_room':
            ws.playerId = undefined;
            ws.roomId = undefined;
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  function broadcastToRoom(roomId: string, message: any) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  function startGameTimer(roomId: string) {
    let timeRemaining = 600; // 10 minutes
    
    const timer = setInterval(async () => {
      timeRemaining--;
      
      if (timeRemaining <= 0) {
        clearInterval(timer);
        await storage.updateRoomStatus(roomId, "finished");
        
        broadcastToRoom(roomId, {
          type: "game_ended",
          reason: "time_up",
          winners: await getWinners(roomId),
        });
        return;
      }

      // Broadcast time update every 30 seconds
      if (timeRemaining % 30 === 0) {
        broadcastToRoom(roomId, {
          type: "time_update",
          timeRemaining,
        });
      }
    }, 1000);
  }

  async function getWinners(roomId: string) {
    const players = await storage.getPlayersByRoom(roomId);
    return players.filter(p => p.isAlive);
  }

  return httpServer;
}
