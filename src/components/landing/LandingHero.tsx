import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const LandingHero = () => {
  const { user } = useAuth();
  const features = [
    "AI Metric Recommendations",
    "Visual Metric Frameworks",
    "Event Taxonomy Generation",
    "Amplitude Integration",
  ];

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden bg-background">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-32 left-[5%] text-xs font-bold tracking-widest uppercase text-foreground/5 animate-float">
          DEFINE METRICS
        </div>
        <div className="absolute top-48 right-[10%] text-xs font-bold tracking-widest uppercase text-foreground/5 animate-float [animation-delay:2s]">
          BUILD TAXONOMY
        </div>
        <div className="absolute bottom-1/3 left-[15%] text-xs font-bold tracking-widest uppercase text-foreground/5 animate-float [animation-delay:4s]">
          PUSH TO AMPLITUDE
        </div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Central Glowing Icon */}
        <div className="relative w-20 h-20 mx-auto mb-8 group cursor-default">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-glow" />
          <div className="relative w-full h-full bg-card rounded-2xl flex items-center justify-center border border-border shadow-xl">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="landing-badge bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" />
            AI-Powered Analytics Strategy
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tighter leading-[1.05] mb-8">
          A Data Strategy That Builds Itself
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in [animation-delay:100ms] opacity-0 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Build less, impact more—metrIQ AI ensures every feature has a measurable reason to exist.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in [animation-delay:200ms] opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto h-14 px-8 rounded-xl bg-foreground text-background font-bold text-base hover:bg-foreground/90 transition-all transform hover:-translate-y-1 shadow-xl"
          >
            <Link to={user ? "/app" : "/auth"}>
              {user ? "Go to Dashboard" : "Get started free"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Free Badge */}
        <p className="animate-fade-in [animation-delay:300ms] opacity-0 text-sm text-muted-foreground mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Free to use. No credit card required.
          </span>
        </p>

        {/* Feature List */}
        <div className="animate-fade-in [animation-delay:400ms] opacity-0 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
