import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  OrchestrationState,
  OrchestrationRequest,
  OrchestrationResponse,
  ApprovalType,
} from "@/types/orchestration";

const initialState: OrchestrationState = {
  sessionId: null,
  status: 'idle',
  metrics: [],
  events: [],
  conversationHistory: [],
  approvalType: null,
  requiresApproval: false,
  inputData: null,
};

export function useOrchestration() {
  const [state, setState] = useState<OrchestrationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [newMetricIds, setNewMetricIds] = useState<string[]>([]);
  const { toast } = useToast();

  const invokeOrchestration = useCallback(async (request: OrchestrationRequest): Promise<OrchestrationResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<OrchestrationResponse>("generate-taxonomy", {
        body: request,
      });

      if (error) throw error;
      if (!data) throw new Error("No response from orchestration");

      // Track new metrics
      if (data.metrics) {
        const existingIds = state.metrics.map(m => m.id);
        const newIds = data.metrics.filter(m => !existingIds.includes(m.id)).map(m => m.id);
        if (newIds.length > 0) {
          setNewMetricIds(prev => [...prev, ...newIds]);
          // Clear new indicator after 5 seconds
          setTimeout(() => setNewMetricIds([]), 5000);
        }
      }

      // Merge conversation history instead of replacing
      const newHistory = data.conversationHistory || [];
      const mergedHistory = state.conversationHistory.length > 0 && newHistory.length > 0
        ? [...state.conversationHistory, ...newHistory]
        : newHistory.length > 0 
          ? newHistory 
          : state.conversationHistory;

      // Update state based on response
      setState(prev => ({
        ...prev,
        sessionId: data.sessionId || prev.sessionId,
        status: data.status,
        metrics: data.metrics || prev.metrics,
        events: data.events || prev.events,
        conversationHistory: mergedHistory,
        approvalType: data.approvalType || null,
        requiresApproval: data.requiresApproval || false,
        inputData: data.inputData || prev.inputData,
      }));

      return data;
    } catch (error: any) {
      console.error("Orchestration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, status: 'error' }));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, state.metrics]);

  const startSession = useCallback(async (inputData: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => {
    const response = await invokeOrchestration({
      ...inputData,
      action: 'start',
      mode: 'metrics',
    });
    return response;
  }, [invokeOrchestration]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!state.sessionId) {
      toast({
        title: "Error",
        description: "No active session",
        variant: "destructive",
      });
      return null;
    }

    // Optimistically add user message to history
    setState(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory,
        { role: 'user' as const, content: userMessage }
      ]
    }));

    const response = await invokeOrchestration({
      sessionId: state.sessionId,
      action: 'continue',
      userMessage,
      inputData: state.inputData,
      metrics: state.metrics,
      approvalType: state.approvalType,
    });
    return response;
  }, [state.sessionId, state.inputData, state.metrics, state.approvalType, invokeOrchestration, toast]);

  const approve = useCallback(async (approvalType: ApprovalType, selectedMetrics?: string[]) => {
    if (!state.sessionId) {
      toast({
        title: "Error",
        description: "No active session",
        variant: "destructive",
      });
      return null;
    }

    const response = await invokeOrchestration({
      sessionId: state.sessionId,
      action: 'approve',
      approvalType,
      selectedMetrics,
      inputData: state.inputData,
      metrics: state.metrics,
    });
    return response;
  }, [state.sessionId, state.inputData, state.metrics, invokeOrchestration, toast]);

  const reject = useCallback(async (userMessage?: string) => {
    if (!state.sessionId) return null;

    const response = await invokeOrchestration({
      sessionId: state.sessionId,
      action: 'reject',
      userMessage,
    });
    return response;
  }, [state.sessionId, invokeOrchestration]);

  const reset = useCallback(() => {
    setState(initialState);
    setNewMetricIds([]);
  }, []);

  return {
    state,
    isLoading,
    newMetricIds,
    startSession,
    sendMessage,
    approve,
    reject,
    reset,
  };
}
