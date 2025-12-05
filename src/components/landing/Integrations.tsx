import { Database, BarChart2, Github, MessageSquare } from "lucide-react";

export const Integrations = () => {
  const integrations = [
    { name: "Segment", icon: Database },
    { name: "Mixpanel", icon: BarChart2 },
    { name: "GitHub", icon: Github },
    { name: "Slack", icon: MessageSquare },
  ];

  return (
    <section className="py-24 px-6 bg-surface-dark text-center">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-lg text-white font-medium mb-12">
          Works with your existing stack
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <div
                key={index}
                className="h-32 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 transition-colors cursor-default"
              >
                <Icon className="w-8 h-8 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-300">
                  {integration.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
