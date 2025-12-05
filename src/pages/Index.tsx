import { useState, useCallback, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { ResultsSection } from "@/components/ResultsSection";
import { FrameworkQuestionsPage } from "@/components/FrameworkQuestionsPage";
import { MetricsFrameworkView } from "@/components/metrics";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { FrameworkType } from "@/types/metricsFramework";
import { useOrchestration } from "@/hooks/useOrchestration";
import { PageContainer } from "@/components/design-system";
import { AppHeader } from "@/components/design-system/AppHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileSpreadsheet } from "lucide-react";

type WorkflowStep = 'input' | 'framework-questions' | 'visualization' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; videoData?: string; productDetails?: string } | null>(null);
  const [frameworkAnswers, setFrameworkAnswers] = useState<Record<string, string>>({});
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('driver_tree');
  
  const { state, isLoading, newMetricIds, startSession, sendMessage, approve, reset } = useOrchestration();
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);

  // Initialize selected metrics when metrics change
  useEffect(() => {
    if (state.metrics.length > 0 && selectedMetricIds.length === 0) {
      setSelectedMetricIds(state.metrics.map(m => m.id));
    }
  }, [state.metrics]);

  // Add new metrics to selection automatically
  useEffect(() => {
    if (newMetricIds.length > 0) {
      setSelectedMetricIds(prev => {
        const newIds = newMetricIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [newMetricIds]);

  const toggleMetric = (metricId: string) => {
    setSelectedMetricIds(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleStartAnalysis = useCallback(async (data: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => {
    setInputData(data);
    setCurrentStep('framework-questions');
  }, []);

  const handleFrameworkQuestionsComplete = useCallback(async (answers: Record<string, string>, framework: FrameworkType) => {
    setFrameworkAnswers(answers);
    setSelectedFramework(framework);
    
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

  const handleApproveMetrics = useCallback(async () => {
    await approve('metrics', selectedMetricIds);
    setCurrentStep('results');
  }, [approve, selectedMetricIds]);

  const handleBackToInput = useCallback(() => {
    reset();
    setCurrentStep('input');
    setFrameworkAnswers({});
    setSelectedMetricIds([]);
  }, [reset]);

  const handleSendMessage = useCallback(async (message: string) => {
    await sendMessage(message);
  }, [sendMessage]);

  const handleMetricsGenerated = useCallback((generatedMetrics: Metric[], data: any) => {
    // Handled by orchestration flow
  }, []);

  const handleTaxonomyGenerated = useCallback((generatedResults: TaxonomyEvent[]) => {
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
            <div className="h-[calc(100vh-8rem)]">
              <MetricsFrameworkView
                metrics={state.metrics}
                selectedMetricIds={selectedMetricIds}
                onToggleMetric={toggleMetric}
                onApprove={handleApproveMetrics}
                isLoading={isLoading}
                conversationHistory={state.conversationHistory}
                onSendMessage={handleSendMessage}
                newMetricIds={newMetricIds}
                initialFramework={selectedFramework}
              />
            </div>
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
