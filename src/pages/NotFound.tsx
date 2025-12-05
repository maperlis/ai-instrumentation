import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { PageContainer, SectionContainer } from "@/components/design-system";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageContainer variant="gradient" className="flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-1/4 left-[15%] text-6xl font-bold tracking-widest text-primary/5 animate-float">
          404
        </div>
        <div className="absolute top-1/3 right-[20%] text-4xl font-bold tracking-widest text-secondary/5 animate-float" style={{ animationDelay: '2s' }}>
          NOT FOUND
        </div>
      </div>

      <SectionContainer size="sm" className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-full mb-6 border border-destructive/20">
          <span className="text-sm font-semibold text-destructive">Error 404</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-4">
          Page not found
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/app">
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </SectionContainer>
    </PageContainer>
  );
};

export default NotFound;
