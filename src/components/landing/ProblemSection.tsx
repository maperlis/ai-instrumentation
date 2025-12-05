import { Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProblemSection = () => {
  return (
    <section className="landing-section bg-surface-dark text-dark-primary">
      {/* Gradient transition */}
      <div className="h-32 w-full bg-gradient-to-b from-background to-zinc-950 -mt-24 mb-12" />

      <div className="landing-container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              The Problem
            </span>
          </div>

          <h2 className="landing-heading text-white mb-6">
            It's time to end metric chaos
          </h2>

          <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            <span className="text-white font-semibold">60% of product decisions</span>{" "}
            lack proper data. Teams waste hours tracking down metrics, maintaining
            spreadsheets, and fixing broken instrumentation.
          </p>

          {/* Video Placeholder */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video max-w-3xl mx-auto group cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            
            {/* Placeholder content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-zinc-400 text-sm">See how metrIQ AI works</p>
              </div>
            </div>

            {/* Fake UI elements in background */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
          </div>

          <div className="mt-12">
            <Button
              size="lg"
              className="h-14 px-8 rounded-xl bg-white text-zinc-900 font-bold hover:bg-zinc-100"
            >
              Start fixing your data
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
