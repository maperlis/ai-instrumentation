import {
  Workflow,
  MessageSquare,
  Code2,
  GitBranch,
  Shield,
  Zap,
  BarChart3,
  Users,
  Layers,
  RefreshCw,
  Target,
  Database,
} from "lucide-react";

export const FeatureGrid = () => {
  const features = [
    {
      icon: Workflow,
      title: "Metric Trees",
      description:
        "Visually map inputs to outputs. Deconstruct high-level goals into actionable metrics.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: MessageSquare,
      title: "Collaborative Approval",
      description:
        "Align stakeholders before writing code. Comment, upvote, and approve definitions.",
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
      borderColor: "border-pink-400/20",
    },
    {
      icon: Code2,
      title: "Auto-Instrumentation",
      description:
        "Generate type-safe code snippets and JSON schemas for any analytics platform.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
    },
    {
      icon: GitBranch,
      title: "Version Control",
      description:
        "Track every change to your schema with full history and rollback capabilities.",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    {
      icon: Shield,
      title: "Schema Validation",
      description:
        "Detect anomalies and enforce schemas at build time before they reach production.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/20",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description:
        "Go from product design to instrumented code in seconds, not hours.",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
    },
  ];

  return (
    <section id="product" className="py-24 px-6 bg-surface-dark">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            From idea to instrumented.
          </h2>
          <p className="text-zinc-400 text-xl leading-relaxed">
            Stop using spreadsheets to manage your tracking plan. metrIQ AI provides
            a purpose-built workflow for defining and maintaining your data strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
              >
                <div
                  className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center ${feature.color} mb-6 border ${feature.borderColor}`}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl text-white font-semibold mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
