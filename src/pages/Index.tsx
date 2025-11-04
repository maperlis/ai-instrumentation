import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { MetricSelection } from "@/components/MetricSelection";
import { ResultsSection } from "@/components/ResultsSection";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { supabase } from "@/integrations/supabase/client";

type WorkflowStep = 'input' | 'metrics' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [results, setResults] = useState<TaxonomyEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; productDetails?: string } | null>(null);

  const handleMetricsGenerated = (generatedMetrics: Metric[], data: any) => {
    setMetrics(generatedMetrics);
    setInputData(data);
    setCurrentStep('metrics');
  };

  const handleMetricsSelected = async (selectedMetricIds: string[]) => {
    if (!inputData) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-taxonomy", {
        body: {
          ...inputData,
          mode: 'taxonomy',
          selectedMetrics: selectedMetricIds,
        },
      });

      if (error) throw error;

      if (data?.events) {
        setResults(data.events);
        setCurrentStep('results');
      }
    } catch (error) {
      console.error("Error generating taxonomy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaxonomyGenerated = (generatedResults: TaxonomyEvent[]) => {
    setResults(generatedResults);
    setCurrentStep('results');
  };

  const handleBackToInput = () => {
    setCurrentStep('input');
    setMetrics(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'input' && (
        <div className="gradient-hero">
          <HeroSection />
          <InputSection 
            onMetricsGenerated={handleMetricsGenerated}
            onTaxonomyGenerated={handleTaxonomyGenerated}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            inputData={inputData}
            selectedMetrics={currentStep === 'input' && metrics ? [] : undefined}
          />
        </div>
      )}
      
      {currentStep === 'metrics' && metrics && (
        <div className="gradient-hero min-h-screen">
          <MetricSelection
            metrics={metrics}
            onBack={handleBackToInput}
            onContinue={handleMetricsSelected}
            isLoading={isLoading}
          />
        </div>
      )}
      
      {currentStep === 'results' && results && !isLoading && (
        <ResultsSection 
          results={results} 
          selectedMetrics={metrics?.map(m => m.name) || []} 
        />
      )}
    </div>
  );
};

export default Index;
