import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface GameCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ 
  name, 
  description, 
  icon, 
  status, 
  badge, 
  badgeColor = 'secondary',
  onClick 
}) => {
  return (
    <Card 
      className="bg-card border border-border game-card-hover cursor-pointer"
      onClick={onClick}
      data-testid={`card-game-${name.toLowerCase()}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{name}</h3>
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
          {badge && (
            <span className={`text-xs bg-${badgeColor}/20 text-${badgeColor} px-2 py-1 rounded-full`}>
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
