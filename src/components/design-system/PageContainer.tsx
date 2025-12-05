import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'gradient';
}

export const PageContainer = ({ children, className, variant = 'default' }: PageContainerProps) => {
  return (
    <div
      className={cn(
        "min-h-screen",
        variant === 'default' && "bg-background",
        variant === 'dark' && "bg-surface-dark",
        variant === 'gradient' && "gradient-hero",
        className
      )}
    >
      {children}
    </div>
  );
};
