import { Sparkles, Check, FileJson } from "lucide-react";

export const TaxonomyShowcase = () => {
  return (
    <section className="py-24 px-6 border-y border-white/5 bg-zinc-900">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span>Event Taxonomy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Structured event schemas, ready to use
          </h2>
          <p className="text-zinc-400 text-xl leading-relaxed">
            metrIQ AI generates complete event taxonomies with standardized naming,
            detailed properties, and clear documentation for every event.
          </p>

          <ul className="space-y-5 pt-4">
            {[
              "Snake_case naming conventions",
              "Property type definitions",
              "Metrics traceability (which metric each event supports)",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-4 group">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 group-hover:bg-primary/30 transition-colors">
                  <Check className="text-primary w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <span className="text-zinc-300 text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Code Visualization */}
        <div className="flex-1 w-full">
          <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <span className="text-sm text-zinc-500 font-mono flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                event_taxonomy.json
              </span>
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800 border border-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800 border border-white/10" />
              </div>
            </div>
            <div className="p-6 font-mono text-sm leading-7 overflow-x-auto">
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">1</span>
                <span className="text-purple-400">{"{"}</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">2</span>
                <span className="pl-6 text-sky-300">"event_name"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-emerald-400">"checkout_completed"</span>
                <span className="text-zinc-500">,</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">3</span>
                <span className="pl-6 text-sky-300">"trigger"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-orange-300">"Form submit on checkout page"</span>
                <span className="text-zinc-500">,</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">4</span>
                <span className="pl-6 text-sky-300">"properties"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-purple-400">{"{"}</span>
              </div>
              <div className="flex bg-primary/10 border-l-2 border-primary">
                <span className="text-zinc-700 w-8 select-none">5</span>
                <span className="pl-10 text-sky-300">"order_id"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-emerald-400">"string"</span>
                <span className="text-zinc-500">,</span>
              </div>
              <div className="flex bg-primary/10 border-l-2 border-primary">
                <span className="text-zinc-700 w-8 select-none">6</span>
                <span className="pl-10 text-sky-300">"total_value"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-emerald-400">"number"</span>
                <span className="text-zinc-500">,</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">7</span>
                <span className="pl-10 text-sky-300">"currency"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-emerald-400">"string"</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">8</span>
                <span className="pl-6 text-purple-400">{"}"}</span>
                <span className="text-zinc-500">,</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">9</span>
                <span className="pl-6 text-sky-300">"related_metric"</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-emerald-400">"Checkout Completion Rate"</span>
              </div>
              <div className="flex">
                <span className="text-zinc-700 w-8 select-none">10</span>
                <span className="text-purple-400">{"}"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
