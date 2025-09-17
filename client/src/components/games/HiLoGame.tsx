import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBalance } from '../../hooks/useBalance';
import { useAuth } from '../../hooks/useAuth';
import { addGameToHistory } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';

interface Card {
  suit: '♥' | '♦' | '♣' | '♠';
  value: string;
  numValue: number;
}

const HiLoGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState('15.00');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameActive, setGameActive] = useState(false);
  const [recentCards, setRecentCards] = useState<Card[]>([]);
  const [isGuessing, setIsGuessing] = useState(false);

  const { balance, updateBalance } = useBalance();
  const { user } = useAuth();
  const { toast } = useToast();

  const createCard = (): Card => {
    const suits: Array<'♥' | '♦' | '♣' | '♠'> = ['♥', '♦', '♣', '♠'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const numValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomIndex = Math.floor(Math.random() * values.length);

    return {
      suit: randomSuit,
      value: values[randomIndex],
      numValue: numValues[randomIndex],
    };
  };

  const startGame = () => {
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

    const newCard = createCard();
    setCurrentCard(newCard);
    setGameActive(true);
    setStreak(0);
    setMultiplier(1.0);
    setRecentCards([]);
  };

  const makeGuess = async (guess: 'higher' | 'lower') => {
    if (!currentCard || !gameActive || isGuessing) return;
    
    setIsGuessing(true);
    
    // Show some suspense
    setTimeout(async () => {
      const nextCard = createCard();
      const isCorrect = 
        (guess === 'higher' && nextCard.numValue > currentCard.numValue) ||
        (guess === 'lower' && nextCard.numValue < currentCard.numValue) ||
        nextCard.numValue === currentCard.numValue; // Ties count as correct

      if (isCorrect) {
        const newStreak = streak + 1;
        const newMultiplier = 1.0 + (newStreak * 0.3); // Increase multiplier by 0.3x per correct guess
        
        setStreak(newStreak);
        setMultiplier(newMultiplier);
        setRecentCards(prev => [currentCard, ...prev.slice(0, 2)]);
        setCurrentCard(nextCard);
        
        toast({
          title: "Correct!",
          description: `Streak: ${newStreak} | Multiplier: ${newMultiplier.toFixed(1)}x`,
        });
      } else {
        // Game over - wrong guess
        await endGame(false);
        
        toast({
          title: "Wrong!",
          description: `The next card was ${nextCard.value}${nextCard.suit}`,
          variant: "destructive",
        });
      }
      
      setIsGuessing(false);
    }, 1500);
  };

  const cashOut = async () => {
    if (!gameActive || streak === 0) return;
    await endGame(true);
  };

  const endGame = async (won: boolean) => {
    const bet = parseFloat(betAmount);
    const winAmount = won ? bet * multiplier : 0;
    const profit = winAmount - bet;
    
    setGameActive(false);
    
    // Update balance
    const newBalance = balance - bet + winAmount;
    await updateBalance(newBalance, bet, winAmount);
    
    // Add to game history
    if (user) {
      await addGameToHistory(user.uid, {
        gameType: 'hilo',
        betAmount: bet,
        multiplier: won ? multiplier : 0,
        winAmount: winAmount,
        profit: profit,
        isWin: won,
        gameData: { 
          streak,
          finalMultiplier: multiplier,
          recentCards
        }
      });
    }
    
    // Show result
    toast({
      title: won ? "Cashed Out!" : "Game Over!",
      description: `${won ? '+' : ''}$${profit.toFixed(2)}`,
      variant: won ? "default" : "destructive",
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-32 h-48 bg-white border-2 border-border rounded-lg mx-auto mb-6 flex flex-col items-center justify-center text-black shadow-lg">
          {currentCard ? (
            <>
              <span className="text-4xl font-bold mb-2" data-testid="text-current-card">
                {currentCard.value}
              </span>
              <span className={`text-3xl ${['♥', '♦'].includes(currentCard.suit) ? 'text-red-500' : 'text-black'}`} data-testid="text-current-suit">
                {currentCard.suit}
              </span>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold mb-2">?</span>
              <span className="text-3xl">?</span>
            </>
          )}
        </div>
        <p className="text-muted-foreground">Will the next card be Higher or Lower?</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="betAmount" className="block text-sm font-medium mb-2">Bet Amount</Label>
          <Input
            id="betAmount"
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.00"
            disabled={gameActive}
            className="text-lg py-3"
            data-testid="input-bet-amount"
          />
        </div>
        
        {!gameActive ? (
          <Button
            onClick={startGame}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-4"
            data-testid="button-start-game"
          >
            Start Game
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => makeGuess('higher')}
              disabled={isGuessing}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-4"
              data-testid="button-higher"
            >
              📈 HIGHER
            </Button>
            <Button
              onClick={() => makeGuess('lower')}
              disabled={isGuessing}
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground font-bold py-4"
              data-testid="button-lower"
            >
              📉 LOWER
            </Button>
          </div>
        )}
        
        {gameActive && streak > 0 && (
          <Button
            onClick={cashOut}
            className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-3"
            data-testid="button-cash-out"
          >
            Cash Out (${(parseFloat(betAmount) * multiplier).toFixed(2)})
          </Button>
        )}
      </div>
      
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Current Streak</h4>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-accent" data-testid="text-streak">{streak}</span>
          <span className="text-sm text-muted-foreground">
            Multiplier: <span className="font-semibold text-secondary" data-testid="text-multiplier">{multiplier.toFixed(1)}x</span>
          </span>
        </div>
      </div>
      
      {recentCards.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Recent Cards</h4>
          <div className="flex gap-2 justify-center">
            {recentCards.map((card, index) => (
              <div key={index} className="w-12 h-16 bg-white rounded border flex flex-col items-center justify-center text-black text-xs">
                <span className="font-bold">{card.value}</span>
                <span className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}>
                  {card.suit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HiLoGame;
