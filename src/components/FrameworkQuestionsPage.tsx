import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Target, Users, TrendingUp, BarChart3, RefreshCw, GitBranch, Filter, Check, Loader2, Lightbulb, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FrameworkType } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";
import { SectionContainer } from "@/components/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  options?: { value: string; label: string; description?: string; icon?: React.ReactNode }[];
  category: 'business' | 'product' | 'metrics' | 'framework';
}

interface ProductInsights {
  detectedType: string;
  keyFeatures: string[];
  suggestedNorthStar: string;
}

const frameworks: { id: FrameworkType; name: string; description: string; icon: React.ReactNode; bestFor: string[] }[] = [
  {
    id: 'driver_tree',
    name: 'Driver Tree',
    description: 'Hierarchical view showing what metrics drive your North Star',
    icon: <GitBranch className="w-6 h-6" />,
    bestFor: ['hierarchical', 'mature', 'subscription'],
  },
  {
    id: 'conversion_funnel',
    name: 'Conversion Funnel',
    description: 'Step-by-step user journey from visitor to advocate',
    icon: <Filter className="w-6 h-6" />,
    bestFor: ['sequential', 'ecommerce', 'early_growth'],
  },
  {
    id: 'growth_flywheel',
    name: 'Growth Flywheel',
    description: 'Circular feedback loops driving sustainable growth',
    icon: <RefreshCw className="w-6 h-6" />,
    bestFor: ['cyclical', 'marketplace', 'scaling'],
  },
];

// Icon mapping for dynamic questions
const getIconForCategory = (category: string) => {
  switch (category) {
    case 'business': return <BarChart3 className="w-5 h-5" />;
    case 'product': return <Target className="w-5 h-5" />;
    case 'metrics': return <TrendingUp className="w-5 h-5" />;
    case 'framework': return <GitBranch className="w-5 h-5" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

interface FrameworkQuestionsPageProps {
  onBack: () => void;
  onComplete: (answers: Record<string, string>, selectedFramework: FrameworkType) => void;
  isLoading?: boolean;
  inputData?: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  } | null;
}

export function FrameworkQuestionsPage({ onBack, onComplete, isLoading: externalLoading, inputData }: FrameworkQuestionsPageProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [productInsights, setProductInsights] = useState<ProductInsights | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFrameworkSelection, setShowFrameworkSelection] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType | null>(null);

  // Validate and fix question - convert to text if no options
  const normalizeQuestion = (q: Question): Question => {
    const hasValidOptions = Array.isArray(q.options) && 
      q.options.length > 0 && 
      q.options.every(opt => opt.value && opt.label);
    
    // If single_choice but no valid options, convert to text input
    if ((q.type === 'single_choice' || q.type === 'multiple_choice') && !hasValidOptions) {
      return {
        ...q,
        type: 'text',
        options: undefined
      };
    }
    return q;
  };

  // Generate tailored questions based on input data
  useEffect(() => {
    async function generateQuestions() {
      setIsLoadingQuestions(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-discovery-questions', {
          body: {
            url: inputData?.url,
            imageData: inputData?.imageData || inputData?.videoData,
            productDetails: inputData?.productDetails,
          }
        });

        if (error) throw error;

        if (data?.questions && data.questions.length > 0) {
          // Normalize questions (fix those without options) and add icons
          const enhancedQuestions = data.questions
            .map((q: Question) => normalizeQuestion(q))
            .map((q: Question) => ({
              ...q,
              options: q.options?.map(opt => ({
                ...opt,
                icon: getIconForValue(opt.value)
              }))
            }));
          
          if (enhancedQuestions.length > 0) {
            setQuestions(enhancedQuestions);
          } else {
            // All generated questions were invalid, use fallback
            console.warn('All generated questions were invalid, using fallback');
            setQuestions(getFallbackQuestions());
          }
        } else {
          // No questions returned, use fallback
          setQuestions(getFallbackQuestions());
        }

        if (data?.productInsights) {
          setProductInsights(data.productInsights);
        }
      } catch (error) {
        console.error('Failed to generate tailored questions:', error);
        toast({
          title: "Using default questions",
          description: "Couldn't generate tailored questions. Using standard discovery flow.",
          variant: "default"
        });
        // Use fallback questions
        setQuestions(getFallbackQuestions());
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    generateQuestions();
  }, [inputData, toast]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Calculate recommended framework based on answers
  const recommendedFramework = useMemo((): FrameworkType => {
    const scores: Record<FrameworkType, number> = {
      driver_tree: 0,
      conversion_funnel: 0,
      growth_flywheel: 0,
    };

    // Score based on answers (skip __skipped__ answers)
    Object.values(answers).forEach(answer => {
      if (answer === '__skipped__') return;
      if (['hierarchical', 'cause_effect', 'dependencies'].includes(answer)) scores.driver_tree += 2;
      if (['sequential', 'journey', 'funnel', 'conversion', 'ecommerce', 'purchase'].includes(answer)) scores.conversion_funnel += 2;
      if (['cyclical', 'loops', 'flywheel', 'marketplace', 'network', 'connection'].includes(answer)) scores.growth_flywheel += 2;
      if (['subscription', 'saas', 'retention'].includes(answer)) scores.driver_tree += 1;
      if (['growth', 'viral', 'referral'].includes(answer)) scores.growth_flywheel += 1;
      if (['checkout', 'sales', 'signup'].includes(answer)) scores.conversion_funnel += 1;
      if (['engagement'].includes(answer)) scores.driver_tree += 1;
    });

    // Consider product insights
    if (productInsights?.detectedType) {
      if (['ecommerce', 'retail'].includes(productInsights.detectedType)) scores.conversion_funnel += 2;
      if (['marketplace', 'social'].includes(productInsights.detectedType)) scores.growth_flywheel += 2;
      if (['saas', 'subscription'].includes(productInsights.detectedType)) scores.driver_tree += 2;
    }

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][0] as FrameworkType;
  }, [answers, productInsights]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowFrameworkSelection(true);
    }
  };

  const handleSkip = () => {
    // Mark question as skipped and move to next
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: '__skipped__' }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowFrameworkSelection(true);
    }
  };

  const handlePrevious = () => {
    if (showFrameworkSelection) {
      setShowFrameworkSelection(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleFrameworkSelect = (framework: FrameworkType) => {
    setSelectedFramework(framework);
  };

  const handleContinue = () => {
    if (selectedFramework) {
      onComplete(answers, selectedFramework);
    }
  };

  const canProceed = currentQuestion?.type === 'text' 
    ? (answers[currentQuestion.id]?.trim().length ?? 0) > 0
    : !!answers[currentQuestion?.id];

  // Loading state while generating questions
  if (isLoadingQuestions) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-card/80 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Analyzing Your Product</h3>
          <p className="text-muted-foreground">
            Generating tailored discovery questions based on your input...
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>This may take a few seconds</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30">
      <SectionContainer size="md" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={handlePrevious} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {showFrameworkSelection ? 'Back to Questions' : currentQuestionIndex === 0 ? 'Start Over' : 'Previous'}
          </Button>
          
          {!showFrameworkSelection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {/* Product Insights Banner */}
        {productInsights && !showFrameworkSelection && currentQuestionIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Product Analysis</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detected: <span className="font-medium">{productInsights.detectedType}</span>
                    {productInsights.keyFeatures.length > 0 && (
                      <span> • Key features: {productInsights.keyFeatures.slice(0, 3).join(', ')}</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!showFrameworkSelection && currentQuestion ? (
            /* Questions Flow */
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="space-y-6">
                  {/* Question Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getIconForCategory(currentQuestion.category)}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2 text-xs">
                        {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
                      </Badge>
                      <h2 className="text-2xl font-semibold">{currentQuestion.question}</h2>
                      {currentQuestion.description && (
                        <p className="text-muted-foreground mt-2">{currentQuestion.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                    <RadioGroup
                      value={answers[currentQuestion.id] || ""}
                      onValueChange={handleAnswer}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Label
                            htmlFor={option.value}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                              answers[currentQuestion.id] === option.value
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                          >
                            <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                            {option.icon && (
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                answers[currentQuestion.id] === option.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {option.icon}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{option.label}</div>
                              {option.description && (
                                <div className="text-sm text-muted-foreground mt-0.5">{option.description}</div>
                              )}
                            </div>
                            {answers[currentQuestion.id] === option.value && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </Label>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Text Input */}
                  {currentQuestion.type === 'text' && (
                    <Textarea
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[120px] text-lg"
                    />
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip this question
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="min-w-[160px]"
                    >
                      {currentQuestionIndex < questions.length - 1 ? 'Continue' : 'See Recommendations'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : showFrameworkSelection ? (
            /* Framework Selection */
            <motion.div
              key="framework-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Recommendation Banner */}
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Based on your answers</h3>
                    <p className="text-muted-foreground mt-1">
                      We recommend the <strong>{frameworks.find(f => f.id === recommendedFramework)?.name}</strong> framework 
                      {productInsights?.detectedType && (
                        <> for your {productInsights.detectedType} product</>
                      )}.
                      {productInsights?.suggestedNorthStar && (
                        <> Consider <strong>{productInsights.suggestedNorthStar}</strong> as your North Star metric.</>
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Framework Options */}
              <div>
                <h2 className="text-2xl font-semibold mb-2">Select Your Framework</h2>
                <p className="text-muted-foreground mb-6">
                  Choose how you want to visualize and organize your metrics
                </p>

                <div className="grid gap-4">
                  {frameworks.map((framework) => {
                    const isRecommended = framework.id === recommendedFramework;
                    const isSelected = selectedFramework === framework.id;

                    return (
                      <motion.div
                        key={framework.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Card
                          className={cn(
                            "p-6 cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : isRecommended
                              ? "border-primary/50 bg-primary/5"
                              : "hover:border-primary/30 hover:bg-muted/50"
                          )}
                          onClick={() => handleFrameworkSelect(framework.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center",
                              isSelected || isRecommended
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {framework.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{framework.name}</h3>
                                {isRecommended && (
                                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground mt-1">{framework.description}</p>
                            </div>
                            {isSelected && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-5 h-5 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end pt-4">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={!selectedFramework || externalLoading}
                  className="min-w-[200px]"
                >
                  {externalLoading ? 'Analyzing...' : 'Continue to Metrics'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SectionContainer>
    </div>
  );
}

// Fallback questions if AI generation fails
function getFallbackQuestions(): Question[] {
  return [
    {
      id: "primary_goal",
      question: "What is your primary business objective?",
      description: "This helps us recommend metrics aligned with your goals",
      type: "single_choice",
      category: "business",
      options: [
        { value: "growth", label: "User Growth", description: "Acquiring new users" },
        { value: "engagement", label: "User Engagement", description: "Increasing active usage" },
        { value: "monetization", label: "Revenue", description: "Converting to paying customers" },
        { value: "retention", label: "Retention", description: "Keeping users coming back" },
      ],
    },
    {
      id: "product_stage",
      question: "What stage is your product at?",
      description: "Different stages require different metric focuses",
      type: "single_choice",
      category: "product",
      options: [
        { value: "pre_launch", label: "Pre-launch / MVP", description: "Building and validating" },
        { value: "early_growth", label: "Early Growth", description: "Finding product-market fit" },
        { value: "scaling", label: "Scaling", description: "Rapid growth phase" },
        { value: "mature", label: "Mature", description: "Established, optimizing" },
      ],
    },
    {
      id: "business_model",
      question: "What is your business model?",
      description: "This determines which metrics matter most",
      type: "single_choice",
      category: "business",
      options: [
        { value: "subscription", label: "Subscription (SaaS)", description: "Recurring revenue" },
        { value: "marketplace", label: "Marketplace", description: "Connecting buyers and sellers" },
        { value: "ecommerce", label: "E-commerce", description: "Selling products" },
        { value: "freemium", label: "Freemium", description: "Free with paid upgrades" },
      ],
    },
    {
      id: "metric_view",
      question: "How do you prefer to view metric relationships?",
      description: "This helps choose the right visualization",
      type: "single_choice",
      category: "framework",
      options: [
        { value: "hierarchical", label: "Cause & Effect", description: "Tree structure showing drivers" },
        { value: "sequential", label: "User Journey", description: "Step-by-step progression" },
        { value: "cyclical", label: "Feedback Loops", description: "Self-reinforcing cycles" },
      ],
    },
  ];
}

// Helper to get icons for common option values
function getIconForValue(value: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    growth: <TrendingUp className="w-5 h-5" />,
    engagement: <Users className="w-5 h-5" />,
    monetization: <BarChart3 className="w-5 h-5" />,
    retention: <RefreshCw className="w-5 h-5" />,
    hierarchical: <GitBranch className="w-5 h-5" />,
    sequential: <Filter className="w-5 h-5" />,
    cyclical: <RefreshCw className="w-5 h-5" />,
  };
  return iconMap[value] || <Target className="w-5 h-5" />;
}
