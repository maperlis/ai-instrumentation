import { Sparkles, Target, Zap } from "lucide-react";
import { SectionContainer, FeatureCard, IconContainer } from "@/components/design-system";

export const HeroSection = () => {
  return (
    <SectionContainer size="lg" className="pt-16 pb-12 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">AI-Powered Analytics</span>
      </div>
      
      {/* Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Generate Product Instrumentation
        </span>
        <br />
        <span className="text-foreground">Taxonomies Instantly</span>
      </h1>
      
      {/* Subheadline */}
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Transform designs and URLs into standardized event tracking schemas. 
        Eliminate data inconsistency and align your product teams.
      </p>

      {/* Feature cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <FeatureCard variant="elevated" hoverEffect="lift" className="text-left">
          <IconContainer variant="primary" size="md" className="mb-4">
            <Target className="w-6 h-6" />
          </IconContainer>
          <h3 className="font-semibold text-foreground mb-2">Consistent Naming</h3>
          <p className="text-sm text-muted-foreground">
            Auto-generate standardized event names following best practices
          </p>
        </FeatureCard>

        <FeatureCard variant="elevated" hoverEffect="lift" className="text-left">
          <IconContainer variant="secondary" size="md" className="mb-4">
            <Zap className="w-6 h-6" />
          </IconContainer>
          <h3 className="font-semibold text-foreground mb-2">Save Time</h3>
          <p className="text-sm text-muted-foreground">
            Generate complete taxonomies in seconds, not hours
          </p>
        </FeatureCard>

        <FeatureCard variant="elevated" hoverEffect="lift" className="text-left">
          <IconContainer variant="accent" size="md" className="mb-4">
            <Sparkles className="w-6 h-6" />
          </IconContainer>
          <h3 className="font-semibold text-foreground mb-2">AI Vision</h3>
          <p className="text-sm text-muted-foreground">
            Analyze designs and identify user interactions automatically
          </p>
        </FeatureCard>
      </div>
    </SectionContainer>
  );
};
