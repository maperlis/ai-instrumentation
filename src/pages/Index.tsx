import { useState, useCallback } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { ConversationFlow } from "@/components/ConversationFlow";
import { ResultsSection } from "@/components/ResultsSection";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { useOrchestration } from "@/hooks/useOrchestration";

type WorkflowStep = 'input' | 'conversation' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [results, setResults] = useState<TaxonomyEvent[] | null>(null);
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; videoData?: string; productDetails?: string } | null>(null);
  
  const { state, isLoading, startSession, approve, reject, reset } = useOrchestration();

  const handleStartAnalysis = useCallback(async (data: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => {
    setInputData(data);
    const response = await startSession(data);
    if (response && response.status !== 'error') {
      setCurrentStep('conversation');
    }
  }, [startSession]);

  const handleApprove = useCallback(async (selectedMetrics?: string[]) => {
    if (state.approvalType === 'metrics') {
      await approve('metrics', selectedMetrics);
    } else if (state.approvalType === 'taxonomy') {
      await approve('taxonomy');
    }
  }, [state.approvalType, approve]);

  const handleReject = useCallback(async () => {
    await reject("User requested regeneration");
    reset();
    setCurrentStep('input');
  }, [reject, reset]);

  const handleBackToInput = useCallback(() => {
    reset();
    setCurrentStep('input');
    setResults(null);
  }, [reset]);

  const handleComplete = useCallback((events: TaxonomyEvent[]) => {
    setResults(events);
    setCurrentStep('results');
  }, []);

  // Legacy handlers for backwards compatibility with InputSection
  const handleMetricsGenerated = useCallback((generatedMetrics: Metric[], data: any) => {
    // This is now handled by the orchestration flow
  }, []);

  const handleTaxonomyGenerated = useCallback((generatedResults: TaxonomyEvent[]) => {
    setResults(generatedResults);
    setCurrentStep('results');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'input' && (
        <div className="gradient-hero">
          <HeroSection />
          <InputSection 
            onMetricsGenerated={handleMetricsGenerated}
            onTaxonomyGenerated={handleTaxonomyGenerated}
            isLoading={isLoading}
            setIsLoading={() => {}}
            inputData={inputData}
            onStartOrchestration={handleStartAnalysis}
          />
        </div>
      )}
      
      {currentStep === 'conversation' && (
        <div className="gradient-hero min-h-screen">
          <ConversationFlow
            conversationHistory={state.conversationHistory}
            metrics={state.metrics}
            events={state.events}
            requiresApproval={state.requiresApproval}
            approvalType={state.approvalType}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onBack={handleBackToInput}
            onComplete={handleComplete}
            status={state.status}
          />
        </div>
      )}
      
      {currentStep === 'results' && results && !isLoading && (
        <ResultsSection 
          results={results} 
          selectedMetrics={state.metrics?.map(m => m.name) || []}
          inputData={inputData || undefined}
        />
      )}
    </div>
  );
};

export default Index;
