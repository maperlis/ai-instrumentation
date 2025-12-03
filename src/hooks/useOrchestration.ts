import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  OrchestrationState,
  OrchestrationRequest,
  OrchestrationResponse,
  ActionType,
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
};

export function useOrchestration() {
  const [state, setState] = useState<OrchestrationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const invokeOrchestration = useCallback(async (request: OrchestrationRequest): Promise<OrchestrationResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<OrchestrationResponse>("generate-taxonomy", {
        body: request,
      });

      if (error) throw error;
      if (!data) throw new Error("No response from orchestration");

      // Update state based on response
      setState(prev => ({
        ...prev,
        sessionId: data.sessionId || prev.sessionId,
        status: data.status,
        metrics: data.metrics || prev.metrics,
        events: data.events || prev.events,
        conversationHistory: data.conversationHistory || prev.conversationHistory,
        approvalType: data.approvalType || null,
        requiresApproval: data.requiresApproval || false,
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
  }, [toast]);

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
    });
    return response;
  }, [state.sessionId, invokeOrchestration, toast]);

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
  }, []);

  return {
    state,
    isLoading,
    startSession,
    approve,
    reject,
    reset,
  };
}
