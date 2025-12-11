import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const FinalCTA = () => {
  const { user } = useAuth();

  return (
    <section className="py-32 px-6 bg-surface-dark">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-pink-500/10 blur-[100px] -z-10 rounded-full opacity-50" />

        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
          Ready to streamline
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-pink-500 bg-clip-text text-transparent">
            your instrumentation?
          </span>
        </h2>

        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
          Go from product input to Amplitude-ready event taxonomy in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto px-10 py-6 h-auto rounded-xl bg-white text-zinc-900 font-bold text-lg hover:bg-zinc-100 transition-colors shadow-xl"
          >
            <Link to={user ? "/app" : "/auth"}>
              {user ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-zinc-500 font-medium">
          No credit card required.
        </p>
      </div>
    </section>
  );
};
