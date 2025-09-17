import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import GameCard from '../components/GameCard';
import GameHistory from '../components/GameHistory';
import CrashGame from '../components/games/CrashGame';
import MinesGame from '../components/games/MinesGame';
import LimboGame from '../components/games/LimboGame';
import BlackjackGame from '../components/games/BlackjackGame';
import HiLoGame from '../components/games/HiLoGame';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const { userData } = useAuth();

  const closeGame = () => setSelectedGame(null);

  const renderGameContent = () => {
    switch (selectedGame) {
      case 'crash':
        return <CrashGame />;
      case 'mines':
        return <MinesGame />;
      case 'limbo':
        return <LimboGame />;
      case 'blackjack':
        return <BlackjackGame />;
      case 'hilo':
        return <HiLoGame />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Game interface for {selectedGame} coming soon!
            </p>
          </div>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    });
  };

  const calculateWinRate = () => {
    const totalWagered = userData?.totalWagered || 0;
    const totalWon = userData?.totalWon || 0;
    if (totalWagered === 0) return 0;
    return ((totalWon / totalWagered) * 100).toFixed(0);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Wagered"
            value={formatCurrency(userData?.totalWagered || 0)}
            icon={
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          
          <StatsCard
            title="Total Won"
            value={formatCurrency(userData?.totalWon || 0)}
            className="text-secondary"
            icon={
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          
          <StatsCard
            title="Games Played"
            value={userData?.gamesPlayed?.toString() || '0'}
            icon={
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          
          <StatsCard
            title="Win Rate"
            value={`${calculateWinRate()}%`}
            className="text-accent"
            icon={
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Games Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Popular Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <GameCard
              name="Crash"
              description="Watch the multiplier rise and cash out before it crashes!"
              status="Current: 1.24x"
              badge="Popular"
              badgeColor="secondary"
              icon={
                <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              }
              onClick={() => setSelectedGame('crash')}
            />

            <GameCard
              name="Mines"
              description="Find the safe tiles while avoiding hidden mines."
              status="5x5 Grid"
              badge="Strategy"
              badgeColor="primary"
              icon={
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                </svg>
              }
              onClick={() => setSelectedGame('mines')}
            />

            <GameCard
              name="Limbo"
              description="Set your target and hope the multiplier goes higher!"
              status="Target: 2.5x"
              badge="Simple"
              badgeColor="accent"
              icon={
                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              onClick={() => setSelectedGame('limbo')}
            />

            <GameCard
              name="Blackjack"
              description="Classic card game. Beat the dealer without going over 21!"
              status="VS Dealer"
              badge="Classic"
              badgeColor="secondary"
              icon={
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              }
              onClick={() => setSelectedGame('blackjack')}
            />

            <GameCard
              name="HiLo"
              description="Guess if the next card is higher or lower."
              status="Current: K♠"
              badge="Quick"
              badgeColor="destructive"
              icon={
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              }
              onClick={() => setSelectedGame('hilo')}
            />

            <GameCard
              name="Plinko"
              description="Drop the ball and watch it bounce to multipliers!"
              status="Max: 1000x"
              badge="Fun"
              badgeColor="primary"
              icon={
                <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202a1 1 0 000-1.404l-4.445-2.63z" clipRule="evenodd" />
                </svg>
              }
              onClick={() => setSelectedGame('plinko')}
            />

            <GameCard
              name="Wheel"
              description="Spin the wheel of fortune for random multipliers!"
              status="50 Segments"
              badge="Luck"
              badgeColor="accent"
              icon={
                <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              onClick={() => setSelectedGame('wheel')}
            />

            <GameCard
              name="Keno"
              description="Pick numbers and hope they're drawn in the lottery!"
              status="1-80 Numbers"
              badge="Lottery"
              badgeColor="secondary"
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              onClick={() => setSelectedGame('keno')}
            />
          </div>
        </div>

        {/* Game History */}
        <GameHistory />

        {/* Game Modal */}
        <Dialog open={!!selectedGame} onOpenChange={() => closeGame()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold capitalize">
                {selectedGame}
              </DialogTitle>
            </DialogHeader>
            {renderGameContent()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Dashboard;
