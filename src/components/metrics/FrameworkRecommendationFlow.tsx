import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FrameworkType, ClarifyingQuestion, FrameworkRecommendation } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";

interface FrameworkRecommendationFlowProps {
  recommendation?: FrameworkRecommendation | null;
  clarifyingQuestions?: ClarifyingQuestion[];
  isLoading?: boolean;
  onAnswer: (answers: Record<string, string>) => void;
  onFrameworkSelect: (framework: FrameworkType) => void;
}

export function FrameworkRecommendationFlow({
  recommendation,
  clarifyingQuestions = [],
  isLoading,
  onAnswer,
  onFrameworkSelect,
}: FrameworkRecommendationFlowProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const currentQuestion = clarifyingQuestions[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(answers).length >= clarifyingQuestions.length;

  // Show recommendation once all questions are answered
  useEffect(() => {
    if (allQuestionsAnswered && clarifyingQuestions.length > 0) {
      setShowRecommendation(true);
    }
  }, [allQuestionsAnswered, clarifyingQuestions.length]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < clarifyingQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onAnswer(answers);
    }
  };

  const handleSkipToRecommendation = () => {
    onAnswer(answers);
    setShowRecommendation(true);
  };

  const frameworkDetails: Record<FrameworkType, { name: string; description: string; icon: string }> = {
    driver_tree: {
      name: "Driver Tree",
      description: "Perfect for understanding hierarchical cause-and-effect relationships",
      icon: "🌳",
    },
    conversion_funnel: {
      name: "Conversion Funnel",
      description: "Ideal for tracking user journey stages and drop-off points",
      icon: "📊",
    },
    growth_flywheel: {
      name: "Growth Flywheel",
      description: "Great for visualizing self-reinforcing growth loops",
      icon: "🔄",
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Framework Recommendation</h2>
            <p className="text-sm text-muted-foreground">
              Let me help you choose the best metrics framework
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground">
                Analyzing your product to recommend the best framework...
              </p>
            </motion.div>
          )}

          {/* Clarifying Questions */}
          {!showRecommendation && clarifyingQuestions.length > 0 && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Progress */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {clarifyingQuestions.length}</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentQuestionIndex + 1) / clarifyingQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="font-medium">{currentQuestion.question}</h3>

                    {/* Options */}
                    {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                      <RadioGroup
                        value={answers[currentQuestion.id] || ""}
                        onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                        className="space-y-2"
                      >
                        {currentQuestion.options.map((option, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                              answers[currentQuestion.id] === option
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => handleAnswer(currentQuestion.id, option)}
                          >
                            <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                            <Label
                              htmlFor={`${currentQuestion.id}-${index}`}
                              className="flex-1 cursor-pointer"
                            >
                              {option}
                            </Label>
                          </motion.div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Text Input */}
                    {currentQuestion.type === 'text' && (
                      <div className="flex gap-2">
                        <Input
                          value={answers[currentQuestion.id] || ""}
                          onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                          placeholder="Type your answer..."
                          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        />
                        <Button size="icon" onClick={handleNext}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleSkipToRecommendation}
                  className="text-muted-foreground"
                >
                  Skip questions
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                >
                  {currentQuestionIndex < clarifyingQuestions.length - 1 ? "Next" : "Get Recommendation"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Recommendation */}
          <AnimatePresence>
            {(showRecommendation || clarifyingQuestions.length === 0) && recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* AI Reasoning */}
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary mb-2">My Recommendation</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {recommendation.reasoning}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Framework Options */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Choose a framework:</h4>
                  
                  {(Object.keys(frameworkDetails) as FrameworkType[]).map((framework) => {
                    const details = frameworkDetails[framework];
                    const isRecommended = recommendation.recommendedFramework === framework;
                    
                    return (
                      <motion.div
                        key={framework}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Card
                          className={cn(
                            "p-4 cursor-pointer transition-all",
                            isRecommended
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => onFrameworkSelect(framework)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{details.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{details.name}</h4>
                                {isRecommended && (
                                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {details.description}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Confidence indicator */}
                {recommendation.confidence && (
                  <div className="text-center text-xs text-muted-foreground">
                    Confidence: {Math.round(recommendation.confidence * 100)}%
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - no questions, waiting for recommendation */}
          {!isLoading && clarifyingQuestions.length === 0 && !recommendation && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Waiting for product analysis to recommend a framework...
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
