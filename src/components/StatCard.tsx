
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  className?: string;
  valueClassName?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  change,
  className,
  valueClassName
}: StatCardProps) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        <div className="flex items-end justify-between">
          <div className={cn("text-2xl font-bold", valueClassName)}>
            {value}
          </div>
          {change !== undefined && (
            <div className={cn(
              "text-sm font-medium flex items-center gap-1",
              change > 0 ? "text-esports-green" : change < 0 ? "text-esports-red" : "text-muted-foreground"
            )}>
              {change > 0 ? "+" : ""}{change}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
