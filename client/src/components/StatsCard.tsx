import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, className }) => {
  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className={`text-2xl font-bold ${className || 'text-foreground'}`} data-testid={`text-${title.toLowerCase().replace(' ', '-')}`}>
              {value}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
