import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SectionContainer = ({ children, className, size = 'lg' }: SectionContainerProps) => {
  return (
    <div
      className={cn(
        "mx-auto px-4 md:px-6",
        size === 'sm' && "max-w-2xl",
        size === 'md' && "max-w-4xl",
        size === 'lg' && "max-w-6xl",
        size === 'xl' && "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
};
