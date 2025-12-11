import { AlertTriangle } from "lucide-react";

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
            Instrumentation is tedious and error-prone
          </h2>

          <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            Teams spend hours manually defining events, maintaining spreadsheets, 
            and struggling to connect metrics to tracking. The result? 
            <span className="text-white font-semibold"> Incomplete data and missed insights.</span>
          </p>

          {/* Problem points */}
          <div className="grid md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
              <h4 className="text-white font-semibold mb-2">Manual Process</h4>
              <p className="text-zinc-500 text-sm">
                Defining events and properties in spreadsheets is slow and disconnected from actual product work.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
              <h4 className="text-white font-semibold mb-2">No Metric Connection</h4>
              <p className="text-zinc-500 text-sm">
                Events are often created without clear ties to the business metrics they're meant to measure.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
              <h4 className="text-white font-semibold mb-2">Inconsistent Naming</h4>
              <p className="text-zinc-500 text-sm">
                Without standards, teams end up with duplicate events and inconsistent property names.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
