import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { gameService } from "./services/gameService";
import { verifyFirebaseToken } from "./services/firebaseAdmin";

const gameResultSchema = z.object({
  gameType: z.enum(['crash', 'mines', 'limbo', 'blackjack', 'hilo', 'plinko', 'wheel', 'keno', 'poker', 'chicken', 'pump', 'dragon']),
  betAmount: z.number().positive(),
  multiplier: z.number().min(0),
  winAmount: z.number().min(0),
  profit: z.number(),
  gameData: z.any().optional(),
  isWin: z.boolean(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to verify Firebase token
  const authenticateUser = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const decodedToken = await verifyFirebaseToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  // Get user profile
  app.get('/api/user/profile', authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create or update user
  app.post('/api/user', authenticateUser, async (req: any, res) => {
    try {
      const { email, displayName } = req.body;
      
      let user = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (!user) {
        user = await storage.createUser({
          firebaseUid: req.user.uid,
          email: email || req.user.email,
          displayName: displayName || req.user.name,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Create/update user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Submit game result
  app.post('/api/game/result', authenticateUser, async (req: any, res) => {
    try {
      const gameResult = gameResultSchema.parse(req.body);
      
      // Validate game result on server side
      const isValidResult = await gameService.validateGameResult(gameResult);
      if (!isValidResult) {
        return res.status(400).json({ message: 'Invalid game result' });
      }

      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has sufficient balance for bet
      if (gameResult.betAmount > parseFloat(user.balance)) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Update user balance and stats
      const newBalance = parseFloat(user.balance) - gameResult.betAmount + gameResult.winAmount;
      const newTotalWagered = parseFloat(user.totalWagered) + gameResult.betAmount;
      const newTotalWon = parseFloat(user.totalWon) + gameResult.winAmount;
      const newGamesPlayed = user.gamesPlayed + 1;

      await storage.updateUser(user.id, {
        balance: newBalance.toFixed(2),
        totalWagered: newTotalWagered.toFixed(2),
        totalWon: newTotalWon.toFixed(2),
        gamesPlayed: newGamesPlayed,
      });

      // Add game to history
      const gameHistory = await storage.addGameToHistory({
        userId: user.id,
        gameType: gameResult.gameType,
        betAmount: gameResult.betAmount.toFixed(2),
        multiplier: gameResult.multiplier.toFixed(4),
        winAmount: gameResult.winAmount.toFixed(2),
        profit: gameResult.profit.toFixed(2),
        gameData: gameResult.gameData,
        isWin: gameResult.isWin,
      });

      res.json({ 
        success: true, 
        newBalance, 
        gameHistory,
        message: gameResult.isWin ? 'Congratulations!' : 'Better luck next time!' 
      });
    } catch (error) {
      console.error('Submit game result error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid game data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  // Get game history
  app.get('/api/game/history', authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getGameHistory(user.id, limit);
      
      res.json(history);
    } catch (error) {
      console.error('Get game history error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user statistics
  app.get('/api/user/stats', authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const stats = await storage.getUserStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
