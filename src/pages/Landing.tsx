import {
  LandingNav,
  LandingHero,
  AgentCards,
  SocialProof,
  ProblemSection,
  FeatureGrid,
  TaxonomyShowcase,
  Integrations,
  AgentShowcase,
  UseCases,
  StatsSection,
  Testimonials,
  TrustSection,
  FinalCTA,
  LandingFooter,
} from "@/components/landing";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <AgentCards />
      <SocialProof />
      <ProblemSection />
      <FeatureGrid />
      <TaxonomyShowcase />
      <Integrations />
      <AgentShowcase />
      <UseCases />
      <StatsSection />
      <Testimonials />
      <TrustSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
};

export default Landing;
