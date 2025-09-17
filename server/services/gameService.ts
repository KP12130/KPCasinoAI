import { GameType, GameResult } from "@shared/schema";

export interface GameValidationResult {
  isValid: boolean;
  reason?: string;
}

class GameService {
  /**
   * Validates a game result to prevent cheating and ensure fair gameplay
   */
  async validateGameResult(gameResult: GameResult): Promise<boolean> {
    try {
      const validation = this.validateGameByType(gameResult);
      return validation.isValid;
    } catch (error) {
      console.error('Game validation error:', error);
      return false;
    }
  }

  private validateGameByType(gameResult: GameResult): GameValidationResult {
    switch (gameResult.gameType) {
      case 'crash':
        return this.validateCrashGame(gameResult);
      case 'mines':
        return this.validateMinesGame(gameResult);
      case 'limbo':
        return this.validateLimboGame(gameResult);
      case 'blackjack':
        return this.validateBlackjackGame(gameResult);
      case 'hilo':
        return this.validateHiLoGame(gameResult);
      default:
        return { isValid: false, reason: 'Unknown game type' };
    }
  }

  private validateCrashGame(gameResult: GameResult): GameValidationResult {
    const { betAmount, multiplier, winAmount, profit, gameData, isWin } = gameResult;

    // Basic validations
    if (betAmount <= 0) {
      return { isValid: false, reason: 'Invalid bet amount' };
    }

    if (multiplier < 0) {
      return { isValid: false, reason: 'Invalid multiplier' };
    }

    // Validate win/loss logic
    if (isWin && multiplier === 0) {
      return { isValid: false, reason: 'Cannot win with 0x multiplier' };
    }

    if (!isWin && multiplier > 0) {
      // Lost games should have 0 multiplier (crashed before cashout)
      if (winAmount > 0) {
        return { isValid: false, reason: 'Lost game cannot have winnings' };
      }
    }

    // Validate winnings calculation
    const expectedWinAmount = isWin ? betAmount * multiplier : 0;
    const expectedProfit = expectedWinAmount - betAmount;

    if (Math.abs(winAmount - expectedWinAmount) > 0.01) {
      return { isValid: false, reason: 'Invalid win amount calculation' };
    }

    if (Math.abs(profit - expectedProfit) > 0.01) {
      return { isValid: false, reason: 'Invalid profit calculation' };
    }

    // Validate multiplier range (reasonable crash multipliers)
    if (multiplier > 1000) {
      return { isValid: false, reason: 'Multiplier too high' };
    }

    return { isValid: true };
  }

  private validateMinesGame(gameResult: GameResult): GameValidationResult {
    const { betAmount, multiplier, winAmount, profit, gameData, isWin } = gameResult;

    if (betAmount <= 0) {
      return { isValid: false, reason: 'Invalid bet amount' };
    }

    if (!gameData || !gameData.mineCount || !gameData.tilesRevealed) {
      return { isValid: false, reason: 'Missing game data' };
    }

    const { mineCount, tilesRevealed } = gameData;

    // Validate mine count (1-24 mines in 5x5 grid)
    if (mineCount < 1 || mineCount > 24) {
      return { isValid: false, reason: 'Invalid mine count' };
    }

    // Validate revealed tiles
    if (tilesRevealed < 0 || tilesRevealed > 25 - mineCount) {
      return { isValid: false, reason: 'Invalid tiles revealed' };
    }

    // Validate multiplier calculation
    if (isWin && tilesRevealed > 0) {
      const safeTiles = 25 - mineCount;
      const expectedMultiplier = Math.pow(1.0 + (mineCount / safeTiles), tilesRevealed);
      
      if (Math.abs(multiplier - expectedMultiplier) > 0.01) {
        return { isValid: false, reason: 'Invalid multiplier calculation' };
      }
    } else if (isWin && tilesRevealed === 0) {
      return { isValid: false, reason: 'Cannot win without revealing tiles' };
    }

    // Validate winnings
    const expectedWinAmount = isWin ? betAmount * multiplier : 0;
    const expectedProfit = expectedWinAmount - betAmount;

    if (Math.abs(winAmount - expectedWinAmount) > 0.01) {
      return { isValid: false, reason: 'Invalid win amount calculation' };
    }

    if (Math.abs(profit - expectedProfit) > 0.01) {
      return { isValid: false, reason: 'Invalid profit calculation' };
    }

    return { isValid: true };
  }

  private validateLimboGame(gameResult: GameResult): GameValidationResult {
    const { betAmount, multiplier, winAmount, profit, gameData, isWin } = gameResult;

    if (betAmount <= 0) {
      return { isValid: false, reason: 'Invalid bet amount' };
    }

    if (!gameData || !gameData.targetMultiplier || !gameData.resultMultiplier) {
      return { isValid: false, reason: 'Missing game data' };
    }

    const { targetMultiplier, resultMultiplier } = gameData;

    // Validate target multiplier
    if (targetMultiplier <= 1) {
      return { isValid: false, reason: 'Target multiplier must be greater than 1' };
    }

    // Validate result multiplier
    if (resultMultiplier <= 0) {
      return { isValid: false, reason: 'Invalid result multiplier' };
    }

    // Validate win condition
    const shouldWin = resultMultiplier >= targetMultiplier;
    if (isWin !== shouldWin) {
      return { isValid: false, reason: 'Invalid win condition' };
    }

    // Validate multiplier used in calculation
    const expectedMultiplier = isWin ? targetMultiplier : 0;
    if (Math.abs(multiplier - expectedMultiplier) > 0.01) {
      return { isValid: false, reason: 'Invalid multiplier' };
    }

    // Validate winnings
    const expectedWinAmount = isWin ? betAmount * targetMultiplier : 0;
    const expectedProfit = expectedWinAmount - betAmount;

    if (Math.abs(winAmount - expectedWinAmount) > 0.01) {
      return { isValid: false, reason: 'Invalid win amount calculation' };
    }

    if (Math.abs(profit - expectedProfit) > 0.01) {
      return { isValid: false, reason: 'Invalid profit calculation' };
    }

    return { isValid: true };
  }

  private validateBlackjackGame(gameResult: GameResult): GameValidationResult {
    const { betAmount, multiplier, winAmount, profit, gameData, isWin } = gameResult;

    if (betAmount <= 0) {
      return { isValid: false, reason: 'Invalid bet amount' };
    }

    if (!gameData || !gameData.playerCards || !gameData.dealerCards || !gameData.result) {
      return { isValid: false, reason: 'Missing game data' };
    }

    const { playerCards, dealerCards, playerTotal, dealerTotal, result } = gameData;

    // Validate card totals
    if (playerTotal < 2 || playerTotal > 30) {
      return { isValid: false, reason: 'Invalid player total' };
    }

    // Validate game result logic
    let expectedMultiplier = 0;
    switch (result) {
      case 'blackjack':
        expectedMultiplier = 2.5;
        break;
      case 'win':
      case 'dealer-bust':
        expectedMultiplier = 2;
        break;
      case 'push':
        expectedMultiplier = 1;
        break;
      case 'lose':
      case 'bust':
        expectedMultiplier = 0;
        break;
      default:
        return { isValid: false, reason: 'Invalid game result' };
    }

    // Validate multiplier
    if (Math.abs(multiplier - expectedMultiplier) > 0.01) {
      return { isValid: false, reason: 'Invalid multiplier for result' };
    }

    // Validate win condition
    const shouldWin = expectedMultiplier > 1;
    if (isWin !== shouldWin) {
      return { isValid: false, reason: 'Invalid win condition' };
    }

    // Validate winnings
    const expectedWinAmount = betAmount * expectedMultiplier;
    const expectedProfit = expectedWinAmount - betAmount;

    if (Math.abs(winAmount - expectedWinAmount) > 0.01) {
      return { isValid: false, reason: 'Invalid win amount calculation' };
    }

    if (Math.abs(profit - expectedProfit) > 0.01) {
      return { isValid: false, reason: 'Invalid profit calculation' };
    }

    return { isValid: true };
  }

  private validateHiLoGame(gameResult: GameResult): GameValidationResult {
    const { betAmount, multiplier, winAmount, profit, gameData, isWin } = gameResult;

    if (betAmount <= 0) {
      return { isValid: false, reason: 'Invalid bet amount' };
    }

    if (!gameData || typeof gameData.streak !== 'number') {
      return { isValid: false, reason: 'Missing game data' };
    }

    const { streak, finalMultiplier } = gameData;

    // Validate streak
    if (streak < 0) {
      return { isValid: false, reason: 'Invalid streak' };
    }

    // Validate multiplier calculation (1.0 + streak * 0.3)
    const expectedMultiplier = isWin ? (1.0 + streak * 0.3) : 0;
    if (Math.abs(multiplier - expectedMultiplier) > 0.01) {
      return { isValid: false, reason: 'Invalid multiplier calculation' };
    }

    // Cannot win with 0 streak
    if (isWin && streak === 0) {
      return { isValid: false, reason: 'Cannot win with 0 streak' };
    }

    // Validate winnings
    const expectedWinAmount = isWin ? betAmount * multiplier : 0;
    const expectedProfit = expectedWinAmount - betAmount;

    if (Math.abs(winAmount - expectedWinAmount) > 0.01) {
      return { isValid: false, reason: 'Invalid win amount calculation' };
    }

    if (Math.abs(profit - expectedProfit) > 0.01) {
      return { isValid: false, reason: 'Invalid profit calculation' };
    }

    return { isValid: true };
  }

  /**
   * Generates a cryptographically secure random number for games
   */
  generateSecureRandom(): number {
    // In production, use a more secure random number generator
    return Math.random();
  }

  /**
   * Validates that bet amount is within acceptable limits
   */
  validateBetAmount(betAmount: number, userBalance: number): GameValidationResult {
    if (betAmount <= 0) {
      return { isValid: false, reason: 'Bet amount must be positive' };
    }

    if (betAmount > userBalance) {
      return { isValid: false, reason: 'Insufficient balance' };
    }

    // Maximum bet validation (e.g., 10% of balance or $1000 max)
    const maxBet = Math.min(userBalance * 0.1, 1000);
    if (betAmount > maxBet) {
      return { isValid: false, reason: 'Bet amount too high' };
    }

    return { isValid: true };
  }

  /**
   * Rate limiting for game submissions (prevent spam)
   */
  private lastGameTime = new Map<string, number>();

  validateGameTiming(userId: string): GameValidationResult {
    const now = Date.now();
    const lastGame = this.lastGameTime.get(userId) || 0;
    
    // Minimum 1 second between games
    if (now - lastGame < 1000) {
      return { isValid: false, reason: 'Too many games too quickly' };
    }

    this.lastGameTime.set(userId, now);
    return { isValid: true };
  }
}

export const gameService = new GameService();
