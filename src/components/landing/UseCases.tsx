import { useState } from "react";
import { ArrowRight, Layers, Code2, Database, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const UseCases = () => {
  const [activeTab, setActiveTab] = useState(0);

  const useCases = [
    {
      id: "product",
      icon: Layers,
      title: "Product Teams",
      replaces: ["Spreadsheet tracking plans", "Manual metric definitions", "Inconsistent naming"],
      agents: ["Strategy Agent creates metric trees", "Code Agent generates tracking code"],
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "engineering",
      icon: Code2,
      title: "Engineering",
      replaces: ["Copy-paste instrumentation", "Undocumented events", "Schema drift"],
      agents: ["Schema Agent manages definitions", "Code Agent integrates with CI/CD"],
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
    },
    {
      id: "data",
      icon: Database,
      title: "Data Teams",
      replaces: ["Data quality firefighting", "Tribal knowledge", "Manual audits"],
      agents: ["Governance Agent enforces standards", "Analytics Agent provides insights"],
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      id: "marketing",
      icon: Megaphone,
      title: "Marketing",
      replaces: ["Campaign tracking gaps", "Attribution confusion", "Event inconsistency"],
      agents: ["Strategy Agent defines campaign metrics", "Code Agent instruments events"],
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
  ];

  const activeUseCase = useCases[activeTab];

  return (
    <section id="solutions" className="py-24 px-6 bg-surface-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            AI solutions for every team
          </h2>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Purpose-built agents that understand your team's unique challenges and goals.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <button
                key={useCase.id}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  activeTab === index
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {useCase.title}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Replaces */}
          <div className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10">
            <div className="text-xs font-bold text-destructive uppercase tracking-widest mb-6 flex items-center gap-2">
              <X className="w-4 h-4" />
              REPLACES
            </div>
            <ul className="space-y-4">
              {activeUseCase.replaces.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-zinc-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Agents */}
          <div className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10">
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2",
                activeUseCase.color
              )}
            >
              <activeUseCase.icon className="w-4 h-4" />
              POWERED BY
            </div>
            <ul className="space-y-4">
              {activeUseCase.agents.map((agent, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-white font-medium"
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      activeUseCase.bgColor
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full bg-current",
                        activeUseCase.color
                      )}
                    />
                  </div>
                  {agent}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href="#"
            className={cn(
              "inline-flex items-center gap-2 font-semibold transition-colors",
              activeUseCase.color,
              "hover:underline"
            )}
          >
            Explore {activeUseCase.title} solution
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
