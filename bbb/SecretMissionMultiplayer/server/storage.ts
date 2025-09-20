import { type Room, type Player, type Mission, type Accusation, type InsertRoom, type InsertPlayer, type InsertMission, type InsertAccusation, type GameState } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoom(id: string): Promise<Room | undefined>;
  updateRoomStatus(id: string, status: string): Promise<void>;
  
  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByRoom(roomId: string): Promise<Player[]>;
  updatePlayerStrikes(id: string, strikes: number): Promise<void>;
  updatePlayerStatus(id: string, isAlive: boolean): Promise<void>;
  updatePlayerMission(id: string, mission: string, completed?: boolean): Promise<void>;
  
  // Mission operations
  createMission(mission: InsertMission): Promise<Mission>;
  getMissionsByRoom(roomId: string): Promise<Mission[]>;
  getUnassignedMissions(roomId: string): Promise<Mission[]>;
  assignMission(missionId: string, playerId: string): Promise<void>;
  
  // Accusation operations
  createAccusation(accusation: InsertAccusation): Promise<Accusation>;
  getAccusationsByRoom(roomId: string): Promise<Accusation[]>;
  updateAccusationResult(id: string, isCorrect: boolean): Promise<void>;
  
  // Game state
  getGameState(roomId: string): Promise<GameState>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private players: Map<string, Player>;
  private missions: Map<string, Mission>;
  private accusations: Map<string, Accusation>;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
    this.missions = new Map();
    this.accusations = new Map();
  }

  // Room operations
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const code = this.generateRoomCode();
    const room: Room = {
      ...insertRoom,
      id,
      code,
      maxPlayers: insertRoom.maxPlayers || 8,
      gameTimer: insertRoom.gameTimer || 600,
      settings: insertRoom.settings || null,
      status: "lobby",
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoomStatus(id: string, status: string): Promise<void> {
    const room = this.rooms.get(id);
    if (room) {
      room.status = status;
      this.rooms.set(id, room);
    }
  }

  // Player operations
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      ...insertPlayer,
      id,
      isHost: insertPlayer.isHost || false,
      isAlive: true,
      strikes: 0,
      mission: null,
      missionCompleted: false,
      joinedAt: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayersByRoom(roomId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.roomId === roomId);
  }

  async updatePlayerStrikes(id: string, strikes: number): Promise<void> {
    const player = this.players.get(id);
    if (player) {
      player.strikes = strikes;
      if (strikes >= 3) {
        player.isAlive = false;
      }
      this.players.set(id, player);
    }
  }

  async updatePlayerStatus(id: string, isAlive: boolean): Promise<void> {
    const player = this.players.get(id);
    if (player) {
      player.isAlive = isAlive;
      this.players.set(id, player);
    }
  }

  async updatePlayerMission(id: string, mission: string, completed = false): Promise<void> {
    const player = this.players.get(id);
    if (player) {
      player.mission = mission;
      player.missionCompleted = completed;
      this.players.set(id, player);
    }
  }

  // Mission operations
  async createMission(insertMission: InsertMission): Promise<Mission> {
    const id = randomUUID();
    const mission: Mission = {
      ...insertMission,
      id,
      assignedToId: null,
      isAssigned: false,
      createdAt: new Date(),
    };
    this.missions.set(id, mission);
    return mission;
  }

  async getMissionsByRoom(roomId: string): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(mission => mission.roomId === roomId);
  }

  async getUnassignedMissions(roomId: string): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(
      mission => mission.roomId === roomId && !mission.isAssigned
    );
  }

  async assignMission(missionId: string, playerId: string): Promise<void> {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.assignedToId = playerId;
      mission.isAssigned = true;
      this.missions.set(missionId, mission);
    }
  }

  // Accusation operations
  async createAccusation(insertAccusation: InsertAccusation): Promise<Accusation> {
    const id = randomUUID();
    const accusation: Accusation = {
      ...insertAccusation,
      id,
      isCorrect: null,
      createdAt: new Date(),
    };
    this.accusations.set(id, accusation);
    return accusation;
  }

  async getAccusationsByRoom(roomId: string): Promise<Accusation[]> {
    return Array.from(this.accusations.values()).filter(accusation => accusation.roomId === roomId);
  }

  async updateAccusationResult(id: string, isCorrect: boolean): Promise<void> {
    const accusation = this.accusations.get(id);
    if (accusation) {
      accusation.isCorrect = isCorrect;
      this.accusations.set(id, accusation);
    }
  }

  // Game state
  async getGameState(roomId: string): Promise<GameState> {
    const players = await this.getPlayersByRoom(roomId);
    const accusations = await this.getAccusationsByRoom(roomId);
    const room = await this.getRoom(roomId);

    return {
      timeRemaining: room?.gameTimer || 600,
      playersAlive: players.filter(p => p.isAlive).length,
      totalPlayers: players.length,
      accusations: accusations.length,
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const storage = new MemStorage();
