import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { subscribeToGameHistory } from '../lib/firebase';

const GameHistory: React.FC = () => {
  const { user } = useAuth();
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToGameHistory(user.uid, (games) => {
      setGameHistory(games);
    });

    return unsubscribe;
  }, [user]);

  const getGameIcon = (gameType: string) => {
    const iconProps = { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20" };
    
    switch (gameType) {
      case 'crash':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      case 'mines':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
          </svg>
        );
      case 'blackjack':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202a1 1 0 000-1.404l-4.445-2.63z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (gameHistory.length === 0) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No games played yet. Start playing to see your history!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Recent Games</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Game</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Multiplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gameHistory.map((game, index) => (
                <tr key={game.id || index} className="hover:bg-muted/30 transition-colors" data-testid={`row-game-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3 text-primary">
                        {getGameIcon(game.gameType)}
                      </div>
                      <span className="font-medium capitalize">{game.gameType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatTime(game.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${parseFloat(game.betAmount || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {parseFloat(game.multiplier || '0').toFixed(2)}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${parseFloat(game.profit || '0') >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                      {parseFloat(game.profit || '0') >= 0 ? '+' : ''}${parseFloat(game.profit || '0').toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameHistory;
