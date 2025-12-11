import { BarChart2 } from "lucide-react";

export const Integrations = () => {
  return (
    <section className="py-24 px-6 bg-surface-dark text-center">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-lg text-white font-medium mb-4">
          Push directly to your analytics platform
        </h3>
        <p className="text-zinc-500 text-sm mb-12">
          Currently supporting Amplitude with more integrations coming soon
        </p>
        <div className="flex justify-center">
          <div className="h-32 w-64 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors">
            <BarChart2 className="w-10 h-10 text-zinc-300" />
            <span className="text-lg font-semibold text-zinc-200">
              Amplitude
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
