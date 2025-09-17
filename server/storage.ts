import { type User, type InsertUser, type GameHistory, type InsertGameHistory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  addGameToHistory(game: InsertGameHistory): Promise<GameHistory>;
  getGameHistory(userId: string, limit?: number): Promise<GameHistory[]>;
  getUserStats(userId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private gameHistory: Map<string, GameHistory>;

  constructor() {
    this.users = new Map();
    this.gameHistory = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      balance: "1000.00",
      totalWagered: "0.00",
      totalWon: "0.00",
      gamesPlayed: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addGameToHistory(insertGame: InsertGameHistory): Promise<GameHistory> {
    const id = randomUUID();
    const game: GameHistory = {
      ...insertGame,
      id,
      createdAt: new Date(),
    };
    
    this.gameHistory.set(id, game);
    return game;
  }

  async getGameHistory(userId: string, limit: number = 10): Promise<GameHistory[]> {
    const userGames = Array.from(this.gameHistory.values())
      .filter(game => game.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return userGames;
  }

  async getUserStats(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;

    const userGames = Array.from(this.gameHistory.values())
      .filter(game => game.userId === userId);

    const gamesByType = userGames.reduce((acc, game) => {
      acc[game.gameType] = (acc[game.gameType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const profitByDay = userGames.reduce((acc, game) => {
      const day = game.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + parseFloat(game.profit);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGames: userGames.length,
      gamesByType,
      profitByDay,
      winRate: userGames.length > 0 ? 
        (userGames.filter(g => g.isWin).length / userGames.length) * 100 : 0,
    };
  }
}

export const storage = new MemStorage();
