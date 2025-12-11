import {
  Workflow,
  MessageSquare,
  BarChart3,
  Zap,
  Image,
  Video,
} from "lucide-react";

export const FeatureGrid = () => {
  const features = [
    {
      icon: Workflow,
      title: "Visual Metric Frameworks",
      description:
        "View your metrics as Driver Trees, Conversion Funnels, or Growth Flywheels. Drag, connect, and organize metrics visually.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: MessageSquare,
      title: "Conversational Refinement",
      description:
        "Chat with the AI to refine metrics and taxonomy. Ask questions, suggest changes, and iterate in real-time.",
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
      borderColor: "border-pink-400/20",
    },
    {
      icon: BarChart3,
      title: "Amplitude Integration",
      description:
        "Push your event taxonomy directly to Amplitude. Events are automatically seeded for immediate use.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description:
        "Go from product input to complete instrumentation plan in minutes, not days.",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    {
      icon: Image,
      title: "Screenshot Analysis",
      description:
        "Upload Figma designs, UI mockups, or screenshots. AI analyzes the interface to recommend relevant events.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/20",
    },
    {
      icon: Video,
      title: "Video Input Support",
      description:
        "Upload video walkthroughs of your features. AI extracts key frames to understand user flows.",
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
            Everything you need for instrumentation
          </h2>
          <p className="text-zinc-400 text-xl leading-relaxed">
            metrIQ AI helps you define metrics and generate event taxonomies
            from any product input—URLs, screenshots, or videos.
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
