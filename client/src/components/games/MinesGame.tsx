import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBalance } from '../../hooks/useBalance';
import { useAuth } from '../../hooks/useAuth';
import { addGameToHistory } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';

const MinesGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState('10.00');
  const [mineCount, setMineCount] = useState('3');
  const [gameStarted, setGameStarted] = useState(false);
  const [grid, setGrid] = useState<Array<'hidden' | 'safe' | 'mine'>>([]);
  const [revealedTiles, setRevealedTiles] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [gameEnded, setGameEnded] = useState(false);
  const [minePositions, setMinePositions] = useState<number[]>([]);

  const { balance, updateBalance } = useBalance();
  const { user } = useAuth();
  const { toast } = useToast();

  const calculateMultiplier = (revealed: number, mines: number) => {
    const safeTiles = 25 - mines;
    if (revealed === 0) return 1.00;
    return Math.pow(1.0 + (mines / safeTiles), revealed);
  };

  const startGame = () => {
    const bet = parseFloat(betAmount);
    const mines = parseInt(mineCount);
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    if (bet > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    // Generate mine positions
    const positions: number[] = [];
    while (positions.length < mines) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    setMinePositions(positions);
    setGrid(new Array(25).fill('hidden'));
    setGameStarted(true);
    setGameEnded(false);
    setRevealedTiles(0);
    setCurrentMultiplier(1.00);
  };

  const revealTile = (index: number) => {
    if (!gameStarted || gameEnded || grid[index] !== 'hidden') return;

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      // Hit a mine - game over
      newGrid[index] = 'mine';
      setGrid(newGrid);
      setGameEnded(true);
      handleGameEnd(false);
    } else {
      // Safe tile
      newGrid[index] = 'safe';
      const newRevealed = revealedTiles + 1;
      const newMultiplier = calculateMultiplier(newRevealed, parseInt(mineCount));
      
      setGrid(newGrid);
      setRevealedTiles(newRevealed);
      setCurrentMultiplier(newMultiplier);
    }
  };

  const cashOut = () => {
    if (!gameStarted || gameEnded || revealedTiles === 0) return;
    
    setGameEnded(true);
    handleGameEnd(true);
  };

  const handleGameEnd = async (won: boolean) => {
    const bet = parseFloat(betAmount);
    const winAmount = won ? bet * currentMultiplier : 0;
    const profit = winAmount - bet;
    
    // Update balance
    const newBalance = balance - bet + winAmount;
    await updateBalance(newBalance, bet, winAmount);
    
    // Add to game history
    if (user) {
      await addGameToHistory(user.uid, {
        gameType: 'mines',
        betAmount: bet,
        multiplier: won ? currentMultiplier : 0,
        winAmount: winAmount,
        profit: profit,
        isWin: won,
        gameData: { 
          mineCount: parseInt(mineCount),
          tilesRevealed: revealedTiles,
          minePositions: minePositions
        }
      });
    }
    
    // Show result
    toast({
      title: won ? "You Won!" : "You Lost!",
      description: `${won ? '+' : ''}$${profit.toFixed(2)}`,
      variant: won ? "default" : "destructive",
    });

    setGameStarted(false);
  };

  const renderTile = (index: number) => {
    const tileState = grid[index];
    let content = '';
    let className = 'mine-tile bg-muted hover:bg-muted/70 border border-border rounded-lg aspect-square flex items-center justify-center cursor-pointer transition-all text-lg font-bold ';

    if (tileState === 'safe') {
      content = '💎';
      className += 'bg-secondary/20 text-secondary border-secondary/50';
    } else if (tileState === 'mine') {
      content = '💣';
      className += 'bg-destructive/20 text-destructive border-destructive/50';
    } else {
      className += gameStarted && !gameEnded ? 'hover:scale-105' : '';
    }

    return (
      <div
        key={index}
        className={className}
        onClick={() => revealTile(index)}
        data-testid={`tile-${index}`}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-4">Game Settings</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="betAmount" className="block text-sm font-medium mb-2">Bet Amount</Label>
              <Input
                id="betAmount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                disabled={gameStarted}
                data-testid="input-bet-amount"
              />
            </div>
            <div>
              <Label htmlFor="mineCount" className="block text-sm font-medium mb-2">Number of Mines</Label>
              <Select value={mineCount} onValueChange={setMineCount} disabled={gameStarted}>
                <SelectTrigger data-testid="select-mine-count">
                  <SelectValue placeholder="Select mines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Mine</SelectItem>
                  <SelectItem value="3">3 Mines</SelectItem>
                  <SelectItem value="5">5 Mines</SelectItem>
                  <SelectItem value="10">10 Mines</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={startGame}
              disabled={gameStarted}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3"
              data-testid="button-start-game"
            >
              Start Game
            </Button>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Current Multiplier</h4>
          <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-secondary mb-2" data-testid="text-multiplier">
              {currentMultiplier.toFixed(2)}x
            </div>
            <p className="text-sm text-muted-foreground">
              Tiles Revealed: <span data-testid="text-tiles-revealed">{revealedTiles}</span>
            </p>
          </div>
          <Button
            onClick={cashOut}
            disabled={!gameStarted || gameEnded || revealedTiles === 0}
            className="w-full mt-4 bg-accent hover:bg-accent/80 text-accent-foreground font-semibold py-2"
            data-testid="button-cash-out"
          >
            Cash Out (${(parseFloat(betAmount) * currentMultiplier).toFixed(2)})
          </Button>
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Mine Field (5x5)</h4>
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {Array.from({ length: 25 }, (_, index) => renderTile(index))}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
