import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="py-32 px-6 bg-surface-dark">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-pink-500/10 blur-[100px] -z-10 rounded-full opacity-50" />

        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
          Time is priceless.
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-pink-500 bg-clip-text text-transparent">
            metrIQ AI is free.
          </span>
        </h2>

        <div className="flex items-center justify-center gap-2 text-zinc-400 mb-12">
          <Clock className="w-5 h-5" />
          <span className="text-lg">Save 10+ hours per week</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="w-full sm:w-auto px-10 py-6 h-auto rounded-xl bg-white text-zinc-900 font-bold text-lg hover:bg-zinc-100 transition-colors shadow-xl"
          >
            Get Started for Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-6 h-auto rounded-xl border-white/10 bg-transparent text-white font-bold text-lg hover:bg-white/10"
          >
            Talk to Sales
          </Button>
        </div>

        <p className="mt-8 text-sm text-zinc-500 font-medium">
          No credit card required. Free tier available.
        </p>
      </div>
    </section>
  );
};
