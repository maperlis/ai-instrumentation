import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, PlusCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExistingMetric, MetricComparisonStatus } from "@/types/existingMetrics";
import { Metric } from "@/types/taxonomy";
import { cn } from "@/lib/utils";

interface MetricsComparisonProps {
  existingMetrics: ExistingMetric[];
  generatedMetrics: Metric[];
  className?: string;
}

export function MetricsComparison({ existingMetrics, generatedMetrics, className }: MetricsComparisonProps) {
  // Compare existing metrics with generated metrics
  const comparisonData = useMemo((): MetricComparisonStatus[] => {
    const comparison: MetricComparisonStatus[] = [];
    const matchedExistingIds = new Set<string>();

    // Check each generated metric against existing metrics
    for (const generated of generatedMetrics) {
      const normalizedGenName = generated.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Find matching existing metric by name similarity
      const matchingExisting = existingMetrics.find(existing => {
        const normalizedExistName = existing.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Check for similar names (contains or very similar)
        return normalizedGenName.includes(normalizedExistName) || 
               normalizedExistName.includes(normalizedGenName) ||
               levenshteinDistance(normalizedGenName, normalizedExistName) < 3;
      });

      if (matchingExisting) {
        matchedExistingIds.add(matchingExisting.id);
        
        // Check if definitions differ significantly
        const definitionsDiffer = matchingExisting.definition && generated.description &&
          levenshteinDistance(
            matchingExisting.definition.toLowerCase(),
            generated.description.toLowerCase()
          ) > Math.min(matchingExisting.definition.length, generated.description.length) * 0.3;

        comparison.push({
          id: generated.id,
          name: generated.name,
          definition: generated.description || '',
          status: definitionsDiffer ? 'needs_update' : 'existing',
          source: 'ai',
          originalMetricId: matchingExisting.id,
          updateReason: definitionsDiffer 
            ? `AI suggests: "${generated.description?.substring(0, 100)}..."` 
            : undefined,
        });
      } else {
        comparison.push({
          id: generated.id,
          name: generated.name,
          definition: generated.description || '',
          status: 'new',
          source: 'ai',
        });
      }
    }

    // Add existing metrics that weren't matched (they might be redundant or need review)
    for (const existing of existingMetrics) {
      if (!matchedExistingIds.has(existing.id)) {
        comparison.push({
          id: existing.id,
          name: existing.name,
          definition: existing.definition,
          status: 'existing',
          source: existing.source,
        });
      }
    }

    return comparison;
  }, [existingMetrics, generatedMetrics]);

  const stats = useMemo(() => {
    const existing = comparisonData.filter(m => m.status === 'existing').length;
    const newMetrics = comparisonData.filter(m => m.status === 'new').length;
    const needsUpdate = comparisonData.filter(m => m.status === 'needs_update').length;
    return { existing, newMetrics, needsUpdate, total: comparisonData.length };
  }, [comparisonData]);

  if (existingMetrics.length === 0) {
    return null;
  }

  return (
    <Card className={cn("p-6 bg-card/80 backdrop-blur-sm", className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Metrics Comparison</h3>
          <p className="text-sm text-muted-foreground">
            See how AI recommendations relate to your existing metrics
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.existing}</p>
              <p className="text-xs text-muted-foreground">Existing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.newMetrics}</p>
              <p className="text-xs text-muted-foreground">New</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <RefreshCw className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.needsUpdate}</p>
              <p className="text-xs text-muted-foreground">Update</p>
            </div>
          </div>
        </div>

        {/* Metrics List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          <TooltipProvider>
            {comparisonData.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  metric.status === 'existing' && "bg-green-500/5 border-green-500/20",
                  metric.status === 'new' && "bg-blue-500/5 border-blue-500/20",
                  metric.status === 'needs_update' && "bg-amber-500/5 border-amber-500/20"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {metric.status === 'existing' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {metric.status === 'new' && (
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                  )}
                  {metric.status === 'needs_update' && (
                    <Tooltip>
                      <TooltipTrigger>
                        <RefreshCw className="w-5 h-5 text-amber-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{metric.updateReason}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Metric Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{metric.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{metric.definition}</p>
                </div>

                {/* Status Badge */}
                <Badge variant="outline" className={cn("text-xs flex-shrink-0", {
                  "bg-green-500/10 text-green-600 border-green-500/20": metric.status === 'existing',
                  "bg-blue-500/10 text-blue-600 border-blue-500/20": metric.status === 'new',
                  "bg-amber-500/10 text-amber-600 border-amber-500/20": metric.status === 'needs_update',
                })}>
                  {metric.status === 'existing' && 'Existing'}
                  {metric.status === 'new' && 'New (AI)'}
                  {metric.status === 'needs_update' && 'Update'}
                </Badge>
              </motion.div>
            ))}
          </TooltipProvider>
        </div>

        {stats.needsUpdate > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              {stats.needsUpdate} metric{stats.needsUpdate !== 1 ? 's' : ''} may need updated definitions based on AI analysis
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Simple Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}
