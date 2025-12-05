import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface IconContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}

export const IconContainer = ({ 
  children, 
  className, 
  variant = 'primary',
  size = 'md'
}: IconContainerProps) => {
  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center border",
        // Sizes
        size === 'sm' && "h-8 w-8",
        size === 'md' && "h-12 w-12",
        size === 'lg' && "h-16 w-16",
        // Variants
        variant === 'primary' && "bg-primary/10 text-primary border-primary/20",
        variant === 'secondary' && "bg-secondary/10 text-secondary border-secondary/20",
        variant === 'accent' && "bg-accent/10 text-accent border-accent/20",
        variant === 'success' && "bg-success/10 text-success border-success/20",
        variant === 'warning' && "bg-warning/10 text-warning border-warning/20",
        variant === 'destructive' && "bg-destructive/10 text-destructive border-destructive/20",
        variant === 'muted' && "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {children}
    </div>
  );
};
