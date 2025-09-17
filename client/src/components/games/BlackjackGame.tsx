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

const BlackjackGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState('25.00');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [gameStatus, setGameStatus] = useState('Place your bet to start');
  const [dealerHidden, setDealerHidden] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);

  const { balance, updateBalance } = useBalance();
  const { user } = useAuth();
  const { toast } = useToast();

  const createDeck = (): Card[] => {
    const suits: Array<'♥' | '♦' | '♣' | '♠'> = ['♥', '♦', '♣', '♠'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ suit, value, numValue });
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const calculateTotal = (cards: Card[]): number => {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.value === 'A') {
        aces++;
        total += 11;
      } else {
        total += card.numValue;
      }
    });

    // Adjust for aces
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  };

  const startNewGame = () => {
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

    const deck = createDeck();
    const newPlayerCards = [deck[0], deck[2]];
    const newDealerCards = [deck[1], deck[3]];

    setPlayerCards(newPlayerCards);
    setDealerCards(newDealerCards);
    setPlayerTotal(calculateTotal(newPlayerCards));
    setDealerTotal(calculateTotal([newDealerCards[0]])); // Only show first dealer card
    setGameStarted(true);
    setGameEnded(false);
    setDealerHidden(true);
    setGameStatus('Your turn - Hit or Stand?');

    // Check for blackjack
    if (calculateTotal(newPlayerCards) === 21) {
      if (calculateTotal(newDealerCards) === 21) {
        endGame('push');
      } else {
        endGame('blackjack');
      }
    }
  };

  const hit = () => {
    if (!gameStarted || gameEnded) return;

    const deck = createDeck();
    const newCard = deck[0];
    const newPlayerCards = [...playerCards, newCard];
    const newTotal = calculateTotal(newPlayerCards);

    setPlayerCards(newPlayerCards);
    setPlayerTotal(newTotal);

    if (newTotal > 21) {
      endGame('bust');
    } else if (newTotal === 21) {
      stand();
    }
  };

  const stand = () => {
    if (!gameStarted || gameEnded) return;

    setDealerHidden(false);
    let newDealerCards = [...dealerCards];
    let dealerCurrentTotal = calculateTotal(newDealerCards);

    // Dealer draws cards
    const deck = createDeck();
    let deckIndex = 0;
    
    while (dealerCurrentTotal < 17) {
      newDealerCards.push(deck[deckIndex]);
      dealerCurrentTotal = calculateTotal(newDealerCards);
      deckIndex++;
    }

    setDealerCards(newDealerCards);
    setDealerTotal(dealerCurrentTotal);

    // Determine winner
    if (dealerCurrentTotal > 21) {
      endGame('dealer-bust');
    } else if (playerTotal > dealerCurrentTotal) {
      endGame('win');
    } else if (playerTotal < dealerCurrentTotal) {
      endGame('lose');
    } else {
      endGame('push');
    }
  };

  const doubleDown = () => {
    if (!gameStarted || gameEnded || playerCards.length !== 2) return;
    
    const bet = parseFloat(betAmount);
    if (bet * 2 > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to double down",
        variant: "destructive",
      });
      return;
    }

    setBetAmount((bet * 2).toFixed(2));
    hit();
    setTimeout(() => {
      if (playerTotal <= 21) {
        stand();
      }
    }, 1000);
  };

  const endGame = async (result: string) => {
    setGameEnded(true);
    setDealerHidden(false);
    
    const bet = parseFloat(betAmount);
    let winAmount = 0;
    let statusMessage = '';

    switch (result) {
      case 'blackjack':
        winAmount = bet * 2.5;
        statusMessage = 'Blackjack! You win!';
        break;
      case 'win':
      case 'dealer-bust':
        winAmount = bet * 2;
        statusMessage = result === 'win' ? 'You win!' : 'Dealer busts! You win!';
        break;
      case 'push':
        winAmount = bet;
        statusMessage = 'Push - it\'s a tie!';
        break;
      case 'lose':
      case 'bust':
        winAmount = 0;
        statusMessage = result === 'lose' ? 'Dealer wins!' : 'Bust! You lose!';
        break;
    }

    const profit = winAmount - bet;
    setGameStatus(statusMessage);

    // Update balance
    const newBalance = balance - bet + winAmount;
    await updateBalance(newBalance, bet, winAmount);
    
    // Add to game history
    if (user) {
      await addGameToHistory(user.uid, {
        gameType: 'blackjack',
        betAmount: bet,
        multiplier: winAmount > bet ? winAmount / bet : 0,
        winAmount: winAmount,
        profit: profit,
        isWin: winAmount > bet,
        gameData: { 
          playerCards,
          dealerCards,
          playerTotal,
          dealerTotal: calculateTotal(dealerCards),
          result
        }
      });
    }
    
    // Show result
    toast({
      title: statusMessage,
      description: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`,
      variant: profit >= 0 ? "default" : "destructive",
    });
  };

  const renderCard = (card: Card | null, hidden: boolean = false) => {
    if (!card) return null;

    return (
      <div className="w-16 h-24 bg-white border-2 border-border rounded-lg flex flex-col items-center justify-center text-black relative">
        {hidden ? (
          <div className="bg-primary/20 rounded-lg flex items-center justify-center w-full h-full">
            <span className="text-primary font-bold">?</span>
          </div>
        ) : (
          <>
            <span className="text-lg font-bold">{card.value}</span>
            <span className={`text-lg ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}`}>
              {card.suit}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold mb-4">Dealer Cards</h4>
          <div className="flex gap-2 mb-4">
            {dealerCards.map((card, index) => (
              <div key={index}>
                {renderCard(card, index === 1 && dealerHidden)}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Dealer Total: <span className="font-semibold" data-testid="text-dealer-total">{dealerHidden ? '?' : calculateTotal(dealerCards)}</span>
          </p>
          
          <h4 className="font-semibold mb-4">Your Cards</h4>
          <div className="flex gap-2 mb-4">
            {playerCards.map((card, index) => (
              <div key={index}>
                {renderCard(card)}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Your Total: <span className="font-semibold text-secondary" data-testid="text-player-total">{playerTotal}</span>
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Game Actions</h4>
          
          <div className="mb-6">
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
          
          <div className="space-y-3">
            <Button
              onClick={hit}
              disabled={!gameStarted || gameEnded}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3"
              data-testid="button-hit"
            >
              Hit
            </Button>
            <Button
              onClick={stand}
              disabled={!gameStarted || gameEnded}
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-semibold py-3"
              data-testid="button-stand"
            >
              Stand
            </Button>
            <Button
              onClick={doubleDown}
              disabled={!gameStarted || gameEnded || playerCards.length !== 2}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3"
              data-testid="button-double"
            >
              Double Down
            </Button>
            <Button
              onClick={startNewGame}
              disabled={gameStarted && !gameEnded}
              className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground font-semibold py-3"
              data-testid="button-new-game"
            >
              New Game
            </Button>
          </div>
          
          <div className="mt-8 bg-card border border-border rounded-lg p-4">
            <h5 className="font-semibold mb-2">Game Status</h5>
            <p className="text-accent font-semibold" data-testid="text-game-status">{gameStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
