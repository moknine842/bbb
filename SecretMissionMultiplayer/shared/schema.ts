import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 6 }).notNull().unique(),
  name: text("name").notNull(),
  hostId: varchar("host_id").notNull(),
  maxPlayers: integer("max_players").notNull().default(8),
  gameTimer: integer("game_timer").notNull().default(600), // seconds
  status: text("status").notNull().default("lobby"), // lobby, playing, finished
  settings: jsonb("settings").$type<GameSettings>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  name: text("name").notNull(),
  isHost: boolean("is_host").notNull().default(false),
  isAlive: boolean("is_alive").notNull().default(true),
  strikes: integer("strikes").notNull().default(0),
  mission: text("mission"),
  missionCompleted: boolean("mission_completed").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  authorId: varchar("author_id").notNull().references(() => players.id),
  assignedToId: varchar("assigned_to_id").references(() => players.id),
  content: text("content").notNull(),
  isAssigned: boolean("is_assigned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accusations = pgTable("accusations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  accuserId: varchar("accuser_id").notNull().references(() => players.id),
  accusedId: varchar("accused_id").notNull().references(() => players.id),
  guess: text("guess").notNull(),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export interface GameSettings {
  missionPack: string;
  difficulty: string;
}

export interface GameState {
  timeRemaining: number;
  playersAlive: number;
  totalPlayers: number;
  accusations: number;
}

// Zod schemas
export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  hostId: true,
  maxPlayers: true,
  gameTimer: true,
  settings: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  roomId: true,
  name: true,
  isHost: true,
});

export const insertMissionSchema = createInsertSchema(missions).pick({
  roomId: true,
  authorId: true,
  content: true,
});

export const insertAccusationSchema = createInsertSchema(accusations).pick({
  roomId: true,
  accuserId: true,
  accusedId: true,
  guess: true,
});

// Types
export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type Accusation = typeof accusations.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type InsertAccusation = z.infer<typeof insertAccusationSchema>;
