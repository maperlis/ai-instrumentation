import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";

interface AppHeaderProps {
  showUserMenu?: boolean;
}

export const AppHeader = ({ showUserMenu = true }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-foreground font-semibold tracking-tighter text-lg hover:opacity-80 transition-opacity"
        >
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-secondary" />
          metrIQ AI
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/sessions">
              <FolderOpen className="w-4 h-4" />
              My Sessions
            </Link>
          </Button>
          {showUserMenu && <UserMenu />}
        </div>
      </div>
    </header>
  );
};
