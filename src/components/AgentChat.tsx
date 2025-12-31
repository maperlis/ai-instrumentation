import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { ConversationMessage } from "@/types/orchestration";

// Simple markdown renderer for bold, italic, and bullet points
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Process inline formatting (bold and italic)
    const processInline = (content: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let remaining = content;
      let keyIndex = 0;

      while (remaining.length > 0) {
        // Match **bold** or *italic*
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);

        // Find the earliest match
        let earliestMatch: { type: 'bold' | 'italic'; match: RegExpMatchArray } | null = null;
        
        if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
          earliestMatch = { type: 'bold', match: boldMatch };
        } else if (italicMatch) {
          earliestMatch = { type: 'italic', match: italicMatch };
        }

        if (earliestMatch && earliestMatch.match.index !== undefined) {
          // Add text before the match
          if (earliestMatch.match.index > 0) {
            parts.push(remaining.slice(0, earliestMatch.match.index));
          }
          
          // Add the formatted text
          if (earliestMatch.type === 'bold') {
            parts.push(
              <strong key={`bold-${lineIndex}-${keyIndex++}`} className="font-semibold">
                {earliestMatch.match[1]}
              </strong>
            );
          } else {
            parts.push(
              <em key={`italic-${lineIndex}-${keyIndex++}`}>
                {earliestMatch.match[1]}
              </em>
            );
          }
          
          remaining = remaining.slice(earliestMatch.match.index + earliestMatch.match[0].length);
        } else {
          parts.push(remaining);
          remaining = '';
        }
      }
      
      return parts;
    };

    // Check if line is a bullet point
    const bulletMatch = line.match(/^(\s*)([-•*])\s+(.*)$/);
    
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[3];
      elements.push(
        <div key={`line-${lineIndex}`} className="flex gap-2" style={{ paddingLeft: `${indent * 8}px` }}>
          <span className="text-muted-foreground">•</span>
          <span>{processInline(content)}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={`line-${lineIndex}`} className="h-2" />);
    } else {
      elements.push(
        <div key={`line-${lineIndex}`}>{processInline(line)}</div>
      );
    }
  });

  return elements;
}
interface AgentChatProps {
  conversationHistory: ConversationMessage[];
  agentName: string;
  agentDescription: string;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export function AgentChat({
  conversationHistory,
  agentName,
  agentDescription,
  isLoading,
  onSendMessage,
  placeholder = "Ask a question about the metrics...",
}: AgentChatProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{agentName}</h3>
            <p className="text-xs text-muted-foreground">{agentDescription}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-primary/10'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.agent && msg.role === 'assistant' && (
                  <Badge variant="outline" className="mb-2 text-xs bg-background">
                    {msg.agent}
                  </Badge>
                )}
                <div className="text-sm space-y-1">{renderMarkdown(msg.content)}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
