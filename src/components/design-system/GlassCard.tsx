import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

export const GlassCard = ({ children, className, variant = 'light' }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 md:p-8 backdrop-blur-md border transition-all duration-300",
        variant === 'light' && "bg-background/80 border-border/50",
        variant === 'dark' && "bg-surface-dark/80 border-border/10",
        className
      )}
    >
      {children}
    </div>
  );
};
