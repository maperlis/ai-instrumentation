import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExistingMetric } from "@/types/existingMetrics";
import { FrameworkType } from "@/types/metricsFramework";

export interface UserSession {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed';
  current_step: string;
  product_url: string | null;
  product_image_data: string | null;
  product_video_data: string | null;
  product_details: string | null;
  existing_metrics: ExistingMetric[];
  framework_answers: Record<string, string>;
  selected_framework: FrameworkType | null;
  generated_metrics: any[];
  generated_events: any[];
  conversation_history: any[];
  orchestration_session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SaveSessionData {
  name?: string;
  status?: 'draft' | 'in_progress' | 'completed';
  current_step?: string;
  product_url?: string | null;
  product_image_data?: string | null;
  product_video_data?: string | null;
  product_details?: string | null;
  existing_metrics?: ExistingMetric[];
  framework_answers?: Record<string, string>;
  selected_framework?: FrameworkType | null;
  generated_metrics?: any[];
  generated_events?: any[];
  conversation_history?: any[];
  orchestration_session_id?: string | null;
}

export function useUserSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Parse JSONB fields with proper type assertions
      const parsedSessions: UserSession[] = (data || []).map(session => ({
        ...session,
        status: session.status as 'draft' | 'in_progress' | 'completed',
        existing_metrics: (session.existing_metrics as unknown as ExistingMetric[]) || [],
        framework_answers: (session.framework_answers as unknown as Record<string, string>) || {},
        selected_framework: session.selected_framework as FrameworkType | null,
        generated_metrics: (session.generated_metrics as unknown as any[]) || [],
        generated_events: (session.generated_events as unknown as any[]) || [],
        conversation_history: (session.conversation_history as unknown as any[]) || [],
      }));

      setSessions(parsedSessions);
    } catch (error: any) {
      console.error("Failed to fetch sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveSession = useCallback(async (data: SaveSessionData, sessionId?: string, silent: boolean = false): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!silent) {
          toast({
            title: "Not authenticated",
            description: "Please log in to save your session",
            variant: "destructive",
          });
        }
        return null;
      }

      // Cast to JSON-compatible types for Supabase
      const sessionData = {
        user_id: user.id,
        name: data.name || 'Untitled Session',
        status: data.status || 'draft',
        current_step: data.current_step || 'input',
        product_url: data.product_url || null,
        product_image_data: data.product_image_data || null,
        product_video_data: data.product_video_data || null,
        product_details: data.product_details || null,
        existing_metrics: JSON.parse(JSON.stringify(data.existing_metrics || [])),
        framework_answers: JSON.parse(JSON.stringify(data.framework_answers || {})),
        selected_framework: data.selected_framework || null,
        generated_metrics: JSON.parse(JSON.stringify(data.generated_metrics || [])),
        generated_events: JSON.parse(JSON.stringify(data.generated_events || [])),
        conversation_history: JSON.parse(JSON.stringify(data.conversation_history || [])),
        orchestration_session_id: data.orchestration_session_id || null,
      };

      if (sessionId) {
        // Update existing session
        const { error } = await supabase
          .from('user_sessions')
          .update(sessionData)
          .eq('id', sessionId);

        if (error) throw error;
        
        if (!silent) {
          toast({
            title: "Session saved",
            description: "Your progress has been saved",
          });
        }
        
        return sessionId;
      } else {
        // Create new session
        const { data: newSession, error } = await supabase
          .from('user_sessions')
          .insert(sessionData)
          .select('id')
          .single();

        if (error) throw error;
        
        if (!silent) {
          toast({
            title: "Session created",
            description: "Your session has been saved",
          });
        }
        
        return newSession.id;
      }
    } catch (error: any) {
      console.error("Failed to save session:", error);
      if (!silent) {
        toast({
          title: "Save failed",
          description: error.message || "Failed to save session",
          variant: "destructive",
        });
      }
      return null;
    }
  }, [toast]);

  const loadSession = useCallback(async (sessionId: string): Promise<UserSession | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const parsedSession: UserSession = {
        ...data,
        status: data.status as 'draft' | 'in_progress' | 'completed',
        existing_metrics: (data.existing_metrics as unknown as ExistingMetric[]) || [],
        framework_answers: (data.framework_answers as unknown as Record<string, string>) || {},
        selected_framework: data.selected_framework as FrameworkType | null,
        generated_metrics: (data.generated_metrics as unknown as any[]) || [],
        generated_events: (data.generated_events as unknown as any[]) || [],
        conversation_history: (data.conversation_history as unknown as any[]) || [],
      };

      setCurrentSession(parsedSession);
      return parsedSession;
    } catch (error: any) {
      console.error("Failed to load session:", error);
      toast({
        title: "Error",
        description: "Failed to load session",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session deleted",
        description: "The session has been removed",
      });
      
      return true;
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    fetchSessions,
    saveSession,
    loadSession,
    deleteSession,
    clearCurrentSession,
  };
}
