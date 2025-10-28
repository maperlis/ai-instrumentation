import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { InputSection } from "@/components/InputSection";
import { ResultsSection } from "@/components/ResultsSection";
import { TaxonomyEvent } from "@/types/taxonomy";

const Index = () => {
  const [results, setResults] = useState<TaxonomyEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero">
        <HeroSection />
        <InputSection 
          onResults={setResults} 
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
      
      {results && !isLoading && (
        <ResultsSection results={results} />
      )}
    </div>
  );
};

export default Index;
