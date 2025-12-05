import { Sparkles, CheckCircle2, MessageSquare, Bot } from "lucide-react";

export const AgentCards = () => {
  return (
    <section className="px-6 pb-24 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 - Strategy Agent */}
          <div className="group relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 hover:ring-2 hover:ring-primary/50 transition-all duration-500 h-[420px] flex flex-col shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            <div className="p-8 flex-1">
              <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                @Strategy Agent
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
                A 24/7 intelligent data strategist.
              </h3>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-zinc-400 font-medium">
                      Sarah <span className="text-zinc-600 ml-1">2:15pm</span>
                    </div>
                    <div className="text-[13px] text-zinc-300 mt-1 leading-relaxed">
                      <span className="text-primary font-medium">@Strategy</span>{" "}
                      Recommend metrics for checkout flow.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 - Code Agent */}
          <div className="group relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 hover:ring-2 hover:ring-pink-500/50 transition-all duration-500 h-[420px] flex flex-col shadow-2xl translate-y-0 md:-translate-y-8">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            <div className="p-8 flex-1">
              <div className="text-[11px] font-bold text-pink-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                Code Agent
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
                Humans no longer write tracking code.
              </h3>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-4 opacity-50">
                  <div className="w-6 h-6 rounded-full bg-pink-900/30 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-zinc-400 font-medium">
                      Mike
                    </div>
                    <div className="text-[13px] text-zinc-500 mt-1">
                      Need tracking for new signup?
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 font-medium">
                      metrIQ Code Agent
                    </div>
                    <div className="text-[13px] text-zinc-300 mt-1">
                      Generated in{" "}
                      <span className="text-white underline decoration-zinc-700">
                        signup_events.ts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - Governance Agent */}
          <div className="group relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 hover:ring-2 hover:ring-emerald-500/50 transition-all duration-500 h-[420px] flex flex-col shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            <div className="p-8 flex-1">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Governance Agent
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight leading-tight">
                Never deploy inconsistent schemas again.
              </h3>
            </div>

            <div className="p-6 pt-0 mt-auto">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[11px] text-zinc-400 font-medium">
                      Alex
                    </div>
                    <div className="text-[13px] text-zinc-300 mt-1 mb-2">
                      Schema conflict detected
                    </div>

                    <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[10px] text-emerald-200 uppercase tracking-wide font-semibold">
                        Auto-resolved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
