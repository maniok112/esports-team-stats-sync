
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  BarChart3, 
  Calendar, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger 
} from '@/components/ui/sidebar';

import { Player } from '@/types/league';

interface TeamSidebarProps {
  players: Player[];
  isLoading?: boolean;
}

export const TeamSidebar = ({ players, isLoading = false }: TeamSidebarProps) => {
  const location = useLocation();
  
  const mainLinks = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/stats', label: 'Team Stats', icon: BarChart3 },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Sidebar>
      <div className="flex items-center h-14 px-4 border-b">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">LoL</span>
          <span>Team Stats</span>
        </Link>
        <SidebarTrigger className="ml-auto">
          {({ collapsed }) => (
            collapsed ? <Menu size={20} /> : <X size={20} />
          )}
        </SidebarTrigger>
      </div>
      
      <SidebarContent>
        <nav className="px-2 py-4">
          <ul className="space-y-1">
            {mainLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    location.pathname === link.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-2">
            Players
          </h3>
          <ul className="space-y-1">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <li key={i} className="animate-pulse h-10 bg-sidebar-accent/50 rounded-md"></li>
              ))
            ) : (
              players.map((player) => (
                <li key={player.id}>
                  <Link
                    to={`/player/${player.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      location.pathname === `/player/${player.id}`
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    )}
                  >
                    <User size={20} />
                    <div className="flex flex-col">
                      <span>{player.name}</span>
                      <span className="text-xs text-sidebar-foreground/60">{player.role}</span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
