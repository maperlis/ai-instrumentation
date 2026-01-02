import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ResultsSection } from "@/components/ResultsSection";
import { FrameworkQuestionsPage } from "@/components/FrameworkQuestionsPage";
import { MetricsFrameworkView } from "@/components/metrics";
import { ProductContextStep } from "@/components/ProductContextStep";
import { TaxonomyEvent, Metric } from "@/types/taxonomy";
import { ExistingMetric } from "@/types/existingMetrics";
import { FrameworkType } from "@/types/metricsFramework";
import { useOrchestration } from "@/hooks/useOrchestration";
import { useUserSessions } from "@/hooks/useUserSessions";
import { PageContainer } from "@/components/design-system";
import { AppHeader } from "@/components/design-system/AppHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, FileSpreadsheet, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WorkflowStep = 'input' | 'framework-questions' | 'visualization' | 'results';

const Index = () => {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('session');
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [existingMetrics, setExistingMetrics] = useState<ExistingMetric[]>([]);
  const [inputData, setInputData] = useState<{ url?: string; imageData?: string; videoData?: string; productDetails?: string } | null>(null);
  const [frameworkAnswers, setFrameworkAnswers] = useState<Record<string, string>>({});
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('driver_tree');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { state, isLoading, newMetricIds, startSession, sendMessage, approve, reset } = useOrchestration();
  const { saveSession, loadSession } = useUserSessions();
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);

  // Load session from URL if present
  useEffect(() => {
    if (sessionIdFromUrl && !currentSessionId) {
      loadSession(sessionIdFromUrl).then(session => {
        if (session) {
          setCurrentSessionId(session.id);
          setCurrentStep(session.current_step as WorkflowStep);
          setExistingMetrics(session.existing_metrics);
          setInputData({
            url: session.product_url || undefined,
            imageData: session.product_image_data || undefined,
            videoData: session.product_video_data || undefined,
            productDetails: session.product_details || undefined,
          });
          setFrameworkAnswers(session.framework_answers);
          if (session.selected_framework) {
            setSelectedFramework(session.selected_framework);
          }
          toast({
            title: "Session loaded",
            description: "Continuing from where you left off",
          });
        }
      });
    }
  }, [sessionIdFromUrl, currentSessionId, loadSession, toast]);

  // Initialize selected metrics when metrics change (include both AI and existing metrics)
  useEffect(() => {
    if (state.metrics.length > 0 && selectedMetricIds.length === 0) {
      // Start with all AI-generated metrics selected
      const aiMetricIds = state.metrics.map(m => m.id);
      // Also include existing metrics that weren't matched (they'll appear as "Imported" category)
      const existingMetricIds = existingMetrics.map(m => m.id);
      const allIds = [...new Set([...aiMetricIds, ...existingMetricIds])];
      setSelectedMetricIds(allIds);
    }
  }, [state.metrics, existingMetrics]);

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

  // Handle consolidated product context step completion
  const handleProductContextComplete = useCallback((data: {
    existingMetrics: ExistingMetric[];
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => {
    setExistingMetrics(data.existingMetrics);
    setInputData({
      url: data.url,
      imageData: data.imageData,
      videoData: data.videoData,
      productDetails: data.productDetails,
    });
    setCurrentStep('framework-questions');
  }, []);

  const handleFrameworkQuestionsComplete = useCallback(async (answers: Record<string, string>, framework: FrameworkType) => {
    setFrameworkAnswers(answers);
    setSelectedFramework(framework);
    
    // Build product details with user context
    const enrichedProductDetails = inputData?.productDetails 
      ? `${inputData.productDetails}\n\nUser Context:\n- Primary Goal: ${answers.primary_goal}\n- Product Stage: ${answers.product_stage}\n- Business Model: ${answers.business_model}\n- Key Actions: ${answers.key_actions || 'Not specified'}\n- North Star Focus: ${answers.north_star_focus}\n- Preferred Framework: ${framework}`
      : `User Context:\n- Primary Goal: ${answers.primary_goal}\n- Product Stage: ${answers.product_stage}\n- Business Model: ${answers.business_model}\n- Key Actions: ${answers.key_actions || 'Not specified'}\n- North Star Focus: ${answers.north_star_focus}\n- Preferred Framework: ${framework}`;

    // Pass existing metrics to the orchestration
    const response = await startSession({
      ...inputData,
      productDetails: enrichedProductDetails,
      existingMetrics: existingMetrics.map(m => ({
        id: m.id,
        name: m.name,
        definition: m.definition,
        source: m.source,
      })),
    });
    
    if (response && response.status !== 'error') {
      setCurrentStep('visualization');
    }
  }, [inputData, startSession, existingMetrics]);

  const handleApproveMetrics = useCallback(async () => {
    await approve('metrics', selectedMetricIds);
    setCurrentStep('results');
  }, [approve, selectedMetricIds]);

  const handleBackToInput = useCallback(() => {
    reset();
    setCurrentStep('input');
    setFrameworkAnswers({});
    setSelectedMetricIds([]);
    setCurrentSessionId(null);
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

  // Save session handler
  const handleSaveSession = useCallback(async () => {
    setIsSaving(true);
    try {
      const sessionData = {
        name: inputData?.productDetails?.slice(0, 50) || 'Untitled Session',
        status: currentStep === 'results' ? 'completed' as const : 'in_progress' as const,
        current_step: currentStep,
        product_url: inputData?.url || null,
        product_image_data: inputData?.imageData || null,
        product_video_data: inputData?.videoData || null,
        product_details: inputData?.productDetails || null,
        existing_metrics: existingMetrics,
        framework_answers: frameworkAnswers,
        selected_framework: selectedFramework,
        generated_metrics: state.metrics,
        generated_events: state.events,
        conversation_history: state.conversationHistory,
        orchestration_session_id: state.sessionId,
      };

      const savedId = await saveSession(sessionData, currentSessionId || undefined);
      if (savedId && !currentSessionId) {
        setCurrentSessionId(savedId);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    currentStep, inputData, existingMetrics, frameworkAnswers, 
    selectedFramework, state, currentSessionId, saveSession
  ]);

  const totalSteps = 4;
  const canSave = currentStep !== 'input' || (inputData && (inputData.url || inputData.imageData || inputData.videoData));

  return (
    <PageContainer>
      <AppHeader />
      
      {/* Step 1: Product Context (consolidated input + existing metrics) */}
      {currentStep === 'input' && (
        <ProductContextStep
          onComplete={handleProductContextComplete}
          isLoading={isLoading}
          onSave={handleSaveSession}
          isSaving={isSaving}
          canSave={!!canSave}
        />
      )}

      {/* Step 2: Framework Questions */}
      {currentStep === 'framework-questions' && (
        <FrameworkQuestionsPage
          onBack={handleBackToInput}
          onComplete={handleFrameworkQuestionsComplete}
          isLoading={isLoading}
          inputData={inputData}
          existingMetrics={existingMetrics}
        />
      )}
      
      {/* Steps 3 & 4: Visualization and Results */}
      {(currentStep === 'visualization' || currentStep === 'results') && state.metrics.length > 0 && (
        <div className="min-h-[calc(100vh-4rem)]">
          {/* Progress indicator */}
          <div className="bg-background border-b border-border py-3">
            <div className="container mx-auto px-4 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {currentStep === 'visualization' ? '3' : '4'}
                </span>
                Step {currentStep === 'visualization' ? '3' : '4'} of {totalSteps}: {currentStep === 'visualization' ? 'Your metrics framework' : 'Your Instrumentation Plan'}
              </span>
            </div>
          </div>

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
            <div className="w-full h-[calc(100vh-8rem)]">
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
                existingMetrics={existingMetrics}
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