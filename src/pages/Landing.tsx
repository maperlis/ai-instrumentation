import {
  LandingNav,
  LandingHero,
  AgentCards,
  ProblemSection,
  FeatureGrid,
  TaxonomyShowcase,
  Integrations,
  ProductShowcase,
  FinalCTA,
  LandingFooter,
} from "@/components/landing";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <AgentCards />
      <ProblemSection />
      <ProductShowcase />
      <FeatureGrid />
      <TaxonomyShowcase />
      <Integrations />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
};

export default Landing;
