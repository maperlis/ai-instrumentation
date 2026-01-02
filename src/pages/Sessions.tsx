import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, Trash2, Clock, CheckCircle2, FileEdit, 
  ArrowRight, Calendar, FolderOpen, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageContainer, SectionContainer } from "@/components/design-system";
import { AppHeader } from "@/components/design-system/AppHeader";
import { useUserSessions, UserSession } from "@/hooks/useUserSessions";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-primary/10 text-primary",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-600",
  },
};

const stepLabels: Record<string, string> = {
  input: "Product Context",
  "framework-questions": "Framework Questions",
  visualization: "Metrics Visualization",
  results: "Event Taxonomy",
};

export default function Sessions() {
  const navigate = useNavigate();
  const { sessions, isLoading, deleteSession } = useUserSessions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNewSession = () => {
    navigate("/app");
  };

  const handleResumeSession = (sessionId: string) => {
    navigate(`/app?session=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    await deleteSession(sessionId);
    setDeletingId(null);
  };

  const renderSessionCard = (session: UserSession, index: number) => {
    const status = statusConfig[session.status];
    const StatusIcon = status.icon;
    const lastUpdated = formatDistanceToNow(new Date(session.updated_at), { addSuffix: true });

    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-foreground truncate">
                  {session.name || "Untitled Session"}
                </h3>
                <Badge variant="secondary" className={status.className}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {lastUpdated}
                </span>
                {session.current_step && (
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    {stepLabels[session.current_step] || session.current_step}
                  </span>
                )}
              </div>

              {session.product_details && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {session.product_details}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {session.existing_metrics?.length > 0 && (
                  <span className="px-2 py-0.5 bg-muted rounded">
                    {session.existing_metrics.length} metrics
                  </span>
                )}
                {session.generated_events?.length > 0 && (
                  <span className="px-2 py-0.5 bg-muted rounded">
                    {session.generated_events.length} events
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleResumeSession(session.id)}
                className="gap-1.5"
              >
                {session.status === 'completed' ? 'View' : 'Resume'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deletingId === session.id}
                  >
                    {deletingId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{session.name || 'Untitled Session'}" and all its data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteSession(session.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <PageContainer>
      <AppHeader />

      <SectionContainer size="md" className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Sessions
            </h1>
            <p className="text-muted-foreground">
              Resume saved work or start a new analysis
            </p>
          </div>
          <Button onClick={handleNewSession} className="gap-2">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 border-dashed">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No sessions yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start a new analysis and save your progress to come back later
            </p>
            <Button onClick={handleNewSession} className="gap-2">
              <Plus className="w-4 h-4" />
              Start New Session
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => renderSessionCard(session, index))}
          </div>
        )}
      </SectionContainer>
    </PageContainer>
  );
}
