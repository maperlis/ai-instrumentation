import { Bot, Sparkles, Code, Shield, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AgentShowcase = () => {
  const agents = [
    {
      icon: Sparkles,
      name: "Strategy Agent",
      description: "Builds your metric framework from business goals",
      color: "from-primary to-blue-600",
      bgGlow: "bg-primary/20",
    },
    {
      icon: Code,
      name: "Code Agent",
      description: "Generates type-safe instrumentation code",
      color: "from-pink-500 to-purple-600",
      bgGlow: "bg-pink-500/20",
    },
    {
      icon: Shield,
      name: "Governance Agent",
      description: "Ensures schema consistency across teams",
      color: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/20",
    },
    {
      icon: BarChart3,
      name: "Analytics Agent",
      description: "Answers questions about your data 24/7",
      color: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/20",
    },
  ];

  return (
    <section className="py-24 px-6 bg-surface-dark border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mb-6">
            <Bot className="w-4 h-4" />
            <span>AI Agents</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            A new era of data strategy,
            <br />
            with AI Agents
          </h2>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Four specialized agents work together to build, implement, and maintain
            your entire data strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {agents.map((agent, index) => {
            const Icon = agent.icon;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                {/* Glow effect */}
                <div
                  className={`absolute -inset-px ${agent.bgGlow} blur-xl opacity-0 group-hover:opacity-50 transition-opacity rounded-2xl`}
                />

                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {agent.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="h-14 px-8 rounded-xl bg-white text-zinc-900 font-bold hover:bg-zinc-100"
          >
            Build your strategy
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
