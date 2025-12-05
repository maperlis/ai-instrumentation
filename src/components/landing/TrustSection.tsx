import { Shield, Clock, Headphones, Lock } from "lucide-react";

export const TrustSection = () => {
  const trustItems = [
    {
      icon: Shield,
      title: "SOC 2 Compliant",
      description: "Enterprise-grade security",
    },
    {
      icon: Clock,
      title: "99.9% Uptime",
      description: "Reliable infrastructure",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Always here to help",
    },
    {
      icon: Lock,
      title: "GDPR Ready",
      description: "Privacy by design",
    },
  ];

  return (
    <section className="py-16 px-6 bg-zinc-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-8">
          Enterprise-grade data governance
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">
                    {item.title}
                  </div>
                  <div className="text-zinc-500 text-xs">{item.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
