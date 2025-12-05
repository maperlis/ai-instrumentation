import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const LandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#solutions", label: "Solutions" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-foreground font-bold tracking-tighter text-lg hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">M</span>
            </div>
            metrIQ AI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <Button asChild className="hidden md:flex bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg">
                  <Link to="/app">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log in
                  </Link>
                  <Button asChild className="hidden md:flex bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg">
                    <Link to="/auth">Get Started Free</Link>
                  </Button>
                </>
              )}
            </>
          )}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="border-border" />
            {user ? (
              <Button asChild className="w-full bg-foreground text-background font-semibold">
                <Link to="/app" onClick={() => setIsMobileMenuOpen(false)}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link to="/auth" className="text-foreground font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Button asChild className="w-full bg-foreground text-background font-semibold">
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
