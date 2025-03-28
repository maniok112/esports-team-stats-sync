
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Match } from '@/types/league';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PerformanceGraphProps {
  matches: Match[];
  metric: 'kda' | 'csPerMin' | 'kills' | 'deaths' | 'assists';
  title: string;
  className?: string;
}

export const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ 
  matches, 
  metric, 
  title,
  className
}) => {
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);
  
  const data = sortedMatches.map(match => ({
    date: format(new Date(match.timestamp), 'MMM d'),
    [metric]: match[metric],
    champion: match.champion,
    result: match.result
  }));

  let color;
  switch(metric) {
    case 'kda':
      color = '#8B5CF6'; // violet
      break;
    case 'csPerMin':
      color = '#F59E0B'; // yellow
      break;
    case 'kills':
      color = '#EF4444'; // red
      break;
    case 'deaths':
      color = '#10B981'; // green
      break;
    case 'assists':
      color = '#0EA5E9'; // teal
      break;
    default:
      color = '#8B5CF6'; // violet
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 31, 44, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.2)' 
                }}
                itemStyle={{ color: 'rgba(255,255,255,0.9)' }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2}
                dot={{ stroke: color, strokeWidth: 2, r: 4, fill: 'rgba(26, 31, 44, 1)' }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
