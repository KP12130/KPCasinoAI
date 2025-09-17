import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  totalWagered: decimal("total_wagered", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalWon: decimal("total_won", { precision: 12, scale: 2 }).notNull().default("0.00"),
  gamesPlayed: integer("games_played").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gameHistory = pgTable("game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(), // 'crash', 'mines', 'limbo', 'blackjack', 'hilo', etc.
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  profit: decimal("profit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  gameData: jsonb("game_data"), // Store game-specific data like cards, grid state, etc.
  isWin: boolean("is_win").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;

export type GameType = 'crash' | 'mines' | 'limbo' | 'blackjack' | 'hilo' | 'plinko' | 'wheel' | 'keno' | 'poker' | 'chicken' | 'pump' | 'dragon';

export interface GameResult {
  gameType: GameType;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  profit: number;
  gameData?: any;
  isWin: boolean;
}
