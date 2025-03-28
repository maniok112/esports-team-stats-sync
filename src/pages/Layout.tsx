
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeamSidebar } from "@/components/TeamSidebar";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeam } from "@/services/leagueApi";

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
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
