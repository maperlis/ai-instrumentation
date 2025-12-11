import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">M</span>
            </div>
            <span className="text-white font-bold tracking-tight text-xl">
              metrIQ AI
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-zinc-500">
            <Link to="/auth" className="hover:text-white transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} metrIQ AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
