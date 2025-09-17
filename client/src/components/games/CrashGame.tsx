import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBalance } from '../../hooks/useBalance';
import { useAuth } from '../../hooks/useAuth';
import { addGameToHistory } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';

const CrashGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState('10.00');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [recentCrashes, setRecentCrashes] = useState([2.45, 1.23, 5.67, 3.21, 1.05]);

  const { balance, updateBalance } = useBalance();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameActive && !crashed && !cashedOut) {
      interval = setInterval(() => {
        setCurrentMultiplier(prev => {
          const next = prev + (Math.random() * 0.1);
          
          // Random crash logic - higher multipliers have higher crash chance
          const crashChance = Math.min(0.02 + (next - 1) * 0.05, 0.8);
          if (Math.random() < crashChance) {
            setCrashed(true);
            setGameActive(false);
            if (isPlaying && !cashedOut) {
              handleGameEnd(0, next);
            }
          }
          
          // Auto cashout
          if (isPlaying && next >= parseFloat(autoCashout) && !cashedOut) {
            handleCashOut();
          }
          
          return next;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [gameActive, crashed, cashedOut, isPlaying, autoCashout]);

  const startNewGame = () => {
    setCurrentMultiplier(1.00);
    setCrashed(false);
    setCashedOut(false);
    setGameActive(true);
  };

  const placeBet = () => {
    const bet = parseFloat(betAmount);
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

    setIsPlaying(true);
    if (!gameActive && !crashed) {
      startNewGame();
    }
  };

  const handleCashOut = () => {
    if (!isPlaying || cashedOut || crashed) return;
    
    setCashedOut(true);
    const winAmount = parseFloat(betAmount) * currentMultiplier;
    handleGameEnd(winAmount, currentMultiplier);
  };

  const handleGameEnd = async (winAmount: number, multiplier: number) => {
    const bet = parseFloat(betAmount);
    const profit = winAmount - bet;
    
    // Update balance
    const newBalance = balance - bet + winAmount;
    await updateBalance(newBalance, bet, winAmount);
    
    // Add to game history
    if (user) {
      await addGameToHistory(user.uid, {
        gameType: 'crash',
        betAmount: bet,
        multiplier: multiplier,
        winAmount: winAmount,
        profit: profit,
        isWin: winAmount > bet,
        gameData: { crashedAt: multiplier }
      });
    }

    // Update recent crashes
    setRecentCrashes(prev => [multiplier, ...prev.slice(0, 4)]);
    
    // Show result
    toast({
      title: winAmount > bet ? "You Won!" : "You Lost!",
      description: `${winAmount > bet ? '+' : ''}$${profit.toFixed(2)}`,
      variant: winAmount > bet ? "default" : "destructive",
    });

    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 crash-multiplier ${crashed ? 'text-destructive' : cashedOut ? 'text-accent' : 'text-secondary'}`}>
            {currentMultiplier.toFixed(2)}x
          </div>
          <p className="text-muted-foreground">
            {crashed ? 'CRASHED!' : cashedOut ? 'CASHED OUT!' : 'Current Multiplier'}
          </p>
        </div>
        
        <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full rounded-full transition-all duration-100 ${
              crashed ? 'bg-destructive' : 'bg-gradient-to-r from-secondary to-accent'
            }`}
            style={{ width: `${Math.min((currentMultiplier - 1) * 20, 100)}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="betAmount" className="block text-sm font-medium mb-2">Bet Amount</Label>
            <Input
              id="betAmount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPlaying || gameActive}
              data-testid="input-bet-amount"
            />
          </div>
          <div>
            <Label htmlFor="autoCashout" className="block text-sm font-medium mb-2">Auto Cashout</Label>
            <Input
              id="autoCashout"
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              placeholder="2.00"
              disabled={isPlaying}
              data-testid="input-auto-cashout"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={placeBet}
            disabled={isPlaying || (gameActive && !crashed)}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3"
            data-testid="button-place-bet"
          >
            {isPlaying ? `Playing ($${betAmount})` : `Place Bet ($${betAmount})`}
          </Button>
          <Button
            onClick={handleCashOut}
            disabled={!isPlaying || cashedOut || crashed}
            className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground font-semibold py-3"
            data-testid="button-cash-out"
          >
            Cash Out ({currentMultiplier.toFixed(2)}x)
          </Button>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Recent Crashes</h4>
        <div className="flex flex-wrap gap-2">
          {recentCrashes.map((crash, index) => (
            <span 
              key={index}
              className={`px-2 py-1 rounded text-sm ${
                crash >= 2 ? 'bg-secondary/20 text-secondary' : 
                crash >= 1.5 ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
              }`}
            >
              {crash.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrashGame;
