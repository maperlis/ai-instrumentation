import { Box, Hexagon, Triangle, Circle } from "lucide-react";

export const SocialProof = () => {
  const logos = [
    { name: "ACME", icon: Box },
    { name: "Polymath", icon: Hexagon },
    { name: "VORTEX", icon: Triangle },
    { name: "Orbit", icon: Circle },
  ];

  return (
    <section className="border-y border-border bg-muted/30 relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-8">
          Trusted by data-driven teams
        </p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {logos.map((logo, index) => {
            const Icon = logo.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 text-foreground font-bold tracking-tight text-xl"
              >
                <Icon className="w-6 h-6" />
                {logo.name}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
