import { Sparkles, Target, Zap } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="container mx-auto px-4 pt-20 pb-12 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">AI-Powered Analytics</span>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
        Generate Product Instrumentation
        <br />
        Taxonomies Instantly
      </h1>
      
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Transform designs and URLs into standardized event tracking schemas. 
        Eliminate data inconsistency and align your product teams.
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
          <div className="p-3 rounded-full bg-primary/10">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Consistent Naming</h3>
          <p className="text-sm text-muted-foreground">
            Auto-generate standardized event names following best practices
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
          <div className="p-3 rounded-full bg-secondary/10">
            <Zap className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-semibold">Save Time</h3>
          <p className="text-sm text-muted-foreground">
            Generate complete taxonomies in seconds, not hours
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
          <div className="p-3 rounded-full bg-accent/10">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold">AI Vision</h3>
          <p className="text-sm text-muted-foreground">
            Analyze designs and identify user interactions automatically
          </p>
        </div>
      </div>
    </div>
  );
};
