import React from 'react';
import { Button } from '../ui/button';

interface LandingPageSectionProps {
  clientNames: string;
  onStartPlanning: () => void;
  onLaunchOnboarding: () => void;
}

export const LandingPageSection: React.FC<LandingPageSectionProps> = ({ 
  clientNames, 
  onStartPlanning, 
  onLaunchOnboarding 
}) => {
  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center text-white bg-cover bg-center"
      style={{ backgroundImage: "url('/imgs/welcome-background.png')" }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 flex flex-col items-center gap-4 px-2">
        <h1 className="text-4xl font-serif md:text-6xl">
          Welcome, <br /> {clientNames}!
        </h1>
        <p className="text-lg font-sans font-base md:text-xl antialiased">
          We&apos;re so excited to help you plan your perfect day.
        </p>
        <div className="flex flex-col gap-2 w-full px-2 mt-4">
          <Button
            size="sm"
            className="w-full text-lg tracking-wide"
            onClick={onLaunchOnboarding}
          >
            Watch Tutorial
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartPlanning}
            className="w-full text-lg tracking-wide"
          >
            Start Planning
          </Button>
        </div>
      
      </div>
    </div>
  );
};

