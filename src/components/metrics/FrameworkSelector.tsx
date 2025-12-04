import { motion } from "framer-motion";
import { GitBranch, Filter, RefreshCw, Check } from "lucide-react";
import { FrameworkType } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";

interface FrameworkSelectorProps {
  selectedFramework: FrameworkType;
  onSelect: (framework: FrameworkType) => void;
  recommendedFramework?: FrameworkType;
}

const frameworks: { id: FrameworkType; name: string; description: string; icon: any }[] = [
  {
    id: 'driver_tree',
    name: 'Driver Tree',
    description: 'Hierarchical view showing what drives your North Star',
    icon: GitBranch,
  },
  {
    id: 'conversion_funnel',
    name: 'Conversion Funnel',
    description: 'Step-by-step user journey from visitor to advocate',
    icon: Filter,
  },
  {
    id: 'growth_flywheel',
    name: 'Growth Flywheel',
    description: 'Circular feedback loops driving sustainable growth',
    icon: RefreshCw,
  },
];

export function FrameworkSelector({
  selectedFramework,
  onSelect,
  recommendedFramework,
}: FrameworkSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      {frameworks.map((framework) => {
        const Icon = framework.icon;
        const isSelected = selectedFramework === framework.id;
        const isRecommended = recommendedFramework === framework.id;

        return (
          <motion.button
            key={framework.id}
            onClick={() => onSelect(framework.id)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSelected && (
              <motion.div
                layoutId="activeFramework"
                className="absolute inset-0 bg-background rounded-md shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{framework.name}</span>
              {isRecommended && !isSelected && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
