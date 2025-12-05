import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'elevated';
  hoverEffect?: 'ring' | 'lift' | 'glow' | 'none';
}

export const FeatureCard = ({ 
  children, 
  className, 
  variant = 'default',
  hoverEffect = 'ring'
}: FeatureCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 md:p-8 transition-all duration-300",
        // Variants
        variant === 'default' && "bg-card border border-border",
        variant === 'dark' && "bg-surface-dark-card border border-border/10",
        variant === 'elevated' && "bg-card border border-border shadow-lg",
        // Hover effects
        hoverEffect === 'ring' && "hover:ring-2 hover:ring-primary/50",
        hoverEffect === 'lift' && "hover:-translate-y-1 hover:shadow-xl",
        hoverEffect === 'glow' && "hover:shadow-glow",
        hoverEffect === 'none' && "",
        className
      )}
    >
      {children}
    </div>
  );
};
