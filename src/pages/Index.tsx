import { useState, useCallback } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { ConversationFlow } from "@/components/ConversationFlow";
import { ResultsSection } from "@/components/ResultsSection";
import { FrameworkQuestionsPage } from "@/components/FrameworkQuestionsPage";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { FrameworkType } from "@/types/metricsFramework";
import { useOrchestration } from "@/hooks/useOrchestration";
import { PageContainer } from "@/components/design-system";
import { AppHeader } from "@/components/design-system/AppHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileSpreadsheet } from "lucide-react";

type WorkflowStep = 'input' | 'framework-questions' | 'visualization' | 'taxonomy-review' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [results, setResults] = useState<TaxonomyEvent[] | null>(null);
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; videoData?: string; productDetails?: string } | null>(null);
  const [frameworkAnswers, setFrameworkAnswers] = useState<Record<string, string>>({});
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('driver_tree');
  
  const { state, isLoading, newMetricIds, startSession, sendMessage, approve, reject, reset } = useOrchestration();

  const handleStartAnalysis = useCallback(async (data: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => {
    setInputData(data);
    // Move to framework questions instead of starting session immediately
    setCurrentStep('framework-questions');
  }, []);

  const handleFrameworkQuestionsComplete = useCallback(async (answers: Record<string, string>, framework: FrameworkType) => {
    setFrameworkAnswers(answers);
    setSelectedFramework(framework);
    
    // Now start the session with the additional context from framework questions
    const enrichedProductDetails = inputData?.productDetails 
      ? `${inputData.productDetails}\n\nUser Context:\n- Primary Goal: ${answers.primary_goal}\n- Product Stage: ${answers.product_stage}\n- Business Model: ${answers.business_model}\n- Key Actions: ${answers.key_actions || 'Not specified'}\n- North Star Focus: ${answers.north_star_focus}\n- Preferred Framework: ${framework}`
      : `User Context:\n- Primary Goal: ${answers.primary_goal}\n- Product Stage: ${answers.product_stage}\n- Business Model: ${answers.business_model}\n- Key Actions: ${answers.key_actions || 'Not specified'}\n- North Star Focus: ${answers.north_star_focus}\n- Preferred Framework: ${framework}`;

    const response = await startSession({
      ...inputData,
      productDetails: enrichedProductDetails,
    });
    
    if (response && response.status !== 'error') {
      setCurrentStep('visualization');
    }
  }, [inputData, startSession]);

  const handleApprove = useCallback(async (selectedMetrics?: string[]) => {
    if (state.approvalType === 'metrics') {
      await approve('metrics', selectedMetrics);
      // Go directly to results page - skip taxonomy-review step
      setCurrentStep('results');
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
    setFrameworkAnswers({});
  }, [reset]);

  const handleBackToFrameworkQuestions = useCallback(() => {
    setCurrentStep('framework-questions');
  }, []);

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

      {currentStep === 'framework-questions' && (
        <FrameworkQuestionsPage
          onBack={handleBackToInput}
          onComplete={handleFrameworkQuestionsComplete}
          isLoading={isLoading}
          inputData={inputData}
        />
      )}
      
      {(currentStep === 'visualization' || currentStep === 'results') && state.metrics.length > 0 && (
        <div className="min-h-[calc(100vh-4rem)]">
          {/* Navigation Tabs */}
          <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
            <div className="container mx-auto px-4">
              <Tabs 
                value={currentStep === 'visualization' ? 'metrics' : 'taxonomy'} 
                onValueChange={(value) => setCurrentStep(value === 'metrics' ? 'visualization' : 'results')}
                className="w-full"
              >
                <TabsList className="h-12 bg-transparent border-none gap-2">
                  <TabsTrigger 
                    value="metrics" 
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 px-4"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Metrics & Visualization
                  </TabsTrigger>
                  <TabsTrigger 
                    value="taxonomy" 
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 px-4"
                    disabled={state.events.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Event Taxonomy
                    {state.events.length > 0 && (
                      <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {state.events.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Content */}
          {currentStep === 'visualization' && (
            <ConversationFlow
              conversationHistory={state.conversationHistory}
              metrics={state.metrics}
              events={state.events}
              requiresApproval={state.requiresApproval}
              approvalType={state.approvalType}
              isLoading={isLoading}
              onApprove={handleApprove}
              onReject={handleReject}
              onBack={handleBackToFrameworkQuestions}
              onComplete={handleComplete}
              onSendMessage={handleSendMessage}
              status={state.status}
              newMetricIds={newMetricIds}
              frameworkRecommendation={state.frameworkRecommendation}
              clarifyingQuestions={state.clarifyingQuestions}
              selectedFramework={selectedFramework}
              onClarifyingAnswer={(answers) => {
                console.log("Clarifying answers:", answers);
              }}
            />
          )}

          {currentStep === 'results' && state.events.length > 0 && (
            <ResultsSection 
              results={state.events}
              selectedMetrics={state.metrics?.map(m => m.name) || []}
              inputData={inputData || undefined}
              conversationHistory={state.conversationHistory}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default Index;
