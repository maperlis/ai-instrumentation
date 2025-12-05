import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Target, Users, TrendingUp, BarChart3, RefreshCw, GitBranch, Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { FrameworkType } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";
import { SectionContainer } from "@/components/design-system";

interface Question {
  id: string;
  question: string;
  description?: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  options?: { value: string; label: string; description?: string; icon?: React.ReactNode }[];
  category: 'business' | 'product' | 'metrics' | 'framework';
}

const frameworkQuestions: Question[] = [
  {
    id: 'primary_goal',
    question: 'What is the primary goal you want to measure?',
    description: 'This helps us recommend metrics aligned with your objectives',
    type: 'single_choice',
    category: 'business',
    options: [
      { value: 'growth', label: 'User Growth', description: 'Acquiring new users and expanding reach', icon: <TrendingUp className="w-5 h-5" /> },
      { value: 'engagement', label: 'User Engagement', description: 'Increasing active usage and time spent', icon: <Users className="w-5 h-5" /> },
      { value: 'monetization', label: 'Revenue & Monetization', description: 'Converting users to paying customers', icon: <BarChart3 className="w-5 h-5" /> },
      { value: 'retention', label: 'User Retention', description: 'Keeping users coming back', icon: <RefreshCw className="w-5 h-5" /> },
    ],
  },
  {
    id: 'product_stage',
    question: 'What stage is your product at?',
    description: 'Different stages require different metric focuses',
    type: 'single_choice',
    category: 'product',
    options: [
      { value: 'pre_launch', label: 'Pre-launch / MVP', description: 'Building initial product, validating ideas' },
      { value: 'early_growth', label: 'Early Growth', description: 'Finding product-market fit, initial traction' },
      { value: 'scaling', label: 'Scaling', description: 'Rapid growth, optimizing funnels' },
      { value: 'mature', label: 'Mature', description: 'Established product, focus on retention and efficiency' },
    ],
  },
  {
    id: 'business_model',
    question: 'What is your primary business model?',
    description: 'This determines which metrics matter most',
    type: 'single_choice',
    category: 'business',
    options: [
      { value: 'subscription', label: 'Subscription (SaaS)', description: 'Recurring revenue from subscribers' },
      { value: 'marketplace', label: 'Marketplace', description: 'Connecting buyers and sellers' },
      { value: 'ecommerce', label: 'E-commerce', description: 'Selling products directly' },
      { value: 'freemium', label: 'Freemium', description: 'Free tier with paid upgrades' },
      { value: 'advertising', label: 'Ad-supported', description: 'Revenue from advertising' },
    ],
  },
  {
    id: 'metric_complexity',
    question: 'How do you prefer to view metric relationships?',
    description: 'This helps us choose the right visualization framework',
    type: 'single_choice',
    category: 'framework',
    options: [
      { value: 'hierarchical', label: 'Cause & Effect Hierarchy', description: 'See how metrics drive each other in a tree structure', icon: <GitBranch className="w-5 h-5" /> },
      { value: 'sequential', label: 'Step-by-Step Journey', description: 'Track user progression through stages', icon: <Filter className="w-5 h-5" /> },
      { value: 'cyclical', label: 'Feedback Loops', description: 'Understand self-reinforcing growth cycles', icon: <RefreshCw className="w-5 h-5" /> },
    ],
  },
  {
    id: 'key_actions',
    question: 'What are the most important user actions in your product?',
    description: 'List 2-3 key actions users take (e.g., "sign up", "make purchase", "invite friend")',
    type: 'text',
    category: 'product',
  },
  {
    id: 'north_star_focus',
    question: 'What single metric best represents value delivered to users?',
    description: 'This will become your North Star metric',
    type: 'single_choice',
    category: 'metrics',
    options: [
      { value: 'active_users', label: 'Active Users', description: 'Daily/Weekly/Monthly active users' },
      { value: 'transactions', label: 'Transactions', description: 'Number of purchases or conversions' },
      { value: 'content_consumed', label: 'Content Consumed', description: 'Articles read, videos watched, etc.' },
      { value: 'connections_made', label: 'Connections Made', description: 'Matches, messages, follows' },
      { value: 'custom', label: 'Custom Metric', description: "I'll define my own North Star" },
    ],
  },
];

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

interface FrameworkQuestionsPageProps {
  onBack: () => void;
  onComplete: (answers: Record<string, string>, selectedFramework: FrameworkType) => void;
  isLoading?: boolean;
}

export function FrameworkQuestionsPage({ onBack, onComplete, isLoading }: FrameworkQuestionsPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFrameworkSelection, setShowFrameworkSelection] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType | null>(null);

  const currentQuestion = frameworkQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / frameworkQuestions.length) * 100;

  // Calculate recommended framework based on answers
  const recommendedFramework = useMemo((): FrameworkType => {
    const scores: Record<FrameworkType, number> = {
      driver_tree: 0,
      conversion_funnel: 0,
      growth_flywheel: 0,
    };

    // Score based on metric complexity preference
    if (answers.metric_complexity === 'hierarchical') scores.driver_tree += 3;
    if (answers.metric_complexity === 'sequential') scores.conversion_funnel += 3;
    if (answers.metric_complexity === 'cyclical') scores.growth_flywheel += 3;

    // Score based on business model
    if (answers.business_model === 'subscription') scores.driver_tree += 2;
    if (answers.business_model === 'ecommerce') scores.conversion_funnel += 2;
    if (answers.business_model === 'marketplace') scores.growth_flywheel += 2;
    if (answers.business_model === 'freemium') scores.conversion_funnel += 1;

    // Score based on product stage
    if (answers.product_stage === 'mature') scores.driver_tree += 1;
    if (answers.product_stage === 'early_growth') scores.conversion_funnel += 1;
    if (answers.product_stage === 'scaling') scores.growth_flywheel += 2;

    // Score based on primary goal
    if (answers.primary_goal === 'growth') scores.growth_flywheel += 2;
    if (answers.primary_goal === 'monetization') scores.conversion_funnel += 2;
    if (answers.primary_goal === 'retention') scores.driver_tree += 1;

    // Find highest score
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][0] as FrameworkType;
  }, [answers]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < frameworkQuestions.length - 1) {
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
                <span>Question {currentQuestionIndex + 1} of {frameworkQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!showFrameworkSelection ? (
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
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
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
                  <div className="flex justify-end pt-4">
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="min-w-[160px]"
                    >
                      {currentQuestionIndex < frameworkQuestions.length - 1 ? 'Continue' : 'See Recommendations'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
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
                      for your {answers.business_model?.replace('_', ' ')} product focused on {answers.primary_goal?.replace('_', ' ')}.
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
                  disabled={!selectedFramework || isLoading}
                  className="min-w-[200px]"
                >
                  {isLoading ? 'Analyzing...' : 'Continue to Metrics'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </div>
  );
}
