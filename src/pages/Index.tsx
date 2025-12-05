import { useState, useCallback } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { ConversationFlow } from "@/components/ConversationFlow";
import { ResultsSection } from "@/components/ResultsSection";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { useOrchestration } from "@/hooks/useOrchestration";
import { PageContainer } from "@/components/design-system";
import { AppHeader } from "@/components/design-system/AppHeader";

type WorkflowStep = 'input' | 'conversation' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [results, setResults] = useState<TaxonomyEvent[] | null>(null);
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; videoData?: string; productDetails?: string } | null>(null);
  
  const { state, isLoading, newMetricIds, startSession, sendMessage, approve, reject, reset } = useOrchestration();

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

  const handleSendMessage = useCallback(async (message: string) => {
    await sendMessage(message);
  }, [sendMessage]);

  const handleMetricsGenerated = useCallback((generatedMetrics: Metric[], data: any) => {
    // Handled by orchestration flow
  }, []);

  const handleTaxonomyGenerated = useCallback((generatedResults: TaxonomyEvent[]) => {
    setResults(generatedResults);
    setCurrentStep('results');
  }, []);

  return (
    <PageContainer>
      <AppHeader />
      
      {currentStep === 'input' && (
        <div className="gradient-hero min-h-[calc(100vh-4rem)]">
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
        <div className="min-h-[calc(100vh-4rem)]">
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
            onSendMessage={handleSendMessage}
            status={state.status}
            newMetricIds={newMetricIds}
            frameworkRecommendation={state.frameworkRecommendation}
            clarifyingQuestions={state.clarifyingQuestions}
            onClarifyingAnswer={(answers) => {
              console.log("Clarifying answers:", answers);
            }}
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
    </PageContainer>
  );
};

export default Index;
