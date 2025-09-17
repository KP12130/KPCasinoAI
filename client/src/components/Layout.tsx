import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useBalance } from '../hooks/useBalance';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, userData } = useAuth();
  const { balance } = useBalance();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold">CasinoHub</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-muted-foreground hover:text-foreground transition-colors">Games</button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">Sports</button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">Promotions</button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Balance Display */}
              <div className="bg-secondary/20 border border-secondary/30 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-secondary text-sm">$</span>
                  <span className="text-secondary font-semibold balance-glow" data-testid="text-balance">
                    {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium" data-testid="text-initials">
                    {getInitials(user?.displayName)}
                  </span>
                </div>
                <span className="text-sm font-medium" data-testid="text-username">
                  {user?.displayName || 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
