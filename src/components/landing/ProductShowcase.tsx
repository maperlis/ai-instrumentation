import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Upload, 
  MessageSquare, 
  BarChart3, 
  FileSpreadsheet,
  Image,
  Link as LinkIcon,
  Video,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star
} from "lucide-react";

export const ProductShowcase = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "input",
      title: "Input Your Product",
      description: "Start with a URL, screenshot, or video of your product",
      icon: Upload,
    },
    {
      id: "metrics",
      title: "Get Metric Recommendations",
      description: "AI recommends metrics tailored to your business goals",
      icon: BarChart3,
    },
    {
      id: "visualize",
      title: "Visualize & Refine",
      description: "See metrics in Driver Tree, Funnel, or Flywheel views",
      icon: Sparkles,
    },
    {
      id: "taxonomy",
      title: "Generate Taxonomy",
      description: "Get a complete event taxonomy ready for Amplitude",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            See how it works
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            From product input to analytics-ready taxonomy in four simple steps
          </p>
        </div>

        {/* Step Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                  activeStep === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">Step {index + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Area */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">metrIQ AI</span>
            <div className="w-16" />
          </div>

          {/* Content */}
          <div className="p-8 min-h-[500px]">
            {activeStep === 0 && <InputShowcase />}
            {activeStep === 1 && <MetricsShowcase />}
            {activeStep === 2 && <VisualizationShowcase />}
            {activeStep === 3 && <TaxonomyShowcase />}
          </div>
        </div>
      </div>
    </section>
  );
};

const InputShowcase = () => (
  <div className="max-w-2xl mx-auto text-center">
    <h3 className="text-2xl font-bold text-foreground mb-3">Share your product context</h3>
    <p className="text-muted-foreground mb-8">Upload any of the following to get started</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
        <LinkIcon className="w-8 h-8 text-primary mx-auto mb-3" />
        <h4 className="font-semibold text-foreground mb-1">URL</h4>
        <p className="text-sm text-muted-foreground">Paste a link to your live product or staging site</p>
      </div>
      <div className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
        <Image className="w-8 h-8 text-primary mx-auto mb-3" />
        <h4 className="font-semibold text-foreground mb-1">Screenshot</h4>
        <p className="text-sm text-muted-foreground">Upload Figma designs or UI mockups</p>
      </div>
      <div className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
        <Video className="w-8 h-8 text-primary mx-auto mb-3" />
        <h4 className="font-semibold text-foreground mb-1">Video</h4>
        <p className="text-sm text-muted-foreground">Record a walkthrough of your feature</p>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <p className="text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 inline mr-1" />
        AI will analyze your input and generate tailored discovery questions
      </p>
    </div>
  </div>
);

const MetricsShowcase = () => (
  <div className="max-w-3xl mx-auto">
    <div className="flex items-start gap-6">
      {/* Chat Column */}
      <div className="flex-1 space-y-4">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Product Analyst Agent</span>
          </div>
          <p className="text-sm text-foreground">
            Based on your checkout flow, I recommend tracking these key metrics:
          </p>
        </div>
        
        <div className="space-y-3">
          {[
            { name: "Checkout Completion Rate", tier: "North Star" },
            { name: "Cart Abandonment Rate", tier: "Core Driver" },
            { name: "Payment Success Rate", tier: "Core Driver" },
            { name: "Average Order Value", tier: "Sub Driver" },
          ].map((metric, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">{metric.name}</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                metric.tier === "North Star" ? "bg-amber-500/10 text-amber-500" :
                metric.tier === "Core Driver" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {metric.tier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const VisualizationShowcase = () => (
  <div className="max-w-4xl mx-auto">
    <div className="mb-6 flex items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">View:</span>
      <div className="flex gap-2">
        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">Driver Tree</span>
        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">Funnel</span>
        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">Flywheel</span>
      </div>
    </div>

    {/* Simplified Tree Visualization */}
    <div className="relative p-8">
      {/* North Star */}
      <div className="flex justify-center mb-8">
        <div className="px-6 py-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <span className="text-sm font-semibold text-foreground">Checkout Completion Rate</span>
          <p className="text-xs text-muted-foreground mt-1">North Star Metric</p>
        </div>
      </div>

      {/* Connection Lines */}
      <div className="flex justify-center mb-4">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Core Drivers */}
      <div className="flex justify-center gap-8 mb-8">
        {["Cart Abandonment Rate", "Payment Success Rate"].map((metric, i) => (
          <div key={i} className="px-5 py-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <span className="text-sm font-medium text-foreground">{metric}</span>
            <p className="text-xs text-muted-foreground mt-1">Core Driver</p>
          </div>
        ))}
      </div>

      {/* Connection Lines */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="w-px h-8 bg-border" />
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Sub Drivers */}
      <div className="flex justify-center gap-6">
        {["Form Error Rate", "Page Load Time", "Payment Method Availability", "Promo Code Usage"].map((metric, i) => (
          <div key={i} className="px-4 py-2 rounded-lg bg-muted border border-border text-center">
            <span className="text-xs font-medium text-foreground">{metric}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TaxonomyShowcase = () => (
  <div className="max-w-4xl mx-auto">
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
        <span>Event Name</span>
        <span>Trigger</span>
        <span>Properties</span>
        <span>Related Metrics</span>
      </div>

      {/* Table Rows */}
      {[
        { event: "checkout_started", trigger: "Page load", props: "cart_value, item_count", metric: "Checkout Completion" },
        { event: "payment_method_selected", trigger: "Click", props: "payment_type, is_saved", metric: "Payment Success" },
        { event: "checkout_completed", trigger: "Form submit", props: "order_id, total_value", metric: "Checkout Completion" },
        { event: "checkout_abandoned", trigger: "Page exit", props: "cart_value, step_reached", metric: "Cart Abandonment" },
      ].map((row, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-0 text-sm">
          <code className="text-primary font-mono text-xs">{row.event}</code>
          <span className="text-foreground">{row.trigger}</span>
          <span className="text-muted-foreground text-xs">{row.props}</span>
          <span className="text-muted-foreground">{row.metric}</span>
        </div>
      ))}
    </div>

    <div className="mt-6 flex items-center justify-center gap-4">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
        <ArrowRight className="w-4 h-4" />
        Push to Amplitude
      </button>
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium text-sm">
        Export CSV
      </button>
    </div>
  </div>
);
