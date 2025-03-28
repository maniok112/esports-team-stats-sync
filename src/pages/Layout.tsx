
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeamSidebar } from "@/components/TeamSidebar";
import { Outlet, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeam } from "@/services/leagueApi";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const Layout = () => {
  const { data: team, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TeamSidebar players={team?.players || []} isLoading={isLoading} />
        <main className="flex-1 p-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
