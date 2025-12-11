import { Sparkles, BarChart3, FileSpreadsheet, Send } from "lucide-react";

export const AgentCards = () => {
  return (
    <section className="px-6 pb-24 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Your AI-powered instrumentation workflow
          </h2>
          <p className="text-muted-foreground">
            Four steps from product input to analytics-ready taxonomy
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {/* Step 1 - Input */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 p-6">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</div>
              Input
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Share your product
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload a URL, screenshot, or video of your feature
            </p>
          </div>

          {/* Step 2 - Questions */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 p-6">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</div>
              Discovery
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Answer tailored questions
            </h3>
            <p className="text-sm text-muted-foreground">
              AI generates context-specific questions about your goals
            </p>
          </div>

          {/* Step 3 - Metrics */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 p-6">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">3</div>
              Metrics
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Review your framework
            </h3>
            <p className="text-sm text-muted-foreground">
              Get AI-recommended metrics in visual Driver Tree, Funnel, or Flywheel views
            </p>
          </div>

          {/* Step 4 - Taxonomy */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 p-6">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">4</div>
              Taxonomy
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Export to Amplitude
            </h3>
            <p className="text-sm text-muted-foreground">
              Get a complete event taxonomy and push directly to Amplitude
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
