import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBalance } from '../../hooks/useBalance';
import { useAuth } from '../../hooks/useAuth';
import { addGameToHistory } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';

const LimboGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState('10.00');
  const [targetMultiplier, setTargetMultiplier] = useState('2.00');
  const [result, setResult] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recentResults, setRecentResults] = useState([4.52, 1.87, 12.34, 2.91]);

  const { balance, updateBalance } = useBalance();
  const { user } = useAuth();
  const { toast } = useToast();

  const generateRandomMultiplier = () => {
    // Generate a multiplier with realistic distribution
    // Lower multipliers are more common
    const rand = Math.random();
    if (rand < 0.5) return 1 + Math.random() * 2; // 1-3x (50% chance)
    if (rand < 0.8) return 3 + Math.random() * 7; // 3-10x (30% chance)
    if (rand < 0.95) return 10 + Math.random() * 40; // 10-50x (15% chance)
    return 50 + Math.random() * 950; // 50-1000x (5% chance)
  };

  const placeBet = async () => {
    const bet = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    
    if (bet <= 0 || target <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and target multiplier",
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

    setIsPlaying(true);
    
    // Simulate game delay
    setTimeout(async () => {
      const randomMultiplier = generateRandomMultiplier();
      const won = randomMultiplier >= target;
      const winAmount = won ? bet * target : 0;
      const profit = winAmount - bet;
      
      setResult(randomMultiplier);
      setRecentResults(prev => [randomMultiplier, ...prev.slice(0, 3)]);
      
      // Update balance
      const newBalance = balance - bet + winAmount;
      await updateBalance(newBalance, bet, winAmount);
      
      // Add to game history
      if (user) {
        await addGameToHistory(user.uid, {
          gameType: 'limbo',
          betAmount: bet,
          multiplier: won ? target : 0,
          winAmount: winAmount,
          profit: profit,
          isWin: won,
          gameData: { 
            targetMultiplier: target,
            resultMultiplier: randomMultiplier
          }
        });
      }
      
      // Show result
      toast({
        title: won ? "You Won!" : "You Lost!",
        description: `Target: ${target.toFixed(2)}x, Result: ${randomMultiplier.toFixed(2)}x - ${won ? '+' : ''}$${profit.toFixed(2)}`,
        variant: won ? "default" : "destructive",
      });

      setIsPlaying(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-white" data-testid="text-result">
            {isPlaying ? '...' : result ? `${result.toFixed(2)}x` : '?'}
          </span>
        </div>
        <p className="text-muted-foreground">Set your target multiplier and test your luck!</p>
      </div>
      
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <Label htmlFor="betAmount" className="block text-sm font-medium mb-2">Bet Amount</Label>
          <Input
            id="betAmount"
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.00"
            disabled={isPlaying}
            className="text-lg py-3"
            data-testid="input-bet-amount"
          />
        </div>
        
        <div>
          <Label htmlFor="targetMultiplier" className="block text-sm font-medium mb-2">Target Multiplier</Label>
          <Input
            id="targetMultiplier"
            type="number"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(e.target.value)}
            step="0.01"
            placeholder="2.00"
            disabled={isPlaying}
            className="text-lg py-3"
            data-testid="input-target-multiplier"
          />
        </div>
        
        <Button
          onClick={placeBet}
          disabled={isPlaying}
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-4 text-lg"
          data-testid="button-place-bet"
        >
          {isPlaying ? 'Rolling...' : 'Place Bet'}
        </Button>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Recent Results</h4>
          <div className="flex flex-wrap gap-2">
            {recentResults.map((result, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm ${
                  result >= 10 ? 'bg-secondary/20 text-secondary' : 
                  result >= 3 ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                }`}
              >
                {result.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimboGame;
